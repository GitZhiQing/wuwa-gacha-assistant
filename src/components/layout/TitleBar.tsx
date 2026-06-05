"use client";

import { useState, useEffect } from "react";
import { isTauri } from "@/lib/tauri";
import { Minus, Square, X } from "lucide-react";

export function TitleBar() {
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isTauri()) return;

    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      const appWindow = getCurrentWindow();

      appWindow.listen("tauri://resize", () => {
        appWindow.isMaximized().then(setIsMaximized);
      }).then((fn) => { unlisten = fn; });

      appWindow.isMaximized().then(setIsMaximized);
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const handleMinimize = () => {
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) =>
      getCurrentWindow().minimize()
    );
  };
  const handleMaximize = () => {
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) =>
      getCurrentWindow().toggleMaximize()
    );
  };
  const handleClose = () => {
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) =>
      getCurrentWindow().close()
    );
  };

  // SSR 阶段和浏览器模式：不渲染任何内容（保持 SSR/CSR 一致）
  if (!mounted || !isTauri()) return null;

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 z-50 flex h-9 items-center justify-between bg-card border-b select-none"
    >
      <div className="flex items-center gap-2 pl-3">
        <span className="text-xs text-muted-foreground font-medium">
          鸣潮抽卡助手
        </span>
      </div>

      <div className="flex h-full">
        <button
          onClick={handleMinimize}
          className="inline-flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="最小化"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="inline-flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="最大化"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className="inline-flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          aria-label="关闭"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
