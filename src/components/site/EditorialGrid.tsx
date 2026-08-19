import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

export type EditorialPanelData = {
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  product?: Product;
};

/**
 * Bento editorial block: one tall panel beside two stacked ones. Each is a
 * category story told over real product photography, with the copy anchored
 * bottom-left over a gradient floor so it stays legible on any image.
 */
export function EditorialGrid({ panels }: { panels: EditorialPanelData[] }) {
  const [lead, ...rest] = panels;
  if (!lead) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-20">
      <div className="grid gap-4 lg:grid-cols-2">
        <EditorialPanel
          panel={lead}
          size="lead"
          className="min-h-[460px] lg:min-h-[760px]"
          priority
        />
        <div className="grid gap-4">
          {rest.slice(0, 2).map((panel) => (
            <EditorialPanel
              key={panel.href + panel.title}
              panel={panel}
              size="stacked"
              className="min-h-[340px] lg:min-h-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorialPanel({
  panel,
  size,
  className,
  priority = false,
}: {
  panel: EditorialPanelData;
  size: "lead" | "stacked";
  className?: string;
  priority?: boolean;
}) {
  const image = panel.product?.product_images?.[0]?.url;

  return (
    <Link
      href={panel.href}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-surface-muted",
        size === "lead" ? "p-8 sm:p-12" : "p-8 sm:p-10",
        className,
      )}
    >
      {image && (
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="scale-105 object-cover blur-[2px] transition-transform duration-[900ms] ease-out group-hover:scale-[1.09]"
          priority={priority}
        />
      )}

      {/* The artwork is atmosphere here, not the subject: a colour wash knocks it
          back so the panel's own headline stays the loudest thing in the frame. */}
      <div aria-hidden className="absolute inset-0 bg-forest-deep/70" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
      />

      <div className={cn("relative", size === "lead" ? "max-w-[26rem]" : "max-w-[22rem]")}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
          {panel.eyebrow}
        </p>
        <h3
          className={cn(
            "mt-3 font-display font-semibold leading-[1.06] text-white",
            size === "lead"
              ? "text-[clamp(30px,3.6vw,46px)]"
              : "text-[clamp(26px,2.9vw,40px)]",
          )}
        >
          {panel.title}
        </h3>
        <p className="mt-3 text-[14px] leading-snug text-white/85">{panel.copy}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-white">
          Discover now
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
