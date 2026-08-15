"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl
                 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
    >
      {isDark ? (
        <svg
          className="w-5 h-5 text-violet-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-ocean-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1.5m0 15V21m9-9h-1.5m-15 0H3m15.364-6.364l-1.06 1.06M6.696 17.303l-1.06 1.06m0-12.728l1.06 1.06m10.607 10.608l1.06 1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
          />
        </svg>
      )}
    </button>
  );
}
