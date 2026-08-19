"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/catalog";

export function AddToCart({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.product_variants?.[0]?.id ?? null,
  );
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(
    product.bundles?.[0]?.id ?? null,
  );

  const { addLine, addBundle } = useCartStore();

  const variant = product.product_variants?.find((v) => v.id === selectedVariant);
  const unitPrice = variant?.price_override ?? product.base_price;
  const stock = variant?.stock_quantity ?? product.stock_quantity;
  const image = product.product_images?.[0]?.url ?? null;
  const bundle = product.bundles?.find((b) => b.id === selectedBundleId);

  function handleAddSolo() {
    if (stock <= 0) return;
    addLine({
      productId: product.id,
      variantId: selectedVariant,
      title: product.title,
      image,
      unitPrice,
      quantity,
      maxStock: stock,
    });
    toast.success(`${product.title} added to your basket`);
  }

  function handleAddBundle() {
    if (!bundle) return handleAddSolo();
    const lines = [
      {
        productId: product.id,
        variantId: selectedVariant,
        bundleId: bundle.id,
        bundleName: bundle.name,
        title: product.title,
        image,
        unitPrice,
        quantity,
        maxStock: stock,
      },
      ...bundle.bundle_items.map((item) => ({
        productId: item.product_id,
        variantId: item.variant_id,
        bundleId: bundle.id,
        bundleName: bundle.name,
        title: item.products.title,
        image: item.products.product_images?.[0]?.url ?? null,
        unitPrice: item.price_override ?? item.products.base_price,
        quantity: item.quantity,
        maxStock: 999,
      })),
    ];
    addBundle(lines);
    toast.success(`${bundle.name} added to your basket`);
  }

  return (
    <div className="space-y-6">
      {product.product_variants && product.product_variants.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Format
          </p>
          <div className="flex flex-wrap gap-2">
            {product.product_variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={`rounded-full border px-4 py-2 text-sm ${
                  selectedVariant === v.id
                    ? "border-primary bg-primary/10 text-primary-ink"
                    : "border-border text-ink-muted hover:border-ink"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-border px-3 py-2">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="text-ink-muted hover:text-ink"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-6 text-center tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            className="text-ink-muted hover:text-ink"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <PriceTag price={unitPrice * quantity} currency={product.currency} size="lg" />
      </div>

      {product.bundles && product.bundles.length > 0 && bundle && (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold">
            <Sparkles className="size-3.5" /> Complete the set
          </p>
          <p className="mt-1 font-display text-lg text-ink">{bundle.name}</p>
          {bundle.description && (
            <p className="mt-1 text-sm text-ink-muted">{bundle.description}</p>
          )}
          <ul className="mt-3 space-y-1.5 text-sm">
            {bundle.bundle_items.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <span className="text-ink-muted">
                  + {item.quantity} × {item.products.title}
                </span>
                <span className="tabular-nums text-ink-muted">
                  {item.price_override === 0
                    ? "Free"
                    : formatPrice(item.price_override ?? item.products.base_price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" disabled={stock <= 0} onClick={handleAddSolo} className="flex-1">
          {stock <= 0 ? "Out of stock" : "Add to basket"}
        </Button>
        {bundle && (
          <Button
            size="lg"
            variant="secondary"
            disabled={stock <= 0}
            onClick={handleAddBundle}
            className="flex-1"
          >
            Add the set
          </Button>
        )}
      </div>
    </div>
  );
}
