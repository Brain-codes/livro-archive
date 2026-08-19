"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/catalog";

export function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const hasImages = images.length > 0;
  const active = images[index];

  function step(direction: 1 | -1) {
    setIndex((i) => (i + direction + images.length) % images.length);
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-muted">
        {hasImages ? (
          <Image
            key={active.url}
            src={active.url}
            alt={active.alt ?? title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <span className="flex h-full items-center justify-center px-8 text-center font-display text-xl text-ink-faint">
            {title}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-canvas/90 text-ink backdrop-blur transition-colors hover:bg-canvas"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-canvas/90 text-ink backdrop-blur transition-colors hover:bg-canvas"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((image, i) => (
            <button
              key={image.url}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative size-20 cursor-pointer overflow-hidden rounded-lg border-2 bg-surface-muted transition-colors",
                i === index ? "border-forest" : "border-transparent hover:border-border-strong",
              )}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
