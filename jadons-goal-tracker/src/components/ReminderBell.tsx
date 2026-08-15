"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Reminder } from "./GoalDashboard";

const categoryEmoji: Record<string, string> = {
  Personal: "🌟",
  Health: "💪",
  Career: "💼",
  Education: "📚",
  Finance: "💰",
  Fitness: "🏃",
  Creative: "🎨",
  Travel: "✈️",
  Social: "👥",
  Other: "📌",
};

export default function ReminderBell() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders");
      const data: Reminder[] = await res.json();
      setReminders(data);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPanel]);

  const activeReminders = reminders.filter((r) => r.isActive && !r.fired);
  const upcomingCount = activeReminders.length;

  const handleDeleteReminder = async (id: number) => {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    fetchReminders();
  };

  const formatReminderTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Overdue";
    if (diff < 60000) return "Less than a minute";
    if (diff < 3600000) return `${Math.round(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)} hr`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
      >
        <svg
          className="w-5 h-5 text-surface-500 dark:text-surface-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {upcomingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {upcomingCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showPanel && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden z-50 animate-scale-in">
          <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-gradient-to-r from-ocean-50 to-violet-50 dark:from-ocean-950/40 dark:to-violet-950/40">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-surface-800 dark:text-surface-100 text-sm flex items-center gap-2">
                <span>⏰</span> Reminders
              </h3>
              <span className="text-xs text-surface-400 dark:text-surface-500">
                {upcomingCount} upcoming
              </span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {reminders.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-surface-500 dark:text-surface-400">No reminders set</p>
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                  Open a goal and add a reminder
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-50 dark:divide-surface-800">
                {reminders.map((reminder) => {
                  const isPast = new Date(reminder.reminderTime) < new Date();
                  const emoji =
                    categoryEmoji[reminder.goalCategory || ""] || "🎯";

                  return (
                    <div
                      key={reminder.id}
                      className={`p-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors ${
                        reminder.fired ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">
                            {reminder.goalTitle}
                          </p>
                          {reminder.message && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
                              {reminder.message}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                reminder.fired
                                  ? "bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"
                                  : isPast
                                  ? "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300"
                                  : "bg-ocean-50 dark:bg-ocean-950/60 text-ocean-600 dark:text-ocean-300"
                              }`}
                            >
                              {reminder.fired
                                ? "✓ Fired"
                                : isPast
                                ? "⚠ Overdue"
                                : `⏳ ${formatReminderTime(reminder.reminderTime)}`}
                            </span>
                            {reminder.isAuto && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-meadow-50 dark:bg-meadow-950/60 text-meadow-600 dark:text-meadow-300">
                                🔁 Auto
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-surface-300 dark:text-surface-600 hover:text-red-500 transition-all cursor-pointer flex-shrink-0"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
