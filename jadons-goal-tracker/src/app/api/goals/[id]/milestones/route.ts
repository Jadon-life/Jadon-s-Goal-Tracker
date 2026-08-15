import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { milestones, goals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const goalMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.goalId, parseInt(id)));

    return NextResponse.json(goalMilestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const newMilestone = await db
      .insert(milestones)
      .values({
        goalId: parseInt(id),
        title: title.trim(),
        completed: false,
      })
      .returning();

    // Recalculate goal progress based on milestones
    const allMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.goalId, parseInt(id)));

    const completedCount = allMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / allMilestones.length) * 100);

    await db
      .update(goals)
      .set({ progress, updatedAt: new Date() })
      .where(eq(goals.id, parseInt(id)));

    return NextResponse.json(newMilestone[0], { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}
