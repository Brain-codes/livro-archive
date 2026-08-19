"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Truck,
  BookOpen,
  Library,
  PenLine,
  Sparkles,
  Menu,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { MegaMenu } from "./MegaMenu";
import { Wordmark } from "./Wordmark";

const NAV = [
  { label: "Books", href: "/shop", icon: BookOpen, menu: true },
  { label: "Categories", href: "/shop", icon: Library, menu: true },
  { label: "Stationery", href: "/shop/notebooks-journals", icon: PenLine, menu: false },
  { label: "Bundles", href: "/bundles", icon: Sparkles, menu: false },
];

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const cartCount = useCartStore((s) => s.count());
  const openCart = useCartStore((s) => s.open);
  const savedCount = useWishlistStore((s) => s.ids.length);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-5">
          {/* Row 1 — wordmark, search, account actions */}
          <div className="flex h-16 items-center gap-4">
            <Link href="/" aria-label="Livro Archive — home" className="shrink-0">
              <Wordmark className="h-6 w-auto text-ink" />
            </Link>

            <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 md:block">
              <label className="relative block">
                <span className="sr-only">Search books and stationery</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search titles, authors, stationery…"
                  className="h-10 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-forest/40"
                />
              </label>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/account"
                aria-label="Your account"
                className="grid size-10 place-items-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-surface-muted"
              >
                <User className="size-[18px]" />
              </Link>
              <Link
                href="/saved"
                aria-label={`Saved items${savedCount ? ` (${savedCount})` : ""}`}
                className="relative grid size-10 place-items-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-surface-muted"
              >
                <Heart className="size-[18px]" />
                {savedCount > 0 && <Dot>{savedCount}</Dot>}
              </Link>
              <button
                onClick={openCart}
                aria-label={`Basket${cartCount ? ` (${cartCount} items)` : ""}`}
                className="relative grid size-10 cursor-pointer place-items-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-surface-muted"
              >
                <ShoppingBag className="size-[18px]" />
                {cartCount > 0 && <Dot>{cartCount}</Dot>}
              </button>
            </div>
          </div>

          {/* Row 2 — icon nav + the delivery promise */}
          <div className="flex h-11 items-center gap-6 border-t border-border/60">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-60 lg:hidden"
            >
              <Menu className="size-4" /> Menu
            </button>

            <nav className="hidden items-center gap-6 lg:flex">
              {NAV.map(({ label, href, icon: Icon, menu }) =>
                menu ? (
                  <button
                    key={label}
                    onClick={() => setMenuOpen(true)}
                    className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-60"
                  >
                    <Icon className="size-[15px] text-ink-muted" />
                    {label}
                  </button>
                ) : (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-opacity hover:opacity-60"
                  >
                    <Icon className="size-[15px] text-ink-muted" />
                    {label}
                  </Link>
                ),
              )}
            </nav>

            <Link
              href="/track"
              className="ml-auto hidden items-center gap-2 rounded-full bg-forest px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-dark transition-colors hover:bg-forest-deep sm:flex dark:text-canvas"
            >
              <Truck className="size-3.5" />
              Track your order
            </Link>
          </div>
        </div>
      </header>

      <MegaMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function Dot({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[10px] font-semibold leading-[18px] text-white">
      {children}
    </span>
  );
}
