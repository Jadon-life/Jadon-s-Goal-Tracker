import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").default(""),
  category: varchar("category", { length: 100 }).notNull().default("Personal"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  targetDate: varchar("target_date", { length: 30 }).default(""),
  progress: integer("progress").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  // Smart reminder schedule for this goal. Reminders are auto-generated
  // relative to targetDate using reminderDaysBefore, fired at reminderTime.
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  reminderTime: varchar("reminder_time", { length: 5 }).default(""), // "HH:MM", 24h
  reminderDaysBefore: varchar("reminder_days_before", { length: 50 }).default("3,2,1,0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id")
    .references(() => goals.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id")
    .references(() => goals.id, { onDelete: "cascade" })
    .notNull(),
  reminderTime: timestamp("reminder_time").notNull(),
  message: varchar("message", { length: 500 }).notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  fired: boolean("fired").notNull().default(false),
  isAuto: boolean("is_auto").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
