"use client";

import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const { lines, setQuantity, removeLine, subtotal } = useCartStore();

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-5 py-24 text-center">
        <ShoppingBag className="size-12 text-ink-muted" />
        <h1 className="font-display text-2xl text-ink">Your basket is empty</h1>
        <p className="text-ink-muted">Find something worth reading (or writing with).</p>
        <Link href="/shop">
          <Button size="lg">Browse the shelf</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-3xl text-ink mb-8">Your basket</h1>

      <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {lines.map((line) => (
          <div key={line.lineId} className="flex gap-4 p-5">
            <div className="relative h-24 w-20 flex-none overflow-hidden rounded-lg bg-surface-muted">
              {line.image && (
                <Image src={line.image} alt={line.title} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              {line.bundleName && (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gold">
                  {line.bundleName}
                </p>
              )}
              <p className="font-medium text-ink">{line.title}</p>
              <p className="text-sm text-ink-muted tabular-nums">{formatPrice(line.unitPrice)}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                  <button onClick={() => setQuantity(line.lineId, line.quantity - 1)}>
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                  <button
                    disabled={line.quantity >= line.maxStock}
                    onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeLine(line.lineId)}
                  className="text-ink-muted hover:text-danger"
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="font-semibold tabular-nums">
              {formatPrice(line.unitPrice * line.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-ink-muted">Subtotal</p>
        <p className="font-display text-2xl">{formatPrice(subtotal())}</p>
      </div>

      <div className="mt-6 flex justify-end">
        <Link href="/checkout">
          <Button size="lg">Proceed to checkout</Button>
        </Link>
      </div>
    </div>
  );
}
