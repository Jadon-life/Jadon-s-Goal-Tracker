import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { milestones, goals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { completed } = body;

    const updated = await db
      .update(milestones)
      .set({ completed })
      .where(eq(milestones.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Recalculate goal progress
    const goalId = updated[0].goalId;
    const allMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.goalId, goalId));

    const completedCount = allMilestones.filter((m) => m.completed).length;
    const progress =
      allMilestones.length > 0
        ? Math.round((completedCount / allMilestones.length) * 100)
        : 0;

    const updatedGoal = await db
      .update(goals)
      .set({
        progress,
        status: progress === 100 ? "completed" : "active",
        updatedAt: new Date(),
      })
      .where(eq(goals.id, goalId))
      .returning();

    return NextResponse.json({
      milestone: updated[0],
      goal: updatedGoal[0],
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
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
      .delete(milestones)
      .where(eq(milestones.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Recalculate goal progress
    const goalId = deleted[0].goalId;
    const allMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.goalId, goalId));

    const completedCount = allMilestones.filter((m) => m.completed).length;
    const progress =
      allMilestones.length > 0
        ? Math.round((completedCount / allMilestones.length) * 100)
        : 0;

    await db
      .update(goals)
      .set({ progress, updatedAt: new Date() })
      .where(eq(goals.id, goalId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    );
  }
}
