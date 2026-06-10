"use client";

import { useState, useEffect, useCallback } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TitleBar } from "@/components/layout/TitleBar";
import { Sidebar } from "@/components/layout/Sidebar";

const SIDEBAR_COLLAPSED_KEY = "wuwa-sidebar-collapsed";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <ThemeProvider>
      <TitleBar />
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main
        className={`mt-9 min-h-[calc(100vh-36px)] transition-[margin] duration-200 ${
          collapsed ? "ml-14" : "ml-56"
        }`}
      >
        {children}
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
    </ThemeProvider>
  );
}
