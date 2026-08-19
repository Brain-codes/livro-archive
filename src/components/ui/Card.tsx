import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(33,26,20,0.04)] dark:shadow-none",
        className,
      )}
      {...props}
    />
  );
}
