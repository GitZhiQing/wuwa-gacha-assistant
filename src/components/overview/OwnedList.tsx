import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OwnedListProps {
  title: string;
  items: string[];
  variant?: "default" | "secondary" | "gold";
  emptyText?: string;
}

export function OwnedList({
  title,
  items,
  variant = "default",
  emptyText = "暂无数据",
}: OwnedListProps) {
  const badgeClass =
    variant === "gold"
      ? "bg-gold text-gold-foreground hover:bg-gold/90 text-xs"
      : variant === "secondary"
        ? undefined
        : undefined;
  const badgeVariant =
    variant === "secondary" ? ("secondary" as const) : undefined;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <Badge
                key={item}
                variant={variant === "secondary" ? "secondary" : undefined}
                className={
                  variant === "gold"
                    ? "bg-gold text-gold-foreground hover:bg-gold/90 text-xs"
                    : "text-xs"
                }
              >
                {item}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
