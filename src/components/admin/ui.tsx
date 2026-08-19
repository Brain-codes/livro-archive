import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ReactNode, HTMLAttributes } from "react";

/** Console surface. Flat, hairline border, no shadow — density over decoration. */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface", className)}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div>
        <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[12.5px] text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-[13.5px] text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * KPI tile. The lead metric is rendered `featured` — filled forest green — so the
 * eye lands on the number that matters most before anything else.
 */
export function StatCard({
  label,
  value,
  sub,
  delta,
  icon,
  featured = false,
  loading = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  icon?: ReactNode;
  featured?: boolean;
  loading?: boolean;
}) {
  const positive = (delta ?? 0) >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        featured ? "border-forest bg-forest" : "border-border bg-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-[12.5px]",
            featured ? "text-on-dark/70 dark:text-canvas/70" : "text-ink-muted",
          )}
        >
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              featured
                ? "bg-on-dark/15 text-on-dark dark:text-canvas"
                : "bg-surface-muted text-ink-muted",
            )}
          >
            {icon}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-current opacity-10" />
      ) : (
        <p
          className={cn(
            "mt-2.5 font-display text-[28px] font-semibold tabular-nums",
            featured ? "text-on-dark dark:text-canvas" : "text-ink",
          )}
        >
          {value}
        </p>
      )}

      {(sub || delta !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                positive ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {sub && (
            <span
              className={cn(
                "text-[11.5px]",
                featured ? "text-on-dark/60 dark:text-canvas/60" : "text-ink-faint",
              )}
            >
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  pending_payment: "bg-gold/15 text-gold",
  payment_failed: "bg-danger/15 text-danger",
  paid: "bg-success/15 text-success",
  processing: "bg-sage-soft/50 text-forest",
  ready_for_dispatch: "bg-sage-soft/50 text-forest",
  shipped: "bg-forest/15 text-forest",
  out_for_delivery: "bg-clay/15 text-clay",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-ink/10 text-ink-muted",
  refunded: "bg-ink/10 text-ink-muted",
  returned: "bg-danger/15 text-danger",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
        STATUS_TONES[status] ?? "bg-ink/10 text-ink-muted",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3.5 align-middle text-[13.5px]", className)}>{children}</td>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {icon && (
        <span className="grid size-12 place-items-center rounded-full bg-surface-muted text-ink-faint">
          {icon}
        </span>
      )}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <tbody aria-busy>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-border">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-5 py-4">
              <div className="h-3.5 w-full max-w-[140px] animate-pulse rounded bg-surface-muted" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
