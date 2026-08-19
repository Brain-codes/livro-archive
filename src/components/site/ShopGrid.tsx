"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProductCard } from "@/components/site/ProductCard";
import type { Product } from "@/types/catalog";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function ShopGrid({ products }: { products: Product[] }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll("[data-card]");
    const ctx = gsap.context(() => {
      gsap.from(cards, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.06,
        scrollTrigger: { trigger: gridRef.current, start: "top 85%" },
      });
    });
    return () => ctx.revert();
  }, [products]);

  if (products.length === 0) {
    return (
      <p className="py-20 text-center text-ink-muted">
        No products found. Try a different filter, or check back soon.
      </p>
    );
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4"
    >
      {products.map((p) => (
        <div key={p.id} data-card>
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
