import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "info" | "gold";

const TONES: Record<Tone, { cls: string; Icon: typeof Info }> = {
  success: { cls: "bg-accent/10 text-accent", Icon: CheckCircle2 },
  warning: { cls: "bg-gold/10 text-gold", Icon: AlertTriangle },
  danger: { cls: "bg-danger/10 text-danger", Icon: XCircle },
  info: { cls: "bg-primary/10 text-primary-ink", Icon: Info },
  gold: { cls: "bg-gold/10 text-gold", Icon: Sparkles },
};

export function Badge({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  const { cls, Icon } = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        cls,
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}
