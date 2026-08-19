import { formatPrice } from "@/lib/utils";

export function PriceTag({
  price,
  compareAt,
  currency = "NGN",
  size = "md",
}: {
  price: number;
  compareAt?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };
  const hasDiscount = compareAt && compareAt > price;

  return (
    <span className="inline-flex items-baseline gap-2 tabular-nums">
      <span className={`font-semibold ${sizes[size]} text-ink`}>
        {formatPrice(price, currency)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-ink-muted line-through">
          {formatPrice(compareAt!, currency)}
        </span>
      )}
    </span>
  );
}
