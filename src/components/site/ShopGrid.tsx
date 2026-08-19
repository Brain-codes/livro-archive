"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/catalog";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "title", label: "Title A–Z" },
];

export function ShopGrid({ products }: { products: Product[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showFilters, setShowFilters] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  const sort = searchParams.get("sort") ?? "newest";

  const visible = useMemo(
    () =>
      inStockOnly
        ? products.filter((p) => (p.available_quantity ?? p.stock_quantity) > 0)
        : products,
    [products, inStockOnly],
  );

  useEffect(() => {
    if (!gridRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.batch("[data-card]", {
        start: "top 92%",
        onEnter: (batch) =>
          gsap.from(batch, {
            opacity: 0,
            y: 22,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.05,
            overwrite: true,
          }),
      });
    }, gridRef);

    return () => ctx.revert();
  }, [visible.length]);

  function applySort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <div className="sticky top-[108px] z-20 -mx-5 mb-8 border-y border-border bg-canvas/95 px-5 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink"
          >
            <SlidersHorizontal className="size-4" />
            Filter
          </button>

          <label className="ml-2 flex items-center gap-2">
            <span className="sr-only">Sort products</span>
            <select
              value={sort}
              onChange={(e) => applySort(e.target.value)}
              className="cursor-pointer rounded-full border border-border bg-surface px-4 py-1.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-forest/40"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <span className="ml-auto text-[13px] text-ink-muted tabular-nums">
            {visible.length} {visible.length === 1 ? "product" : "products"}
          </span>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <button
              onClick={() => setInStockOnly((v) => !v)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                inStockOnly
                  ? "border-forest bg-forest text-on-dark dark:text-canvas"
                  : "border-border-strong text-ink hover:bg-surface-muted"
              }`}
            >
              In stock only
              {inStockOnly && <X className="size-3.5" />}
            </button>
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-xl font-semibold text-ink">Nothing here yet</p>
          <p className="mt-2 text-sm text-ink-muted">
            Try removing a filter, or browse another category.
          </p>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-5"
        >
          {visible.map((product) => (
            <div key={product.id} data-card>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
