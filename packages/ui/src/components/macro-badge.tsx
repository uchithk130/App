import { Badge } from "./badge";

export function MacroBadge({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <Badge variant="secondary" className="gap-1 font-normal">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">
        {value}
        {unit}
      </span>
    </Badge>
  );
}
