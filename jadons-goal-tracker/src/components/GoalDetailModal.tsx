"use client";

import { useState, useEffect, useCallback } from "react";
import { Goal, Milestone, Reminder } from "./GoalDashboard";
import ReminderScheduler from "./ReminderScheduler";
import { parseDaysBefore, formatDaysBefore, randomReminderTime } from "@/lib/reminders";

interface GoalDetailModalProps {
  goal: Goal;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

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

export default function GoalDetailModal({
  goal,
  onClose,
  onUpdated,
  onDeleted,
}: GoalDetailModalProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newMilestone, setNewMilestone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDescription, setEditDescription] = useState(goal.description || "");
  const [editProgress, setEditProgress] = useState(goal.progress);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"milestones" | "reminders">("milestones");

  // Manual reminder form state
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderQuick, setReminderQuick] = useState("");

  // Smart reminder schedule state (mirrors the goal, editable, saved on demand)
  const [smartEnabled, setSmartEnabled] = useState(goal.reminderEnabled);
  const [smartTime, setSmartTime] = useState(goal.reminderTime || randomReminderTime());
  const [smartDaysBefore, setSmartDaysBefore] = useState<number[]>(
    parseDaysBefore(goal.reminderDaysBefore) 
  );
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const scheduleDirty =
    smartEnabled !== goal.reminderEnabled ||
    smartTime !== goal.reminderTime ||
    formatDaysBefore(smartDaysBefore) !== formatDaysBefore(parseDaysBefore(goal.reminderDaysBefore));

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch(`/api/goals/${goal.id}/milestones`);
      const data = await res.json();
      setMilestones(data);
    } catch (error) {
      console.error("Failed to fetch milestones:", error);
    }
  }, [goal.id]);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch(`/api/goals/${goal.id}/reminders`);
      const data = await res.json();
      setReminders(data);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
  }, [goal.id]);

  useEffect(() => {
    fetchMilestones();
    fetchReminders();
  }, [fetchMilestones, fetchReminders]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.trim()) return;

    try {
      await fetch(`/api/goals/${goal.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newMilestone }),
      });
      setNewMilestone("");
      fetchMilestones();
      onUpdated();
    } catch (error) {
      console.error("Failed to add milestone:", error);
    }
  };

  const handleToggleMilestone = async (milestone: Milestone) => {
    try {
      await fetch(`/api/milestones/${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !milestone.completed }),
      });
      fetchMilestones();
      onUpdated();
    } catch (error) {
      console.error("Failed to toggle milestone:", error);
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    try {
      await fetch(`/api/milestones/${milestoneId}`, { method: "DELETE" });
      fetchMilestones();
      onUpdated();
    } catch (error) {
      console.error("Failed to delete milestone:", error);
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          progress: editProgress,
        }),
      });
      setIsEditing(false);
      onUpdated();
    } catch (error) {
      console.error("Failed to update goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          progress: status === "completed" ? 100 : goal.progress,
        }),
      });
      onUpdated();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      onDeleted();
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  // Manual reminder handlers
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();

    let dateTime: Date;

    if (reminderQuick) {
      const now = new Date();
      const minutes = parseInt(reminderQuick);
      dateTime = new Date(now.getTime() + minutes * 60000);
    } else {
      if (!reminderDate || !reminderTime) return;
      dateTime = new Date(`${reminderDate}T${reminderTime}`);
    }

    if (dateTime <= new Date()) {
      alert("Please set a reminder in the future");
      return;
    }

    try {
      await fetch(`/api/goals/${goal.id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderTime: dateTime.toISOString(),
          message: reminderMessage || `Time to work on: ${goal.title}`,
        }),
      });
      setShowReminderForm(false);
      setReminderDate("");
      setReminderTime("");
      setReminderMessage("");
      setReminderQuick("");
      fetchReminders();

      // Request notification permission if not granted
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error("Failed to add reminder:", error);
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      fetchReminders();
    } catch (error) {
      console.error("Failed to delete reminder:", error);
    }
  };

  // Smart reminder schedule handler
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setScheduleSaved(false);
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderEnabled: smartEnabled,
          reminderTime: smartTime,
          reminderDaysBefore: formatDaysBefore(smartDaysBefore),
        }),
      });
      fetchReminders();
      onUpdated();
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save reminder schedule:", error);
    } finally {
      setSavingSchedule(false);
    }
  };

  const emoji = categoryEmoji[goal.category] || "🎯";
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const activeReminders = reminders.filter((r) => r.isActive && !r.fired);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{emoji}</div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-bold text-surface-800 dark:text-surface-100 bg-transparent border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-1 focus:border-ocean-400 outline-none"
                  />
                ) : (
                  <h2
                    className="text-xl font-bold text-surface-800 dark:text-surface-100"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {goal.title}
                  </h2>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-medium text-surface-400 dark:text-surface-500">
                    {goal.category}
                  </span>
                  <span className="text-surface-300 dark:text-surface-700">·</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      goal.status === "completed"
                        ? "bg-meadow-50 text-meadow-700 dark:bg-meadow-950/60 dark:text-meadow-300"
                        : goal.status === "paused"
                        ? "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400"
                        : "bg-ocean-50 text-ocean-700 dark:bg-ocean-950/60 dark:text-ocean-300"
                    }`}
                  >
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </span>
                  {activeReminders.length > 0 && (
                    <>
                      <span className="text-surface-300 dark:text-surface-700">·</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 flex items-center gap-1">
                        ⏰ {activeReminders.length}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-surface-400"
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

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
              Description
            </h3>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 dark:focus:ring-ocean-900 outline-none transition-all text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {goal.description || "No description provided."}
              </p>
            )}
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                Progress
              </h3>
              <span className="text-lg font-bold text-ocean-600 dark:text-ocean-400 font-mono">
                {isEditing ? editProgress : goal.progress}%
              </span>
            </div>
            {isEditing ? (
              <input
                type="range"
                min={0}
                max={100}
                value={editProgress}
                onChange={(e) => setEditProgress(parseInt(e.target.value))}
                className="w-full accent-ocean-500"
              />
            ) : (
              <div className="w-full h-3 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 progress-gradient"
                  style={{
                    width: `${goal.progress}%`,
                    backgroundSize: "220% 100%",
                    backgroundPosition: `${100 - goal.progress}% 0`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Info Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3">
              <div className="text-[10px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                Priority
              </div>
              <div
                className={`text-sm font-semibold mt-1 capitalize ${
                  goal.priority === "high"
                    ? "text-violet-600 dark:text-violet-400"
                    : goal.priority === "medium"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-meadow-600 dark:text-meadow-400"
                }`}
              >
                {goal.priority}
              </div>
            </div>
            <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3">
              <div className="text-[10px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                Target Date
              </div>
              <div className="text-sm font-semibold mt-1 text-surface-700 dark:text-surface-200 font-mono">
                {goal.targetDate
                  ? new Date(goal.targetDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No date set"}
              </div>
            </div>
            <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3">
              <div className="text-[10px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                Created
              </div>
              <div className="text-sm font-semibold mt-1 text-surface-700 dark:text-surface-200 font-mono">
                {new Date(goal.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Tabs: Milestones / Reminders */}
          <div>
            <div className="flex border-b border-surface-100 dark:border-surface-800 mb-4">
              <button
                onClick={() => setActiveTab("milestones")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === "milestones"
                    ? "border-ocean-500 text-ocean-600 dark:text-ocean-400"
                    : "border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300"
                }`}
              >
                📋 Milestones
                {milestones.length > 0 && (
                  <span className="ml-1.5 text-xs bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded-full">
                    {completedMilestones}/{milestones.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("reminders")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === "reminders"
                    ? "border-ocean-500 text-ocean-600 dark:text-ocean-400"
                    : "border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300"
                }`}
              >
                ⏰ Reminders
                {activeReminders.length > 0 && (
                  <span className="ml-1.5 text-xs bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 px-1.5 py-0.5 rounded-full">
                    {activeReminders.length}
                  </span>
                )}
              </button>
            </div>

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <div>
                <div className="space-y-2 mb-3">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                        milestone.completed
                          ? "bg-meadow-50/50 dark:bg-meadow-950/20"
                          : "bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700"
                      }`}
                    >
                      <button
                        onClick={() => handleToggleMilestone(milestone)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                          milestone.completed
                            ? "bg-meadow-500 border-meadow-500"
                            : "border-surface-300 dark:border-surface-600 hover:border-ocean-400"
                        }`}
                      >
                        {milestone.completed && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          milestone.completed
                            ? "line-through text-surface-400 dark:text-surface-500"
                            : "text-surface-700 dark:text-surface-200"
                        }`}
                      >
                        {milestone.title}
                      </span>
                      <button
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-surface-300 dark:text-surface-600 hover:text-red-500 transition-all cursor-pointer"
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
                  ))}

                  {milestones.length === 0 && (
                    <p className="text-sm text-surface-400 dark:text-surface-500 text-center py-4">
                      No milestones yet. Add some to track your progress!
                    </p>
                  )}
                </div>

                <form onSubmit={handleAddMilestone} className="flex gap-2">
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    placeholder="Add a milestone..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 dark:focus:ring-ocean-900 outline-none transition-all text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMilestone.trim()}
                    className="px-4 py-2.5 rounded-xl bg-ocean-500 text-white text-sm font-medium hover:bg-ocean-600 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === "reminders" && (
              <div className="space-y-5">
                {/* Smart reminder schedule */}
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                    Countdown schedule
                  </h4>
                  <ReminderScheduler
                    targetDate={goal.targetDate}
                    enabled={smartEnabled}
                    time={smartTime}
                    daysBefore={smartDaysBefore}
                    onEnabledChange={setSmartEnabled}
                    onTimeChange={setSmartTime}
                    onDaysBeforeChange={setSmartDaysBefore}
                  />
                  {goal.targetDate && (
                    <button
                      onClick={handleSaveSchedule}
                      disabled={!scheduleDirty || savingSchedule}
                      className="mt-2 w-full py-2 rounded-xl bg-ocean-500 text-white text-sm font-medium hover:bg-ocean-600 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {savingSchedule
                        ? "Saving..."
                        : scheduleSaved
                        ? "✓ Saved"
                        : "Save schedule"}
                    </button>
                  )}
                </div>

                {/* Existing reminders */}
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                    All reminders
                  </h4>
                  <div className="space-y-2 mb-4">
                    {reminders.map((reminder) => {
                      const isPast =
                        new Date(reminder.reminderTime) < new Date();
                      return (
                        <div
                          key={reminder.id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                            reminder.fired
                              ? "bg-surface-50 dark:bg-surface-800 opacity-60"
                              : isPast
                              ? "bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900"
                              : "bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              reminder.fired
                                ? "bg-surface-200 dark:bg-surface-700"
                                : isPast
                                ? "bg-violet-100 dark:bg-violet-900"
                                : "bg-amber-100 dark:bg-amber-900"
                            }`}
                          >
                            <span className="text-sm">
                              {reminder.fired ? "✓" : "⏰"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">
                              {reminder.message || "Reminder"}
                              {reminder.isAuto && (
                                <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-meadow-50 dark:bg-meadow-950/60 text-meadow-600 dark:text-meadow-300 align-middle">
                                  🔁 Auto
                                </span>
                              )}
                            </p>
                            <p
                              className={`text-xs mt-0.5 font-mono ${
                                isPast && !reminder.fired
                                  ? "text-violet-500 dark:text-violet-400 font-medium"
                                  : "text-surface-400 dark:text-surface-500"
                              }`}
                            >
                              {new Date(reminder.reminderTime).toLocaleString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                              {reminder.fired && " — Fired"}
                              {isPast && !reminder.fired && " — Overdue!"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-surface-300 dark:text-surface-600 hover:text-red-500 transition-all cursor-pointer"
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
                      );
                    })}

                    {reminders.length === 0 && !showReminderForm && (
                      <div className="text-center py-6">
                        <div className="text-3xl mb-2">⏰</div>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          No reminders set for this goal
                        </p>
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                          Add a one-off reminder below, or turn on the countdown schedule above
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add one-off reminder */}
                  {showReminderForm ? (
                    <form
                      onSubmit={handleAddReminder}
                      className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-900 space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-2">
                        ⏰ Set a one-off reminder
                      </h4>

                      {/* Quick options */}
                      <div>
                        <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 block">
                          Quick Set
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "15 min", value: "15" },
                            { label: "30 min", value: "30" },
                            { label: "1 hour", value: "60" },
                            { label: "3 hours", value: "180" },
                            { label: "Tomorrow", value: "1440" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setReminderQuick(opt.value);
                                setReminderDate("");
                                setReminderTime("");
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                reminderQuick === opt.value
                                  ? "bg-amber-500 text-white"
                                  : "bg-white dark:bg-surface-800 border border-amber-200 dark:border-amber-900 text-surface-600 dark:text-surface-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Or custom date/time */}
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-amber-200 dark:bg-amber-900" />
                        <span className="text-[10px] font-medium text-amber-500 dark:text-amber-400 uppercase">
                          or custom
                        </span>
                        <div className="h-px flex-1 bg-amber-200 dark:bg-amber-900" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 block">
                            Date
                          </label>
                          <input
                            type="date"
                            value={reminderDate}
                            onChange={(e) => {
                              setReminderDate(e.target.value);
                              setReminderQuick("");
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900 focus:border-amber-400 outline-none text-sm bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 block">
                            Time
                          </label>
                          <input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => {
                              setReminderTime(e.target.value);
                              setReminderQuick("");
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900 focus:border-amber-400 outline-none text-sm bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100"
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1 block">
                          Message (optional)
                        </label>
                        <input
                          type="text"
                          value={reminderMessage}
                          onChange={(e) => setReminderMessage(e.target.value)}
                          placeholder={`e.g., Review progress on "${goal.title}"`}
                          className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900 focus:border-amber-400 outline-none text-sm bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowReminderForm(false);
                            setReminderQuick("");
                            setReminderDate("");
                            setReminderTime("");
                            setReminderMessage("");
                          }}
                          className="flex-1 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900 text-surface-600 dark:text-surface-300 text-sm font-medium hover:bg-white dark:hover:bg-surface-800 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            !reminderQuick && (!reminderDate || !reminderTime)
                          }
                          className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          ⏰ Set Reminder
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowReminderForm(true)}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>⏰</span> Add one-off reminder
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-surface-100 dark:border-surface-800">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-ocean-500 text-white text-sm font-medium hover:bg-ocean-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>

                {goal.status === "active" && (
                  <>
                    <button
                      onClick={() => handleStatusChange("paused")}
                      className="px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                    >
                      ⏸ Pause
                    </button>
                    <button
                      onClick={() => handleStatusChange("completed")}
                      className="px-4 py-2.5 rounded-xl border border-meadow-200 dark:border-meadow-900 text-meadow-700 dark:text-meadow-400 bg-meadow-50 dark:bg-meadow-950/30 text-sm font-medium hover:bg-meadow-100 dark:hover:bg-meadow-950/50 transition-colors cursor-pointer"
                    >
                      ✓ Complete
                    </button>
                  </>
                )}

                {goal.status === "paused" && (
                  <button
                    onClick={() => handleStatusChange("active")}
                    className="px-4 py-2.5 rounded-xl border border-ocean-200 dark:border-ocean-900 text-ocean-700 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-950/30 text-sm font-medium hover:bg-ocean-100 dark:hover:bg-ocean-950/50 transition-colors cursor-pointer"
                  >
                    ▶ Resume
                  </button>
                )}

                {goal.status === "completed" && (
                  <button
                    onClick={() => handleStatusChange("active")}
                    className="px-4 py-2.5 rounded-xl border border-ocean-200 dark:border-ocean-900 text-ocean-700 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-950/30 text-sm font-medium hover:bg-ocean-100 dark:hover:bg-ocean-950/50 transition-colors cursor-pointer"
                  >
                    ↩ Reopen
                  </button>
                )}

                <div className="flex-1" />

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400">Are you sure?</span>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2.5 rounded-xl text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
