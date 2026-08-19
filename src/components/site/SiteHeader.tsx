"use client";

import Link from "next/link";
import { ShoppingBag, Search, User, PackageSearch } from "lucide-react";
import { useCartStore } from "@/store/cart";

export function SiteHeader() {
  const { open, count } = useCartStore();
  const itemCount = count();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          Livro Archive
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-ink-muted md:flex">
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          <Link href="/shop/fiction" className="hover:text-ink">Fiction</Link>
          <Link href="/shop/notebooks-journals" className="hover:text-ink">Stationery</Link>
          <Link href="/track" className="hover:text-ink">Track order</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button aria-label="Search" className="text-ink-muted hover:text-ink">
            <Search className="size-5" />
          </button>
          <Link href="/track" aria-label="Track order" className="text-ink-muted hover:text-ink md:hidden">
            <PackageSearch className="size-5" />
          </Link>
          <Link href="/account" aria-label="Account" className="text-ink-muted hover:text-ink">
            <User className="size-5" />
          </Link>
          <button
            aria-label="Cart"
            onClick={open}
            className="relative text-ink-muted hover:text-ink"
          >
            <ShoppingBag className="size-5" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
