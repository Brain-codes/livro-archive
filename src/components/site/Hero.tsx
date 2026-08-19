"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/types/catalog";

/**
 * Hero: a flush cream panel of type, then two images at staggered heights —
 * the taller one butted straight against the panel, the shorter one inset and
 * dropped lower. Both carry a small label pill in the bottom-right corner.
 */
export function Hero({ showcase }: { showcase: Product[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const [primary, secondary] = showcase;

  useEffect(() => {
    if (!rootRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-hero-eyebrow]", { y: 12, opacity: 0, duration: 0.5 })
        .from("[data-hero-line]", { y: 34, opacity: 0, duration: 0.75, stagger: 0.09 }, "-=0.25")
        .from("[data-hero-sub]", { y: 16, opacity: 0, duration: 0.55 }, "-=0.45")
        .from("[data-hero-cta]", { y: 14, opacity: 0, duration: 0.5 }, "-=0.35")
        .from("[data-hero-img]", { y: 40, opacity: 0, duration: 0.85, stagger: 0.14 }, "-=0.85");
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="mx-auto max-w-[1440px] px-5 pb-4 pt-4">
      <div className="grid gap-4 lg:min-h-[660px] lg:grid-cols-[44fr_34fr_22fr] lg:gap-0">
        {/* Type panel — sits flush against the first image on desktop */}
        <div className="flex flex-col justify-center rounded-2xl bg-surface-muted px-8 py-14 sm:px-12 lg:rounded-r-none lg:py-20 lg:pl-14 lg:pr-16">
          <p data-hero-eyebrow className="eyebrow">
            Livro Archive
          </p>

          <h1 className="mt-6 font-display text-[clamp(38px,5vw,68px)] font-semibold">
            <span data-hero-line className="block">Books that</span>
            <span data-hero-line className="block">stay with you.</span>
          </h1>

          <p
            data-hero-sub
            className="mt-6 max-w-[22rem] text-[15px] leading-relaxed text-ink-muted"
          >
            Fiction, textbooks and the stationery that goes with them — curated for
            people who still read the paper kind.
          </p>

          <div data-hero-cta className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 rounded-full bg-forest px-6 py-3.5 text-sm font-medium text-on-dark transition-colors hover:bg-forest-deep dark:text-canvas"
            >
              Discover the shelf
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/bundles"
              className="text-sm font-medium text-ink underline decoration-border-strong underline-offset-[5px] transition-colors hover:decoration-ink"
            >
              Shop bundles
            </Link>
          </div>
        </div>

        {/* Tall image, flush to the panel */}
        <HeroImage
          product={primary}
          label="New this week"
          className="aspect-[4/5] lg:aspect-auto lg:my-10 lg:rounded-l-none"
          priority
        />

        {/* Shorter image, inset and dropped */}
        <HeroImage
          product={secondary}
          label="Stationery"
          className="aspect-[3/4] lg:aspect-auto lg:my-[4.5rem] lg:ml-4"
        />
      </div>
    </section>
  );
}

function HeroImage({
  product,
  label,
  className = "",
  priority = false,
}: {
  product?: Product;
  label: string;
  className?: string;
  priority?: boolean;
}) {
  const image = product?.product_images?.[0]?.url;

  return (
    <div
      data-hero-img
      className={`relative overflow-hidden rounded-2xl bg-surface-muted ${className}`}
    >
      {image && product ? (
        <Link href={`/product/${product.slug}`} className="absolute inset-0 block">
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.04]"
            priority={priority}
          />
        </Link>
      ) : (
        <div className="flex h-full min-h-[260px] items-center justify-center">
          <span className="font-display text-sm text-ink-faint">{label}</span>
        </div>
      )}

      <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-canvas/95 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink backdrop-blur">
        {label}
      </span>
    </div>
  );
}
