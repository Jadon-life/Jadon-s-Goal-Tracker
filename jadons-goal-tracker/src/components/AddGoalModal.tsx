"use client";

import { useState } from "react";
import ReminderScheduler from "./ReminderScheduler";
import { DEFAULT_DAYS_BEFORE, formatDaysBefore, randomReminderTime } from "@/lib/reminders";

interface AddGoalModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const categories = [
  "Personal",
  "Health",
  "Career",
  "Education",
  "Finance",
  "Fitness",
  "Creative",
  "Travel",
  "Social",
  "Other",
];

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

export default function AddGoalModal({ onClose, onCreated }: AddGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState("medium");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Smart reminder settings. The base time is randomized once, lazily,
  // the first time a target date is set — not regenerated on every render.
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number[]>(DEFAULT_DAYS_BEFORE);

  const handleTargetDateChange = (value: string) => {
    setTargetDate(value);
    if (value && !reminderTime) {
      setReminderTime(randomReminderTime());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a goal title");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          targetDate,
          reminderEnabled: targetDate ? reminderEnabled : false,
          reminderTime: reminderTime || randomReminderTime(),
          reminderDaysBefore: formatDaysBefore(reminderDaysBefore),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create goal");
      }

      onCreated();
    } catch {
      setError("Failed to create goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="text-xl font-bold text-surface-800 dark:text-surface-100" style={{ fontFamily: "var(--font-display)" }}>
              Create New Goal
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Define what you want to achieve
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Goal Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Run a marathon, Learn Spanish..."
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800
                         text-surface-800 dark:text-surface-100 placeholder:text-surface-400
                         focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 dark:focus:ring-ocean-900 outline-none transition-all text-sm"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this goal important to you?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800
                         text-surface-800 dark:text-surface-100 placeholder:text-surface-400
                         focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 dark:focus:ring-ocean-900 outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer
                    ${
                      category === cat
                        ? "bg-ocean-50 dark:bg-ocean-950 border-2 border-ocean-400 text-ocean-700 dark:text-ocean-300"
                        : "bg-surface-50 dark:bg-surface-800 border-2 border-transparent text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
                    }`}
                >
                  <span className="text-lg">{categoryEmoji[cat]}</span>
                  <span className="truncate w-full text-center text-[10px]">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Priority
            </label>
            <div className="flex gap-2">
              {[
                { value: "low", label: "Low", color: "border-meadow-300 bg-meadow-50 text-meadow-700 dark:border-meadow-700 dark:bg-meadow-950 dark:text-meadow-300" },
                { value: "medium", label: "Medium", color: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300" },
                { value: "high", label: "High", color: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer
                    ${priority === p.value ? p.color : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => handleTargetDateChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800
                         text-surface-800 dark:text-surface-100
                         focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 dark:focus:ring-ocean-900 outline-none transition-all text-sm"
            />
          </div>

          {/* Smart Reminders */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Reminders
            </label>
            <ReminderScheduler
              targetDate={targetDate}
              enabled={reminderEnabled}
              time={reminderTime}
              daysBefore={reminderDaysBefore}
              onEnabledChange={setReminderEnabled}
              onTimeChange={setReminderTime}
              onDaysBeforeChange={setReminderDaysBefore}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 font-medium text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-ocean-500 to-violet-500 text-white font-medium text-sm
                       hover:from-ocean-600 hover:to-violet-600 transition-all shadow-lg shadow-ocean-500/25 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Goal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
