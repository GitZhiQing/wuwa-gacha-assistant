"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlayerForm } from "@/components/import/PlayerForm";
import { PoolSelector } from "@/components/import/PoolSelector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useUserStore } from "@/store/user-store";
import { useGachaStore } from "@/store/gacha-store";
import { useUserParams } from "@/hooks/useUserParams";
import { saveParams } from "@/lib/params";
import { fetchGachaData } from "@/lib/api";
import { saveRecordsIncremental } from "@/lib/db";
import { isTauri } from "@/lib/tauri";
import type { UserParams, PoolApiResponse } from "@/lib/types";

type Step = "params" | "pools" | "syncing";

export default function ImportPage() {
  const router = useRouter();
  const { params: savedParams, hasParams, isLoading: paramsLoading } = useUserParams();
  const { setParams: setStoreParams, setSyncing, setLastSyncAt, isSyncing } =
    useUserStore();
  const { loadedUserId, clearAll: clearGachaStore } = useGachaStore();

  const [step, setStep] = useState<Step>(hasParams ? "pools" : "params");
  const [userParams, setUserParams] = useState<UserParams | null>(
    savedParams ?? null
  );
  const [selectedPools, setSelectedPools] = useState<number[]>([1, 2]);
  const [syncResults, setSyncResults] = useState<
    { pool: string; newCount: number; error?: string }[]
  >([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  // 初始化
  useEffect(() => {
    if (hasParams && savedParams) {
      setStep("pools");
      setUserParams(savedParams);
    }
  }, [hasParams, savedParams]);

  const handleParamsSubmit = async (params: UserParams) => {
    await saveParams(params);
    setStoreParams(params);
    setUserParams(params);

    // 切换了不同的 playerId → 清空旧用户的缓存数据
    if (loadedUserId && loadedUserId !== params.playerId) {
      clearGachaStore();
    }

    setStep("pools");
  };

  const handleSync = useCallback(async () => {
    if (!userParams || selectedPools.length === 0) return;

    setSyncing(true);
    setSyncError(null);
    setSyncResults([]);
    setStep("syncing");

    try {
      const results = await fetchGachaData({
        ...userParams,
        poolTypes: selectedPools,
      });

      const sr: { pool: string; newCount: number; error?: string }[] = [];

      for (const resp of results) {
        if (resp.error) {
          sr.push({
            pool: resp.pool_name,
            newCount: 0,
            error: resp.error,
          });
          continue;
        }

        try {
          const newCount = await saveRecordsIncremental(
            userParams.playerId,
            resp.pool_type,
            resp.pool_name,
            resp.records
          );
          sr.push({ pool: resp.pool_name, newCount });
        } catch (e) {
          const errMsg = String(e);
          console.error(`[import] saveRecordsIncremental failed for ${resp.pool_name}:`, errMsg);
          sr.push({
            pool: resp.pool_name,
            newCount: 0,
            error: errMsg,
          });
        }
      }

      setSyncResults(sr);
      setLastSyncAt(new Date().toISOString());

      // 同步完成后清空 gacha store，确保导航到概览/分析页时重新加载最新数据
      clearGachaStore();
    } catch (e) {
      const msg = String(e);
      console.error("Sync failed:", msg);
      setSyncError(msg);
      toast.error("同步失败", { description: msg });
    } finally {
      setSyncing(false);
    }
  }, [userParams, selectedPools, setSyncing, setLastSyncAt, clearGachaStore]);

  if (paramsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const totalNew = syncResults.reduce((s, r) => s + r.newCount, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pt-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">数据导入</h1>
        <p className="mt-2 text-muted-foreground">
          从官方 API 拉取你的抽卡记录
        </p>
      </div>

      {/* 浏览器模式提示 */}
      {!isTauri() && (
        <Alert>
          <AlertDescription>
            你正在浏览器中运行。API 数据拉取功能仅在 Tauri 桌面应用中可用。请使用{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-sm">
              npm run tauri dev
            </code>{" "}
            启动完整应用。当前可预览 UI 和填写参数（参数将保存到浏览器
            localStorage）。
          </AlertDescription>
        </Alert>
      )}

      {/* 步骤 1: 参数配置 */}
      {(step === "params" || step === "pools") && (
        <>
          <PlayerForm
            initialParams={userParams}
            onSubmit={handleParamsSubmit}
            disabled={isSyncing}
          />

          {userParams && (
            <PoolSelector
              selected={selectedPools}
              onChange={setSelectedPools}
              disabled={isSyncing}
            />
          )}

          {userParams && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleSync}
              disabled={isSyncing || selectedPools.length === 0}
            >
              {isSyncing ? "同步中..." : "一键同步数据"}
            </Button>
          )}
        </>
      )}

      {/* 步骤 2: 同步结果 */}
      {step === "syncing" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {isSyncing ? "正在同步..." : syncError ? "同步失败" : "同步完成"}
              </CardTitle>
              <CardDescription>
                {isSyncing
                  ? "正在从官方 API 拉取抽卡记录..."
                  : syncError
                    ? `错误信息：${syncError}`
                    : totalNew > 0
                      ? `新增 ${totalNew} 条抽卡记录`
                      : "数据已是最新，没有新记录"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncResults.map((r) => (
                  <div
                    key={r.pool}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm">{r.pool}</span>
                      {r.error && (
                        <span className="text-xs text-destructive truncate mt-0.5">
                          {r.error}
                        </span>
                      )}
                    </div>
                    {r.error ? (
                      <Badge variant="destructive">失败</Badge>
                    ) : r.newCount > 0 ? (
                      <Badge>+{r.newCount}</Badge>
                    ) : (
                      <Badge variant="secondary">无新数据</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!isSyncing && (
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => router.push("/")}
              >
                查看概览
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("pools")}
              >
                继续同步
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
