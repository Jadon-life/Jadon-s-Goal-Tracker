import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const goalReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.goalId, parseInt(id)))
      .orderBy(desc(reminders.reminderTime));

    return NextResponse.json(goalReminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
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
    const { reminderTime, message } = body;

    if (!reminderTime) {
      return NextResponse.json(
        { error: "Reminder time is required" },
        { status: 400 }
      );
    }

    const newReminder = await db
      .insert(reminders)
      .values({
        goalId: parseInt(id),
        reminderTime: new Date(reminderTime),
        message: message || "",
        isActive: true,
        fired: false,
      })
      .returning();

    return NextResponse.json(newReminder[0], { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
