"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_VERSION } from "@/lib/config";

const navItems = [
  { href: "/", label: "概览", icon: LayoutDashboard },
  { href: "/import", label: "数据导入", icon: Upload },
  { href: "/analysis", label: "卡池分析", icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const yearText = useMemo(() => {
    const y = new Date().getFullYear();
    return y === 2026 ? "2026" : `2026 – ${y}`;
  }, []);

  return (
    <aside
      className={cn(
        "fixed left-0 top-9 z-40 flex h-[calc(100vh-36px)] flex-col border-r bg-card transition-[width] duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b transition-all duration-200",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-bold text-lg whitespace-nowrap overflow-hidden transition-all duration-200",
            collapsed ? "opacity-0 w-0 pointer-events-none" : "opacity-100"
          )}
        >
          <span>鸣潮抽卡助手</span>
        </Link>
        <button
          onClick={onToggle}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md text-sm transition-colors",
                collapsed ? "justify-center px-1.5 py-2" : "px-3 py-2",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "whitespace-nowrap overflow-hidden transition-all duration-200",
                  collapsed ? "opacity-0 w-0" : "opacity-100"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t transition-all duration-200",
          collapsed ? "px-2 py-3" : "px-4 py-3"
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="whitespace-nowrap overflow-hidden transition-all duration-200">
              <p className="text-[10px] leading-none text-muted-foreground">
                &copy; {yearText} QING
              </p>
              <p className="text-[10px] leading-none text-muted-foreground/50 mt-1">
                v{APP_VERSION}
              </p>
            </div>
            <ThemeToggle />
          </div>
        )}
      </div>
    </aside>
  );
}
