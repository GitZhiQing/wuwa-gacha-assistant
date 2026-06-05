"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POOL_TYPE_MAP } from "@/lib/constants";

export const ANALYSIS_POOLS = [1, 2, 9, 10, 3, 4];

interface PoolTabsProps {
  activeTab: number;
  onTabChange: (poolType: number) => void;
  availablePools: Set<number>;
}

export function PoolTabs({
  activeTab,
  onTabChange,
  availablePools,
}: PoolTabsProps) {
  return (
    <Tabs
      value={String(activeTab)}
      onValueChange={(v) => onTabChange(Number(v))}
    >
      <TabsList className="w-full">
        {ANALYSIS_POOLS.map((pt) => {
          const info = POOL_TYPE_MAP[pt];
          const hasData = availablePools.has(pt);
          return (
            <TabsTrigger
              key={pt}
              value={String(pt)}
              className={`flex-1 ${!hasData ? "text-muted-foreground/50" : ""}`}
            >
              {info?.tabLabel ?? `类型${pt}`}
              {!hasData && (
                <span className="ml-1 text-xs opacity-50">·</span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
