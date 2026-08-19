"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/types/catalog";

/**
 * "What are you looking for?" — product cutouts floating directly on the canvas,
 * no cards and no frames, with the label centred underneath. Arrows sit on the
 * rail's edges rather than above it.
 */
export function CategoryRail({
  categories,
  covers,
}: {
  categories: Category[];
  covers: Record<string, string | undefined>;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    function update() {
      if (!rail) return;
      setAtStart(rail.scrollLeft <= 8);
      setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8);
    }

    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [categories.length]);

  if (categories.length === 0) return null;

  function scrollBy(direction: 1 | -1) {
    railRef.current?.scrollBy({ left: direction * 360, behavior: "smooth" });
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1440px] px-5">
        <p className="eyebrow">Discover directly</p>
        <h2 className="mt-3 font-display text-[clamp(30px,4.2vw,54px)] font-semibold">
          What are you looking for?
        </h2>
      </div>

      <div className="relative mt-12">
        <div
          ref={railRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-10 overflow-x-auto px-5 sm:gap-14 sm:px-14"
        >
          {categories.map((category) => {
            const cover = covers[category.id];
            return (
              <Link
                key={category.id}
                href={`/shop/${category.slug}`}
                className="group w-[150px] shrink-0 snap-center sm:w-[200px]"
              >
                <div className="relative h-[200px] sm:h-[270px]">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-contain transition-transform duration-500 group-hover:-translate-y-1.5"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-center font-display text-sm text-ink-faint">
                      {category.name}
                    </span>
                  )}
                </div>
                <p className="mt-6 text-center text-[15px] font-medium text-ink">
                  {category.name}
                </p>
              </Link>
            );
          })}
        </div>

        <RailArrow side="left" onClick={() => scrollBy(-1)} hidden={atStart} />
        <RailArrow side="right" onClick={() => scrollBy(1)} hidden={atEnd} />
      </div>
    </section>
  );
}

function RailArrow({
  side,
  onClick,
  hidden,
}: {
  side: "left" | "right";
  onClick: () => void;
  hidden: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      className={`absolute top-[100px] hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-border bg-canvas text-ink shadow-sm transition-opacity hover:bg-surface-muted sm:grid sm:top-[135px] ${
        side === "left" ? "left-3" : "right-3"
      } ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <Icon className="size-4" />
    </button>
  );
}
