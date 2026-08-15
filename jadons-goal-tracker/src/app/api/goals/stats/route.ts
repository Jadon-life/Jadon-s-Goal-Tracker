import { NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";


export async function GET() {
  try {
    const allGoals = await db.select().from(goals);
    const activeGoals = allGoals.filter((g) => g.status === "active");
    const completedGoals = allGoals.filter((g) => g.status === "completed");
    const pausedGoals = allGoals.filter((g) => g.status === "paused");

    const avgProgress =
      activeGoals.length > 0
        ? Math.round(
            activeGoals.reduce((sum, g) => sum + g.progress, 0) /
              activeGoals.length
          )
        : 0;

    // Category breakdown
    const categories: Record<string, number> = {};
    allGoals.forEach((g) => {
      categories[g.category] = (categories[g.category] || 0) + 1;
    });

    return NextResponse.json({
      total: allGoals.length,
      active: activeGoals.length,
      completed: completedGoals.length,
      paused: pausedGoals.length,
      avgProgress,
      categories,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
