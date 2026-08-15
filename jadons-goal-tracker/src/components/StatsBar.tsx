"use client";

import { Stats } from "./GoalDashboard";

interface StatsBarProps {
  stats: Stats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const statCards = [
    {
      label: "Total Goals",
      value: stats.total,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      ),
      bgColor: "bg-surface-100 dark:bg-surface-800",
      textColor: "text-surface-600 dark:text-surface-300",
    },
    {
      label: "Active",
      value: stats.active,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        </svg>
      ),
      bgColor: "bg-ocean-50 dark:bg-ocean-950/60",
      textColor: "text-ocean-600 dark:text-ocean-400",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-meadow-50 dark:bg-meadow-950/60",
      textColor: "text-meadow-600 dark:text-meadow-400",
    },
    {
      label: "Avg Progress",
      value: `${stats.avgProgress}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      bgColor: "bg-violet-50 dark:bg-violet-950/60",
      textColor: "text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, i) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-100 dark:border-surface-800 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-shadow animate-fade-in"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center ${stat.textColor}`}>
              {stat.icon}
            </div>
          </div>
          <div className="text-2xl font-bold text-surface-800 dark:text-surface-100 font-mono">{stat.value}</div>
          <div className="text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
