import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { key: "pending_payment", label: "Placed" },
  { key: "paid", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-danger">
        This order was {status}.
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2",
                  done
                    ? "border-primary bg-primary text-white"
                    : "border-border text-ink-muted",
                )}
              >
                {done && <Check className="size-4" />}
              </div>
              {!isLast && (
                <div className={cn("w-0.5 flex-1 min-h-8", done ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <div className={cn("pb-8", done ? "text-ink" : "text-ink-muted")}>
              <p className="font-medium">{step.label}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
