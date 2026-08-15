import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jadon's Goal Tracker",
  description:
    "Set, track, and achieve your goals. Break down your ambitions into milestones, set smart reminders, and watch your progress grow.",
  openGraph: {
    title: "Jadon's Goal Tracker",
    description:
      "Set, track, and achieve your goals with smart reminders and milestone tracking.",
    images: ["/images/og-image.jpg"],
  },
};

// Runs before paint so the correct theme class is on <html> immediately —
// avoids a flash of the wrong theme when the person has a stored preference.
const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem("jadons-goal-tracker-theme");
    var isDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="bg-surface-50 text-surface-800 dark:bg-surface-950 dark:text-surface-100 antialiased min-h-screen transition-colors">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
