"use client";

import { useState, useEffect, useCallback } from "react";
import StatsBar from "./StatsBar";
import GoalCard from "./GoalCard";
import AddGoalModal from "./AddGoalModal";
import GoalDetailModal from "./GoalDetailModal";
import ReminderBell from "./ReminderBell";
import ReminderAlertOverlay from "./ReminderAlertOverlay";
import ThemeToggle from "./ThemeToggle";

export interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  targetDate: string;
  progress: number;
  status: string;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDaysBefore: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: number;
  goalId: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Reminder {
  id: number;
  goalId: number;
  reminderTime: string;
  message: string;
  isActive: boolean;
  fired: boolean;
  isAuto?: boolean;
  createdAt: string;
  goalTitle?: string;
  goalCategory?: string;
}

export interface Stats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  avgProgress: number;
  categories: Record<string, number>;
}

export default function GoalDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [firedReminders, setFiredReminders] = useState<Reminder[]>([]);

  const fetchGoals = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterCategory !== "all") params.set("category", filterCategory);

      const res = await fetch(`/api/goals?${params.toString()}`);
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  }, [filterStatus, filterCategory]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/goals/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchGoals(), fetchStats()]);
    setLoading(false);
  }, [fetchGoals, fetchStats]);

  // Check for due reminders every 15 seconds
  const checkDueReminders = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders?check_due=true");
      const due: Reminder[] = await res.json();
      if (due.length > 0) {
        setFiredReminders((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newOnes = due.filter((r) => !existingIds.has(r.id));
          return [...prev, ...newOnes];
        });
        // Mark them as fired on the server
        for (const r of due) {
          await fetch(`/api/reminders/${r.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fired: true }),
          });
        }
        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          for (const r of due) {
            new Notification(`⏰ Reminder: ${r.goalTitle || "Goal"}`, {
              body: r.message || "Time to work on your goal!",
              icon: "/images/og-image.jpg",
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to check reminders:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    // Check reminders on mount and every 15s
    checkDueReminders();
    const interval = setInterval(checkDueReminders, 15000);
    return () => clearInterval(interval);
  }, [checkDueReminders]);

  const handleGoalCreated = () => {
    loadData();
    setShowAddModal(false);
  };

  const handleGoalUpdated = () => {
    loadData();
    if (selectedGoal) {
      fetch(`/api/goals/${selectedGoal.id}`)
        .then((res) => res.json())
        .then((data) => setSelectedGoal(data));
    }
  };

  const handleGoalDeleted = () => {
    loadData();
    setSelectedGoal(null);
  };

  const dismissReminder = (id: number) => {
    setFiredReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const categories = stats
    ? ["all", ...Object.keys(stats.categories)]
    : ["all"];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors">
      {/* Reminder Alert Overlay */}
      {firedReminders.length > 0 && (
        <ReminderAlertOverlay
          reminders={firedReminders}
          onDismiss={dismissReminder}
          onDismissAll={() => setFiredReminders([])}
        />
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200/60 dark:border-surface-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 aurora-ring rounded-xl flex items-center justify-center shadow-lg shadow-ocean-500/25 flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1
                  className="text-lg font-bold aurora-text leading-tight truncate"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Jadon&apos;s Goal Tracker
                </h1>
                <p className="text-[10px] text-surface-400 dark:text-surface-500 font-medium -mt-0.5 hidden sm:block">
                  Achieve what matters
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <ThemeToggle />
              <ReminderBell />
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-ocean-500 to-violet-500 text-white rounded-xl font-medium text-sm
                         hover:from-ocean-600 hover:to-violet-600 transition-all duration-200 shadow-lg shadow-ocean-500/25 hover:shadow-ocean-500/40
                         active:scale-[0.98] cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">New Goal</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && <StatsBar stats={stats} />}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-500 dark:text-surface-400">Status:</span>
            <div className="flex bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-1 shadow-sm">
              {["all", "active", "completed", "paused"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                    filterStatus === s
                      ? "bg-ocean-500 text-white shadow-sm"
                      : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {categories.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                Category:
              </span>
              <div className="flex bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-1 shadow-sm flex-wrap">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                      filterCategory === c
                        ? "bg-ocean-500 text-white shadow-sm"
                        : "text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-ocean-200 dark:border-ocean-900 border-t-ocean-500 rounded-full animate-spin" />
              <p className="text-surface-500 dark:text-surface-400 text-sm">Loading your goals...</p>
            </div>
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 aurora-ring opacity-90 rounded-2xl flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">
              No goals yet, Jadon!
            </h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6 text-center max-w-sm">
              Start your journey by creating your first goal. Break it down into
              milestones, set smart reminders, and track your progress.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-ocean-500 to-violet-500 text-white rounded-xl font-medium
                       hover:from-ocean-600 hover:to-violet-600 transition-all duration-200 shadow-lg shadow-ocean-500/25 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <GoalCard
                  goal={goal}
                  onClick={() => setSelectedGoal(goal)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-100 dark:border-surface-800 mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-surface-400 dark:text-surface-500">
            Jadon&apos;s Goal Tracker — Stay focused, stay driven 🚀
          </p>
        </div>
      </footer>

      {/* Modals */}
      {showAddModal && (
        <AddGoalModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleGoalCreated}
        />
      )}

      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onUpdated={handleGoalUpdated}
          onDeleted={handleGoalDeleted}
        />
      )}
    </div>
  );
}
