import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reminders, goals } from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkDue = searchParams.get("check_due");

  try {
    if (checkDue === "true") {
      // Get reminders that are due and haven't fired yet
      const now = new Date();
      const dueReminders = await db
        .select({
          id: reminders.id,
          goalId: reminders.goalId,
          reminderTime: reminders.reminderTime,
          message: reminders.message,
          isActive: reminders.isActive,
          fired: reminders.fired,
          createdAt: reminders.createdAt,
          goalTitle: goals.title,
          goalCategory: goals.category,
        })
        .from(reminders)
        .innerJoin(goals, eq(reminders.goalId, goals.id))
        .where(
          and(
            eq(reminders.isActive, true),
            eq(reminders.fired, false),
            lte(reminders.reminderTime, now)
          )
        )
        .orderBy(desc(reminders.reminderTime));

      return NextResponse.json(dueReminders);
    }

    // Get all reminders with goal info
    const allReminders = await db
      .select({
        id: reminders.id,
        goalId: reminders.goalId,
        reminderTime: reminders.reminderTime,
        message: reminders.message,
        isActive: reminders.isActive,
        fired: reminders.fired,
        createdAt: reminders.createdAt,
        goalTitle: goals.title,
        goalCategory: goals.category,
      })
      .from(reminders)
      .innerJoin(goals, eq(reminders.goalId, goals.id))
      .orderBy(desc(reminders.reminderTime));

    return NextResponse.json(allReminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}
