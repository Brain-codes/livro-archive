"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/catalog";

/**
 * Bordered category strip that sits under the page title on shop pages. The
 * active category carries a solid underline, so where you are is never ambiguous.
 */
export function CategoryStrip({
  categories,
  covers,
  activeSlug,
}: {
  categories: Category[];
  covers: Record<string, string | undefined>;
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="no-scrollbar -mx-5 mb-8 flex overflow-x-auto px-5">
      <div className="flex min-w-full border border-border">
        {categories.map((category) => {
          const active = category.slug === activeSlug;
          const cover = covers[category.id];

          return (
            <Link
              key={category.id}
              href={`/shop/${category.slug}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex w-[150px] shrink-0 flex-col border-r border-border last:border-r-0",
                "bg-surface transition-colors hover:bg-surface-muted sm:w-[180px]",
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {cover ? (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="180px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center px-3 text-center font-display text-xs text-ink-faint">
                    {category.name}
                  </span>
                )}
              </div>
              <p className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">
                {category.name}
              </p>
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[3px] bg-forest"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
