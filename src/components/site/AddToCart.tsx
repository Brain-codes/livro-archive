"use client";

import { useState } from "react";
import { Minus, Plus, Heart, ShoppingBag, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

export function AddToCart({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(product.product_variants?.[0]?.id ?? null);
  const [withBundle, setWithBundle] = useState(false);

  const { addLine, addBundle } = useCartStore();
  const { has, toggle } = useWishlistStore();
  const saved = has(product.id);

  const variants = product.product_variants ?? [];
  const variant = variants.find((v) => v.id === variantId);
  const unitPrice = variant?.price_override ?? product.base_price;
  const stock = variant?.available_quantity ?? product.available_quantity ?? 0;
  const image = product.product_images?.[0]?.url ?? null;

  const bundle = product.bundles?.find((b) => b.is_active);
  const bundleExtras = bundle?.bundle_items ?? [];
  const bundleAddOn = bundleExtras.reduce(
    (sum, item) => sum + (item.price_override ?? item.products.base_price) * item.quantity,
    0,
  );
  const bundleFull = bundleExtras.reduce(
    (sum, item) => sum + item.products.base_price * item.quantity,
    0,
  );
  const bundleSaving = bundleFull - bundleAddOn;
  const displayTotal = unitPrice * quantity + (withBundle ? bundleAddOn : 0);

  function handleAdd() {
    if (stock <= 0) return;

    const base = {
      productId: product.id,
      variantId,
      title: variant ? `${product.title} — ${variant.name}` : product.title,
      image,
      unitPrice,
      quantity,
      maxStock: stock,
    };

    if (withBundle && bundle) {
      addBundle([
        { ...base, bundleId: bundle.id, bundleName: bundle.name },
        ...bundleExtras.map((item) => ({
          productId: item.product_id,
          variantId: item.variant_id,
          bundleId: bundle.id,
          bundleName: bundle.name,
          title: item.products.title,
          image: item.products.product_images?.[0]?.url ?? null,
          unitPrice: item.price_override ?? item.products.base_price,
          quantity: item.quantity,
          maxStock: item.products.available_quantity ?? 99,
        })),
      ]);
      toast.success(`${bundle.name} added to your basket`);
      return;
    }

    addLine(base);
    toast.success(`${product.title} added to your basket`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-3xl font-semibold tabular-nums">
          {formatPrice(unitPrice, product.currency)}
        </span>
        {product.compare_at_price && product.compare_at_price > unitPrice && (
          <span className="text-sm text-ink-faint line-through tabular-nums">
            {formatPrice(product.compare_at_price, product.currency)}
          </span>
        )}
        {stock <= 0 ? (
          <Badge tone="sold">Sold out</Badge>
        ) : stock <= 5 ? (
          <Badge tone="low">Only {stock} left</Badge>
        ) : (
          <Badge tone="available">Available</Badge>
        )}
      </div>

      {variants.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-[13px] font-medium text-ink">Format</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                aria-pressed={variantId === v.id}
                disabled={v.available_quantity <= 0}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2 text-[13px] transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  variantId === v.id
                    ? "border-forest bg-forest text-on-dark dark:text-canvas"
                    : "border-border-strong text-ink hover:bg-surface-muted",
                )}
              >
                {v.name}
                {v.price_override != null && v.price_override !== product.base_price && (
                  <span className="ml-1.5 opacity-70">
                    {formatPrice(v.price_override, product.currency)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {bundle && bundleExtras.length > 0 && (
        <button
          type="button"
          onClick={() => setWithBundle((v) => !v)}
          aria-pressed={withBundle}
          className={cn(
            "w-full cursor-pointer rounded-2xl border p-5 text-left transition-colors",
            withBundle
              ? "border-forest bg-forest/[0.06]"
              : "border-border-strong hover:bg-surface-muted",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                withBundle ? "border-forest bg-forest text-on-dark dark:text-canvas" : "border-border-strong",
              )}
            >
              {withBundle && <Check className="size-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold">
                <Sparkles className="size-3.5" /> Complete the set
              </p>
              <p className="mt-1 font-display text-base font-semibold text-ink">
                {bundle.name}
              </p>
              <ul className="mt-2.5 space-y-1 text-[13px]">
                {bundleExtras.map((item) => {
                  const price = item.price_override ?? item.products.base_price;
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3">
                      <span className="text-ink-muted">
                        + {item.quantity} × {item.products.title}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {price === 0 ? (
                          <span className="font-medium text-forest">Free</span>
                        ) : (
                          <>
                            <span className="mr-1.5 text-ink-faint line-through">
                              {formatPrice(item.products.base_price)}
                            </span>
                            {formatPrice(price)}
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {bundleSaving > 0 && (
                <p className="mt-2.5 text-[13px] font-medium text-forest">
                  Add all for {formatPrice(bundleAddOn)} — save {formatPrice(bundleSaving)}
                </p>
              )}
            </div>
          </div>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border-strong px-2 py-1.5">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="grid size-8 cursor-pointer place-items-center rounded-full text-ink-muted hover:text-ink"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            disabled={quantity >= stock}
            aria-label="Increase quantity"
            className="grid size-8 cursor-pointer place-items-center rounded-full text-ink-muted hover:text-ink disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Button size="lg" disabled={stock <= 0} onClick={handleAdd} className="min-w-[220px] flex-1">
          <ShoppingBag className="size-4" />
          {stock <= 0 ? "Out of stock" : `Add to basket · ${formatPrice(displayTotal)}`}
        </Button>

        <button
          onClick={() => toggle(product.id)}
          aria-label={saved ? "Remove from saved" : "Save for later"}
          aria-pressed={saved}
          className="grid size-13 cursor-pointer place-items-center rounded-full border border-border-strong text-ink transition-colors hover:bg-surface-muted"
        >
          <Heart className={cn("size-5", saved && "fill-clay text-clay")} />
        </button>
      </div>
    </div>
  );
}
