"use client";

import { Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useAppTheme();

  return (
    <button
      onClick={toggle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="切换主题"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
