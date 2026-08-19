"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { formatPrice, cn } from "@/lib/utils";

export function CartDrawer() {
  const { isOpen, close, lines, setQuantity, removeLine, subtotal } = useCartStore();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const total = subtotal();

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-ink/45 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-label="Your basket"
        aria-hidden={!isOpen}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col bg-canvas",
          "transition-transform duration-350 ease-[cubic-bezier(.22,.9,.2,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-semibold">Your basket</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              {lines.length === 0
                ? "Nothing here yet"
                : `${lines.reduce((n, l) => n + l.quantity, 0)} item${lines.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close basket"
            className="grid size-9 cursor-pointer place-items-center rounded-full border border-border text-ink transition-colors hover:bg-surface-muted"
          >
            <X className="size-4" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-surface-muted">
              <ShoppingBag className="size-6 text-ink-faint" />
            </div>
            <p className="text-sm text-ink-muted">
              Your basket is empty. Find something worth reading.
            </p>
            <Button variant="outline" onClick={close}>
              Keep browsing
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {lines.map((line) => (
                <div key={line.lineId} className="flex gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                    {line.image && (
                      <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {line.bundleName && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gold">
                        {line.bundleName}
                      </p>
                    )}
                    <p className="line-clamp-2 text-sm font-medium text-ink">{line.title}</p>
                    <p className="mt-0.5 text-sm tabular-nums text-ink-muted">
                      {line.unitPrice === 0 ? "Free" : formatPrice(line.unitPrice)}
                    </p>

                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex items-center gap-1 rounded-full border border-border">
                        <button
                          onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="grid size-7 cursor-pointer place-items-center rounded-full text-ink-muted hover:text-ink"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                          disabled={line.quantity >= line.maxStock}
                          aria-label="Increase quantity"
                          className="grid size-7 cursor-pointer place-items-center rounded-full text-ink-muted hover:text-ink disabled:opacity-30"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeLine(line.lineId)}
                        aria-label={`Remove ${line.title}`}
                        className="cursor-pointer text-ink-faint transition-colors hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="space-y-4 border-t border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Subtotal</span>
                <span className="font-display text-xl font-semibold tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-xs text-ink-faint">
                Delivery is calculated at checkout.
              </p>
              <Link href="/checkout" onClick={close} className="block">
                <Button size="lg" className="w-full">
                  Checkout
                </Button>
              </Link>
              <Link href="/cart" onClick={close} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  View full basket
                </Button>
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
