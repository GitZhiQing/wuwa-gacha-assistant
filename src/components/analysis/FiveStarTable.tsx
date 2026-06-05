import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FiveStarEntry } from "@/lib/types";
import { POOL_TYPE_MAP } from "@/lib/constants";

interface FiveStarTableProps {
  entries: FiveStarEntry[];
  poolType: number;
}

export function FiveStarTable({ entries, poolType }: FiveStarTableProps) {
  const info = POOL_TYPE_MAP[poolType];
  const hasWarp = info?.hasWarp ?? false;
  const isCharacter = info?.resourceType === "角色";

  if (entries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">暂无五星记录</p>
      </div>
    );
  }

  // 倒序显示（最新在前）
  const reversed = [...entries].reverse();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead className="w-28 text-center">名称</TableHead>
            {isCharacter && (
              <>
                <TableHead className="w-16 text-center">限定</TableHead>
                {hasWarp && <TableHead className="w-16 text-center">歪卡</TableHead>}
              </>
            )}
            <TableHead className="w-20 text-center">距上金</TableHead>
            <TableHead className="w-44 text-center">时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reversed.map((entry, i) => (
            <TableRow
              key={`${entry.sortOrder}-${i}`}
              className={
                entry.isLost50_50 ? "bg-red-500/10" : undefined
              }
            >
              <TableCell className="text-muted-foreground whitespace-nowrap text-center">
                {reversed.length - i}
              </TableCell>
              <TableCell className="font-medium whitespace-nowrap truncate text-center">
                {entry.name}
              </TableCell>
              {isCharacter && (
                <>
                  <TableCell className="whitespace-nowrap text-center">
                    {entry.isLimited ? (
                      <Badge className="bg-gold text-gold-foreground hover:bg-gold/90 text-xs">
                        限定
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        常驻
                      </Badge>
                    )}
                  </TableCell>
                  {hasWarp && (
                    <TableCell className="whitespace-nowrap text-center">
                      {entry.isLost50_50 ? (
                        <Badge variant="destructive" className="text-xs">
                          歪
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                  )}
                </>
              )}
              <TableCell className="tabular-nums whitespace-nowrap text-center">
                {entry.pityCount}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap text-center">
                {entry.time}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
