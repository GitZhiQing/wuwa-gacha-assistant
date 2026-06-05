"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserParams } from "@/lib/types";

interface PlayerFormProps {
  initialParams?: UserParams | null;
  onSubmit: (params: UserParams) => void;
  disabled?: boolean;
}

export function PlayerForm({
  initialParams,
  onSubmit,
  disabled,
}: PlayerFormProps) {
  const [form, setForm] = useState<UserParams>({
    playerId: initialParams?.playerId ?? "",
    serverId: initialParams?.serverId ?? "",
    cardPoolId: initialParams?.cardPoolId ?? "",
    recordId: initialParams?.recordId ?? "",
  });

  const isValid =
    form.playerId.trim() &&
    form.serverId.trim() &&
    form.cardPoolId.trim() &&
    form.recordId.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onSubmit(form);
  };

  const updateField = (field: keyof UserParams, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>玩家参数配置</CardTitle>
        <CardDescription>
          请从游戏内抓包获取以下参数。
          <button
            type="button"
            className="ml-1 text-primary underline cursor-pointer"
            onClick={() => {
              // TODO: 显示帮助面板
            }}
          >
            如何获取？
          </button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
