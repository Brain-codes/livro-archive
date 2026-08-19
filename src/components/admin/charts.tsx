"use client";

import { useId } from "react";
import { formatPrice } from "@/lib/utils";

/**
 * Hand-rolled SVG charts — no charting library, so the console stays light.
 * Every chart exposes a text summary via role="img" + aria-label, because a chart
 * that only works visually isn't accessible (design.md).
 */

export function RevenueArea({
  data,
  height = 200,
}: {
  data: { date: string; total: number }[];
  height?: number;
}) {
  const gradientId = useId();
  const grandTotal = data.reduce((sum, d) => sum + d.total, 0);
  if (data.length === 0 || grandTotal === 0) {
    return <ChartEmpty label="No paid orders in this period yet" />;
  }

  const width = 720;
  const pad = { top: 12, right: 8, bottom: 22, left: 8 };
  const max = Math.max(...data.map((d) => d.total), 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const x = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.total).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${pad.top + innerH} L${x(0).toFixed(1)},${pad.top + innerH} Z`;

  const peak = data.reduce((best, d) => (d.total > best.total ? d : best), data[0]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[200px] w-full"
      role="img"
      aria-label={`Revenue over the last ${data.length} days, totalling ${formatPrice(grandTotal)}. Best day ${peak.date} at ${formatPrice(peak.total)}.`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-forest)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-forest)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + innerH * t}
          y2={pad.top + innerH * t}
          stroke="var(--color-border)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--color-forest)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function StatusBars({
  data,
}: {
  data: { label: string; value: number; tone?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) return <ChartEmpty label="No orders yet" />;

  return (
    <ul className="space-y-3.5">
      {data.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] capitalize text-ink-muted">
              {row.label.replace(/_/g, " ")}
            </span>
            <span className="text-[12.5px] font-medium tabular-nums text-ink">{row.value}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-forest transition-[width] duration-500"
              style={{ width: `${Math.max((row.value / max) * 100, 3)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Semi-circular gauge, used for "orders fulfilled" style ratios. */
export function Gauge({
  value,
  label,
  caption,
}: {
  value: number;
  label: string;
  caption?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 70;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="flex flex-col items-center"
      role="img"
      aria-label={`${label}: ${Math.round(clamped)} percent`}
    >
      <svg viewBox="0 0 180 100" className="w-full max-w-[220px]">
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke="var(--color-surface-muted)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 90 A 70 70 0 0 1 160 90"
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
        <text
          x="90"
          y="80"
          textAnchor="middle"
          className="fill-ink font-display text-[30px] font-semibold"
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <p className="mt-1 text-[12.5px] font-medium text-ink">{label}</p>
      {caption && <p className="mt-0.5 text-[11.5px] text-ink-muted">{caption}</p>}
    </div>
  );
}

export function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="grid h-[200px] place-items-center text-[13px] text-ink-faint">{label}</div>
  );
}
