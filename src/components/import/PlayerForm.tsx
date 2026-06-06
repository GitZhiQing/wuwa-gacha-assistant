"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, ClipboardPaste } from "lucide-react";
import type { UserParams } from "@/lib/types";

/** JSON 粘贴数据中可能出现的字段名映射到表单字段 */
const FIELD_ALIASES: Record<string, keyof UserParams> = {
  playerId: "playerId",
  player_id: "playerId",
  userId: "playerId",
  user_id: "playerId",
  serverId: "serverId",
  server_id: "serverId",
  cardPoolId: "cardPoolId",
  card_pool_id: "cardPoolId",
  recordId: "recordId",
  record_id: "recordId",
};

interface PlayerFormProps {
  initialParams?: UserParams | null;
  onSubmit: (params: UserParams) => void;
  disabled?: boolean;
}

export function PlayerForm({ initialParams, onSubmit, disabled }: PlayerFormProps) {
  const [form, setForm] = useState<UserParams>({
    playerId: initialParams?.playerId ?? "",
    serverId: initialParams?.serverId ?? "",
    cardPoolId: initialParams?.cardPoolId ?? "",
    recordId: initialParams?.recordId ?? "",
  });
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isValid =
    form.playerId.trim() && form.serverId.trim() && form.cardPoolId.trim() && form.recordId.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onSubmit(form);
  };

  const updateField = (field: keyof UserParams, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** 解析用户粘贴的 JSON 并填入表单 */
  const handleJsonParse = () => {
    setJsonError(null);

    if (!jsonText.trim()) {
      setJsonError("请先粘贴 JSON 数据");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch {
      setJsonError("JSON 格式无效，请检查后重试");
      return;
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setJsonError("JSON 必须是一个对象（以 { 开头），不能是数组");
      return;
    }

    const obj = parsed as Record<string, unknown>;
    const updates: Partial<UserParams> = {};
    let matchedCount = 0;

    for (const [key, value] of Object.entries(obj)) {
      const targetField = FIELD_ALIASES[key];
      if (targetField && typeof value === "string" && value.trim()) {
        updates[targetField] = value.trim();
        matchedCount++;
      }
    }

    if (matchedCount === 0) {
      setJsonError(
        "未识别到任何参数。请确保 JSON 中包含 playerId / serverId / cardPoolId / recordId",
      );
      return;
    }

    setForm((prev) => ({ ...prev, ...updates }));
    setJsonText("");
    setJsonExpanded(false);
    toast.success(`已从 JSON 解析出 ${matchedCount} 个参数`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>玩家参数配置</CardTitle>
        <CardDescription>
          可通过浏览器开发者工具从云鸣潮页面抓包获取如下参数。
          <button
            type="button"
            className="ml-1 text-primary underline cursor-pointer"
            onClick={() => {
              // TODO: 显示帮助面板
            }}>
            如何获取？
          </button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 快速填入：粘贴 JSON */}
          <div className="rounded-md border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setJsonExpanded((v) => !v)}>
              <span className="flex items-center gap-1.5">
                <ClipboardPaste className="h-4 w-4" />
                快速填入（粘贴 JSON）
              </span>
              {jsonExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {jsonExpanded && (
              <div className="border-t px-3 py-3 space-y-2">
                <textarea
                  className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "resize-y",
                  )}
                  placeholder={`粘贴抓包获取的 JSON 数据，例如：\n{"playerId":"...","serverId":"...","cardPoolId":"...","recordId":"..."}`}
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    setJsonError(null);
                  }}
                  disabled={disabled}
                  spellCheck={false}
                />
                {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleJsonParse}
                  disabled={disabled || !jsonText.trim()}>
                  解析并填入
                </Button>
              </div>
            )}
          </div>

          {/* 四个独立字段 */}
          <div className="space-y-2">
            <Label htmlFor="playerId">Player ID（玩家 ID）</Label>
            <Input
              id="playerId"
              placeholder="请输入 Player ID"
              value={form.playerId}
              onChange={(e) => updateField("playerId", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serverId">Server ID（服务器 ID）</Label>
            <Input
              id="serverId"
              placeholder="请输入 Server ID"
              value={form.serverId}
              onChange={(e) => updateField("serverId", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardPoolId">Card Pool ID</Label>
            <Input
              id="cardPoolId"
              placeholder="请输入 Card Pool ID"
              value={form.cardPoolId}
              onChange={(e) => updateField("cardPoolId", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recordId">Record ID</Label>
            <Input
              id="recordId"
              placeholder="请输入 Record ID"
              value={form.recordId}
              onChange={(e) => updateField("recordId", e.target.value)}
              disabled={disabled}
            />
          </div>
          <Button type="submit" disabled={!isValid || disabled} className="w-full">
            保存并继续
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
