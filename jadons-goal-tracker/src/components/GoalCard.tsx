"use client";

import { Goal } from "./GoalDashboard";

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  high: {
    label: "High",
    color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
    dot: "bg-violet-500",
  },
  medium: {
    label: "Medium",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    color: "bg-meadow-50 text-meadow-700 border-meadow-200 dark:bg-meadow-950/60 dark:text-meadow-300 dark:border-meadow-800",
    dot: "bg-meadow-500",
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-ocean-50 text-ocean-700 dark:bg-ocean-950/60 dark:text-ocean-300" },
  completed: { label: "Completed", color: "bg-meadow-50 text-meadow-700 dark:bg-meadow-950/60 dark:text-meadow-300" },
  paused: { label: "Paused", color: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400" },
};

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

export default function GoalCard({ goal, onClick }: GoalCardProps) {
  const priority = priorityConfig[goal.priority] || priorityConfig.medium;
  const status = statusConfig[goal.status] || statusConfig.active;
  const emoji = categoryEmoji[goal.category] || "🎯";

  const isOverdue =
    goal.targetDate &&
    new Date(goal.targetDate) < new Date() &&
    goal.status === "active";

  return (
    <div
      onClick={onClick}
      className={`group bg-white dark:bg-surface-900 rounded-2xl p-5 border transition-all duration-200 cursor-pointer
                  hover:shadow-lg hover:shadow-surface-200/50 dark:hover:shadow-black/20 hover:-translate-y-0.5
                  ${goal.status === "completed" ? "border-meadow-200 dark:border-meadow-800 bg-meadow-50/30 dark:bg-meadow-950/10" : "border-surface-100 dark:border-surface-800"}
                  ${isOverdue ? "border-violet-200 dark:border-violet-800" : ""}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-xs font-medium text-surface-400 dark:text-surface-500">
            {goal.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priority.color}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${priority.dot} mr-1`} />
            {priority.label}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-surface-800 dark:text-surface-100 mb-2 line-clamp-2 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors ${
          goal.status === "completed" ? "line-through text-surface-500 dark:text-surface-500" : ""
        }`}
      >
        {goal.title}
      </h3>

      {/* Description */}
      {goal.description && (
        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mb-4">
          {goal.description}
        </p>
      )}

      {/* Progress — color sweeps violet → ocean → meadow as it nears 100% */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400">Progress</span>
          <span className="text-xs font-bold text-surface-700 dark:text-surface-200 font-mono">{goal.progress}%</span>
        </div>
        <div className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 animate-progress progress-gradient"
            style={{
              width: `${goal.progress}%`,
              backgroundSize: "220% 100%",
              backgroundPosition: `${100 - goal.progress}% 0`,
            }}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-50 dark:border-surface-800">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
          {isOverdue && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
              Overdue
            </span>
          )}
        </div>
        {goal.targetDate && (
          <span className={`text-[10px] font-medium font-mono ${isOverdue ? "text-violet-500 dark:text-violet-400" : "text-surface-400 dark:text-surface-500"}`}>
            {new Date(goal.targetDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
