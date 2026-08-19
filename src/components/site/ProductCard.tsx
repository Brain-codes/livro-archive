"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist";
import type { Product } from "@/types/catalog";

export function ProductCard({
  product,
  onSurface = false,
}: {
  product: Product;
  /** Set when the card sits on the sage section, so it uses the cream surface. */
  onSurface?: boolean;
}) {
  const image = product.product_images?.[0]?.url;
  const available = product.available_quantity ?? product.stock_quantity ?? 0;
  const { has, toggle } = useWishlistStore();
  const saved = has(product.id);

  const meta =
    product.author ??
    (product.product_type === "stationery" ? "Stationery" : product.subtitle) ??
    "";

  return (
    <article className="group flex flex-col">
      <div
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-xl border border-border/60",
          onSurface ? "bg-canvas" : "bg-surface",
        )}
      >
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          {image ? (
            <Image
              src={image}
              alt={product.product_images?.[0]?.alt ?? product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full items-center justify-center px-4 text-center font-display text-sm text-ink-faint">
              {product.title}
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3">
          {available <= 0 ? (
            <Badge tone="sold">Sold out</Badge>
          ) : available <= 5 ? (
            <Badge tone="low">Only {available} left</Badge>
          ) : (
            <Badge tone="available">Available</Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={saved ? `Remove ${product.title} from saved` : `Save ${product.title}`}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid size-8 cursor-pointer place-items-center rounded-full bg-surface/90 text-ink backdrop-blur transition-colors hover:bg-surface"
        >
          <Heart className={cn("size-4", saved && "fill-clay text-clay")} />
        </button>
      </div>

      <div className="mt-3 flex min-h-[68px] flex-col gap-1">
        <p className="truncate text-right text-[11px] text-ink-faint">{meta || "\u00a0"}</p>
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-2 text-sm font-medium leading-snug text-ink hover:underline"
          >
            {product.title}
          </Link>
          <span className="shrink-0 text-sm font-medium tabular-nums text-ink">
            {formatPrice(product.base_price, product.currency)}
          </span>
        </div>
      </div>

      <Link href={`/product/${product.slug}`} className="mt-auto block pt-3">
        <span
          className={cn(
            "flex h-10 w-full items-center justify-center rounded-full border text-[13px] font-medium",
            "border-border-strong text-ink transition-colors",
            onSurface ? "bg-canvas hover:bg-surface-muted" : "bg-transparent hover:bg-surface-muted",
          )}
        >
          View details
        </span>
      </Link>
    </article>
  );
}
