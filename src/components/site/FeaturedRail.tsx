"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/catalog";

/**
 * The sage band. Full-bleed colour breaks the cream rhythm once per page and
 * signals "these are the ones we'd pick".
 */
export function FeaturedRail({
  products,
  eyebrow = "Handpicked",
  title = "Favourites from our shelves",
}: {
  products: Product[];
  eyebrow?: string;
  title?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scrollBy(direction: 1 | -1) {
    railRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  }

  return (
    <section className="bg-sage py-16 dark:bg-sage-soft">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-deep/70 dark:text-on-dark/60">
              {eyebrow}
            </p>
            <h2 className="mt-2 max-w-lg font-display text-[clamp(24px,3vw,34px)] font-semibold text-forest-deep dark:text-on-dark">
              {title}
            </h2>
          </div>
          <Link
            href="/shop"
            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-deep underline underline-offset-4 dark:text-on-dark"
          >
            View all
          </Link>
        </div>

        <div
          ref={railRef}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2"
        >
          {products.map((product) => (
            <div key={product.id} className="w-[230px] shrink-0 snap-start sm:w-[260px]">
              <ProductCard product={product} onSurface />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-forest-deep/25 text-forest-deep transition-colors hover:bg-canvas/40 dark:border-on-dark/25 dark:text-on-dark"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-forest-deep/25 text-forest-deep transition-colors hover:bg-canvas/40 dark:border-on-dark/25 dark:text-on-dark"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
