import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.fired !== undefined) updateData.fired = body.fired;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.message !== undefined) updateData.message = body.message;
    if (body.reminderTime !== undefined)
      updateData.reminderTime = new Date(body.reminderTime);

    const updated = await db
      .update(reminders)
      .set(updateData)
      .where(eq(reminders.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
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
      .delete(reminders)
      .where(eq(reminders.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
