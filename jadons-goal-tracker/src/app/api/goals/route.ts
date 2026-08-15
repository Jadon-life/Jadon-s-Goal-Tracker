import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals, reminders } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import {
  DEFAULT_DAYS_BEFORE,
  computeScheduledReminders,
  formatDaysBefore,
  messageForOffset,
  parseDaysBefore,
  randomReminderTime,
} from "@/lib/reminders";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  try {
    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(goals.status, status));
    }
    if (category && category !== "all") {
      conditions.push(eq(goals.category, category));
    }

    const allGoals =
      conditions.length > 0
        ? await db
            .select()
            .from(goals)
            .where(and(...conditions))
            .orderBy(desc(goals.createdAt))
        : await db.select().from(goals).orderBy(desc(goals.createdAt));

    return NextResponse.json(allGoals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      targetDate,
      reminderEnabled,
      reminderTime,
      reminderDaysBefore,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Smart reminders only make sense when there's a target date. We keep
    // whatever the client chose (it may have let the person edit the base
    // time / days), falling back to a random generic time and the default
    // "3, 2, 1 days before + due date" cadence.
    const hasTargetDate = Boolean(targetDate);
    const finalReminderEnabled = hasTargetDate ? reminderEnabled !== false : false;
    const finalReminderTime =
      hasTargetDate && reminderTime ? reminderTime : hasTargetDate ? randomReminderTime() : "";
    const finalDaysBefore = hasTargetDate
      ? formatDaysBefore(
          reminderDaysBefore ? parseDaysBefore(reminderDaysBefore) : DEFAULT_DAYS_BEFORE
        )
      : formatDaysBefore(DEFAULT_DAYS_BEFORE);

    const newGoal = await db
      .insert(goals)
      .values({
        title: title.trim(),
        description: description || "",
        category: category || "Personal",
        priority: priority || "medium",
        targetDate: targetDate || "",
        progress: 0,
        status: "active",
        reminderEnabled: finalReminderEnabled,
        reminderTime: finalReminderTime,
        reminderDaysBefore: finalDaysBefore,
      })
      .returning();

    const goal = newGoal[0];

    if (finalReminderEnabled && hasTargetDate && finalReminderTime) {
      const scheduled = computeScheduledReminders(
        targetDate,
        finalReminderTime,
        parseDaysBefore(finalDaysBefore)
      );
      if (scheduled.length > 0) {
        await db.insert(reminders).values(
          scheduled.map((s) => ({
            goalId: goal.id,
            reminderTime: s.date,
            message: messageForOffset(goal.title, s.offset),
            isActive: true,
            fired: false,
            isAuto: true,
          }))
        );
      }
    }

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
