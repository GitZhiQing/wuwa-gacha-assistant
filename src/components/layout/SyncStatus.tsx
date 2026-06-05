"use client";

import { useUserStore } from "@/store/user-store";
import { Badge } from "@/components/ui/badge";

export function SyncStatus() {
  const { lastSyncAt, isSyncing } = useUserStore();

  if (isSyncing) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        同步中...
      </Badge>
    );
  }

  if (!lastSyncAt) {
    return (
      <Badge variant="secondary">未同步</Badge>
    );
  }

  const diff = Date.now() - new Date(lastSyncAt).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  let text: string;
  if (minutes < 1) text = "刚刚同步";
  else if (minutes < 60) text = `${minutes} 分钟前同步`;
  else if (hours < 24) text = `${hours} 小时前同步`;
  else text = `${Math.floor(hours / 24)} 天前同步`;

  return (
    <Badge variant="outline" className="text-xs">
      {text}
    </Badge>
  );
}
