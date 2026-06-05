"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_VERSION } from "@/lib/config";

const navItems = [
  { href: "/", label: "概览", icon: LayoutDashboard },
  { href: "/import", label: "数据导入", icon: Upload },
  { href: "/analysis", label: "卡池分析", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const yearText = useMemo(() => {
    const y = new Date().getFullYear();
    return y === 2026 ? "2026" : `2026 – ${y}`;
  }, []);

  return (
    <aside className="fixed left-0 top-9 z-40 flex h-[calc(100vh-36px)] w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span>鸣潮抽卡助手</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] leading-none text-muted-foreground">
              &copy; {yearText} QING
            </p>
            <p className="text-[10px] leading-none text-muted-foreground/50 mt-1">
              v{APP_VERSION}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
