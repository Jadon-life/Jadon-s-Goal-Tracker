"use client";

import {
  DAY_OFFSET_OPTIONS,
  computeScheduledReminders,
  dayOffsetLabel,
  formatTime12h,
} from "@/lib/reminders";

interface ReminderSchedulerProps {
  targetDate: string;
  enabled: boolean;
  time: string;
  daysBefore: number[];
  onEnabledChange: (v: boolean) => void;
  onTimeChange: (v: string) => void;
  onDaysBeforeChange: (v: number[]) => void;
}

export default function ReminderScheduler({
  targetDate,
  enabled,
  time,
  daysBefore,
  onEnabledChange,
  onTimeChange,
  onDaysBeforeChange,
}: ReminderSchedulerProps) {
  if (!targetDate) {
    return (
      <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-3.5 text-xs text-surface-400 dark:text-surface-500">
        Set a target date to turn on smart reminders — they&apos;ll count down
        to it automatically.
      </div>
    );
  }

  const toggleDay = (offset: number) => {
    if (daysBefore.includes(offset)) {
      onDaysBeforeChange(daysBefore.filter((d) => d !== offset));
    } else {
      onDaysBeforeChange([...daysBefore, offset]);
    }
  };

  const preview = enabled
    ? computeScheduledReminders(targetDate, time, daysBefore)
    : [];

  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-800/60 bg-gradient-to-br from-violet-50 via-ocean-50 to-meadow-50 dark:from-violet-950/40 dark:via-ocean-950/30 dark:to-meadow-950/30 p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-surface-700 dark:text-surface-200 flex items-center gap-1.5">
          <span aria-hidden>🔔</span> Smart reminders
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
            enabled ? "bg-ocean-500" : "bg-surface-300 dark:bg-surface-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          <div>
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 block">
              Base time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700
                         bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100
                         focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 dark:focus:ring-ocean-900 outline-none text-sm"
            />
            <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-1">
              We picked {formatTime12h(time)} for you — change it any time.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 block">
              Remind me on
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_OFFSET_OPTIONS.map((offset) => (
                <button
                  key={offset}
                  type="button"
                  onClick={() => toggleDay(offset)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    daysBefore.includes(offset)
                      ? "bg-ocean-500 border-ocean-500 text-white"
                      : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-ocean-300"
                  }`}
                >
                  {dayOffsetLabel(offset)}
                </button>
              ))}
            </div>
          </div>

          {preview.length > 0 && (
            <div className="pt-2 border-t border-violet-200/60 dark:border-violet-800/40">
              <p className="text-[11px] font-medium text-surface-500 dark:text-surface-400 mb-1.5">
                Upcoming
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.map((p) => (
                  <span
                    key={p.date.toISOString()}
                    className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/70 dark:bg-surface-900/70 text-surface-600 dark:text-surface-300"
                  >
                    {p.date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {daysBefore.length === 0 && (
            <p className="text-[11px] text-warning-500">
              Pick at least one day to get reminders.
            </p>
          )}
        </>
      )}
    </div>
  );
}
