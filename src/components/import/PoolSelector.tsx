"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const POOL_TYPES = [
  { type: 1, name: "角色活动唤取", group: "限定池" },
  { type: 2, name: "武器活动唤取", group: "限定池" },
  { type: 9, name: "角色联动唤取", group: "联动池" },
  { type: 10, name: "武器联动唤取", group: "联动池" },
  { type: 3, name: "角色常驻唤取", group: "常驻池" },
  { type: 4, name: "武器常驻唤取", group: "常驻池" },
  { type: 5, name: "新手唤取", group: "其他" },
  { type: 6, name: "新手自选唤取", group: "其他" },
  { type: 7, name: "角色新旅唤取", group: "其他" },
  { type: 8, name: "武器新旅唤取", group: "其他" },
];

interface PoolSelectorProps {
  selected: number[];
  onChange: (selected: number[]) => void;
  disabled?: boolean;
}

export function PoolSelector({
  selected,
  onChange,
  disabled,
}: PoolSelectorProps) {
  const toggle = (type: number) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  const selectAll = () => onChange(POOL_TYPES.map((p) => p.type));
  const deselectAll = () => onChange([]);

  const groups = POOL_TYPES.reduce(
    (acc, p) => {
      const group = acc.get(p.group) ?? [];
      group.push(p);
      acc.set(p.group, group);
      return acc;
    },
    new Map<string, typeof POOL_TYPES>()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>选择卡池</CardTitle>
        <CardDescription>
          选择要拉取数据的卡池类型，默认推荐拉取限定池。
        </CardDescription>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={disabled}
          >
            全选
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={disabled}
          >
            取消全选
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from(groups.entries()).map(([group, pools]) => (
          <div key={group}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {group}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {pools.map((pool) => (
                <div
                  key={pool.type}
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => !disabled && toggle(pool.type)}
                >
                  <Checkbox
                    id={`pool-${pool.type}`}
                    checked={selected.includes(pool.type)}
                    onCheckedChange={() => toggle(pool.type)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`pool-${pool.type}`}
                    className="cursor-pointer text-sm"
                  >
                    {pool.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
