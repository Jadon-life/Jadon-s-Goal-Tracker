"use client";

import { useEffect, useRef } from "react";
import { Reminder } from "./GoalDashboard";

interface ReminderAlertOverlayProps {
  reminders: Reminder[];
  onDismiss: (id: number) => void;
  onDismissAll: () => void;
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

export default function ReminderAlertOverlay({
  reminders,
  onDismiss,
  onDismissAll,
}: ReminderAlertOverlayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play a gentle alarm sound using Web Audio API
    try {
      const ctx = new AudioContext();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Pleasant chime pattern
      playTone(523.25, now, 0.3);        // C5
      playTone(659.25, now + 0.15, 0.3); // E5
      playTone(783.99, now + 0.3, 0.4);  // G5
      playTone(1046.5, now + 0.5, 0.5);  // C6

      // Repeat after a pause
      playTone(523.25, now + 1.2, 0.3);
      playTone(659.25, now + 1.35, 0.3);
      playTone(783.99, now + 1.5, 0.4);
      playTone(1046.5, now + 1.7, 0.5);
    } catch {
      // Audio not supported, that's fine
    }
  }, []);

  if (reminders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-8 pointer-events-none">
      <div className="flex flex-col gap-3 w-full max-w-md px-4 pointer-events-auto">
        {/* Dismiss all button */}
        {reminders.length > 1 && (
          <button
            onClick={onDismissAll}
            className="self-end text-xs font-medium text-white/80 hover:text-white bg-surface-800/60 backdrop-blur-md px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            Dismiss all ({reminders.length})
          </button>
        )}

        {reminders.map((reminder, idx) => {
          const emoji =
            categoryEmoji[reminder.goalCategory || ""] || "🎯";

          return (
            <div
              key={reminder.id}
              className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-ocean-200 dark:border-ocean-800 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Alarm header bar */}
              <div className="aurora-ring px-4 py-2 flex items-center gap-2">
                <span className="text-white text-lg animate-pulse">⏰</span>
                <span className="text-white text-sm font-semibold flex-1">
                  Reminder Alert!
                </span>
                <button
                  onClick={() => onDismiss(reminder.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-ocean-50 dark:bg-ocean-950/60 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-surface-800 dark:text-surface-100 text-base">
                      {reminder.goalTitle || "Goal Reminder"}
                    </h4>
                    {reminder.message && (
                      <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                        {reminder.message}
                      </p>
                    )}
                    {!reminder.message && (
                      <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                        Time to work on your goal!
                      </p>
                    )}
                    <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-2">
                      Scheduled for{" "}
                      {new Date(reminder.reminderTime).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onDismiss(reminder.id)}
                  className="w-full mt-3 py-2.5 rounded-xl bg-ocean-50 dark:bg-ocean-950/60 text-ocean-700 dark:text-ocean-300 text-sm font-semibold hover:bg-ocean-100 dark:hover:bg-ocean-900 transition-colors cursor-pointer"
                >
                  Got it! ✓
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
