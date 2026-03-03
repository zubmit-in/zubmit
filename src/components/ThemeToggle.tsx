"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200"
      style={{
        border: '1px solid var(--b2)',
        background: 'var(--hover-bg)',
      }}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4" style={{ color: 'var(--t3)' }} />
      ) : (
        <Moon className="h-4 w-4" style={{ color: 'var(--t2)' }} />
      )}
    </button>
  );
}
