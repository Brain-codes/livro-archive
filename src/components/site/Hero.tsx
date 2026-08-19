"use client";

import { useEffect, useRef, useState, Suspense, lazy } from "react";
import gsap from "gsap";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const HeroScene = lazy(() => import("./HeroScene").then((m) => ({ default: m.HeroScene })));

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [allowMotion, setAllowMotion] = useState(false);
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAllowMotion(!mq.matches);
    // Cheap capability heuristic: skip the 3D scene on small/low-power screens.
    setCanRender3D(!mq.matches && window.innerWidth >= 768);
  }, []);

  useEffect(() => {
    if (!allowMotion || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-eyebrow]", { y: 16, opacity: 0, duration: 0.6, ease: "power2.out" });
      gsap.from("[data-hero-title]", {
        y: 28,
        opacity: 0,
        duration: 0.8,
        delay: 0.1,
        ease: "power2.out",
      });
      gsap.from("[data-hero-sub]", {
        y: 20,
        opacity: 0,
        duration: 0.7,
        delay: 0.25,
        ease: "power2.out",
      });
      gsap.from("[data-hero-cta]", {
        y: 16,
        opacity: 0,
        duration: 0.6,
        delay: 0.4,
        ease: "power2.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [allowMotion]);

  return (
    <section ref={rootRef} className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <p
            data-hero-eyebrow
            className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
          >
            Books &middot; Stationery &middot; Everything in between
          </p>
          <h1
            data-hero-title
            className="mt-4 font-display text-5xl leading-[1.05] text-ink sm:text-6xl"
          >
            A shelf worth
            <br />
            getting lost in.
          </h1>
          <p data-hero-sub className="mt-6 max-w-md text-lg text-ink-muted">
            No account required — pick something, add what pairs with it, and it's on
            its way to your door. Trackable from the moment you check out.
          </p>
          <div data-hero-cta className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-ink"
            >
              Browse the shelf <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-ink hover:bg-surface-muted"
            >
              Track an order
            </Link>
          </div>
        </div>

        <div className="relative aspect-square w-full max-w-md justify-self-center lg:max-w-none">
          {canRender3D ? (
            <Suspense fallback={<HeroFallback />}>
              <HeroScene />
            </Suspense>
          ) : (
            <HeroFallback />
          )}
        </div>
      </div>
    </section>
  );
}

function HeroFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-surface-muted">
      <span className="font-display text-2xl text-ink-muted">Livro Archive</span>
    </div>
  );
}
