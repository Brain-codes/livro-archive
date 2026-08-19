"use client";

import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { formatPrice, cn } from "@/lib/utils";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CartDrawer() {
  const { isOpen, close, lines, setQuantity, removeLine, subtotal } = useCartStore();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ink/40 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-xl">Your basket</h2>
          <button onClick={close} className="text-ink-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-6">
            <ShoppingBag className="size-10 text-ink-muted" />
            <p className="text-ink-muted">Your basket is empty.</p>
            <Button variant="secondary" onClick={close}>
              Continue browsing
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {lines.map((line) => (
                <div key={line.lineId} className="flex gap-4">
                  <div className="relative h-20 w-16 flex-none overflow-hidden rounded-lg bg-surface-muted">
                    {line.image && (
                      <Image src={line.image} alt={line.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {line.bundleName && (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gold">
                        {line.bundleName}
                      </p>
                    )}
                    <p className="text-sm font-medium text-ink line-clamp-2">{line.title}</p>
                    <p className="text-sm text-ink-muted tabular-nums">
                      {formatPrice(line.unitPrice)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="flex size-7 items-center justify-center rounded-full border border-border hover:bg-surface-muted"
                        onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                      <button
                        className="flex size-7 items-center justify-center rounded-full border border-border hover:bg-surface-muted disabled:opacity-30"
                        disabled={line.quantity >= line.maxStock}
                        onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        className="ml-auto text-xs text-ink-muted hover:text-danger"
                        onClick={() => removeLine(line.lineId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-6 py-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatPrice(subtotal())}</span>
              </div>
              <Link href="/checkout" onClick={close}>
                <Button className="w-full" size="lg">
                  Checkout
                </Button>
              </Link>
              <Link href="/cart" onClick={close}>
                <Button variant="secondary" className="w-full" size="sm">
                  View full basket
                </Button>
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
