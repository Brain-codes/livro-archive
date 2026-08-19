import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "available" | "sold" | "low" | "gold" | "neutral" | "info";

const TONES: Record<Tone, string> = {
  available: "bg-forest text-on-dark dark:text-canvas",
  sold: "bg-ink/70 text-canvas",
  low: "bg-clay text-white",
  gold: "bg-gold text-white",
  neutral: "bg-surface text-ink border border-border",
  info: "bg-sage-soft text-forest-deep",
};

/**
 * Status pill. Always pairs a word with the colour — never colour alone
 * (design.md, accessibility).
 */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
