import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals, reminders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  computeScheduledReminders,
  formatDaysBefore,
  messageForOffset,
  parseDaysBefore,
  randomReminderTime,
} from "@/lib/reminders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const goal = await db
      .select()
      .from(goals)
      .where(eq(goals.id, parseInt(id)));

    if (goal.length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json(goal[0]);
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const goalId = parseInt(id);
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      targetDate,
      progress,
      status,
      reminderEnabled,
      reminderTime,
      reminderDaysBefore,
    } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (targetDate !== undefined) updateData.targetDate = targetDate;
    if (progress !== undefined) updateData.progress = Math.min(100, Math.max(0, progress));
    if (status !== undefined) updateData.status = status;

    // Does this update touch the smart reminder schedule at all?
    const touchesReminderSettings =
      reminderEnabled !== undefined ||
      reminderTime !== undefined ||
      reminderDaysBefore !== undefined ||
      targetDate !== undefined;

    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (reminderTime !== undefined) updateData.reminderTime = reminderTime;
    if (reminderDaysBefore !== undefined)
      updateData.reminderDaysBefore = formatDaysBefore(parseDaysBefore(reminderDaysBefore));

    const updated = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, goalId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goal = updated[0];

    // Regenerate the auto-scheduled reminders whenever the schedule inputs
    // change. Manually-added reminders (isAuto = false) are left untouched.
    if (touchesReminderSettings) {
      await db
        .delete(reminders)
        .where(and(eq(reminders.goalId, goalId), eq(reminders.isAuto, true)));

      const effectiveTime = goal.reminderTime || randomReminderTime();
      const effectiveEnabled = goal.reminderEnabled;
      const effectiveTargetDate = goal.targetDate;

      if (effectiveEnabled && effectiveTargetDate && effectiveTime) {
        // Persist a generated time if the goal didn't have one yet.
        if (!goal.reminderTime) {
          await db
            .update(goals)
            .set({ reminderTime: effectiveTime })
            .where(eq(goals.id, goalId));
        }

        const scheduled = computeScheduledReminders(
          effectiveTargetDate,
          effectiveTime,
          parseDaysBefore(goal.reminderDaysBefore)
        );
        if (scheduled.length > 0) {
          await db.insert(reminders).values(
            scheduled.map((s) => ({
              goalId,
              reminderTime: s.date,
              message: messageForOffset(goal.title, s.offset),
              isActive: true,
              fired: false,
              isAuto: true,
            }))
          );
        }
      }
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deleted = await db
      .delete(goals)
      .where(eq(goals.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
