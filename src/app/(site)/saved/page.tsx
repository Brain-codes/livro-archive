"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { useWishlistStore } from "@/store/wishlist";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/catalog";

export default function SavedPage() {
  const ids = useWishlistStore((s) => s.ids);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    // The catalogue is small enough to filter client-side; if it grows past a few
    // hundred, this becomes a /product?ids= query instead.
    apiGet<Product[]>("product?pageSize=200").then((res) => {
      setProducts((res.data ?? []).filter((p) => ids.includes(p.id)));
    });
  }, [ids]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-24 pt-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-ink-muted">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          <li aria-hidden>/</li>
          <li className="text-ink">Saved</li>
        </ol>
      </nav>

      <h1 className="font-display text-[clamp(32px,4.4vw,52px)] font-semibold">
        Saved for later
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-muted">
        Kept on this device — no account required. Clearing your browser data clears
        this list.
      </p>

      <div className="mt-12">
        {products === null ? (
          <p className="py-16 text-center text-ink-muted">Loading…</p>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-surface-muted">
              <Heart className="size-6 text-ink-faint" />
            </div>
            <p className="font-display text-xl font-semibold">Nothing saved yet</p>
            <p className="max-w-sm text-sm text-ink-muted">
              Tap the heart on anything you want to come back to.
            </p>
            <Link href="/shop">
              <Button>Browse the shelf</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
