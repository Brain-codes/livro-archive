import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";
import { apiServer } from "@/lib/api/server";
import { formatPrice } from "@/lib/utils";
import { Newsletter } from "@/components/site/Newsletter";
import type { Bundle, Product } from "@/types/catalog";
import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Bundles & sets",
  description:
    "Buy the book and the things that go with it — notebooks, pens and markers bundled at a better price than buying them apart.",
  alternates: { canonical: `${SITE}/bundles` },
};

export const revalidate = 120;

type BundleWithPrimary = Bundle & { primary_product_id: string };

export default async function BundlesPage() {
  const [bundlesRes, productsRes] = await Promise.all([
    apiServer<BundleWithPrimary[]>("promotions/bundles", { revalidate: 120 }),
    apiServer<Product[]>("product?pageSize=200", { revalidate: 120 }),
  ]);

  const bundles = bundlesRes.data ?? [];
  const products = productsRes.data ?? [];
  const byId = new Map(products.map((p) => [p.id, p]));

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-ink-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="text-ink">Bundles</li>
          </ol>
        </nav>

        <p className="eyebrow">Complete the set</p>
        <h1 className="mt-3 max-w-2xl font-display text-[clamp(32px,4.4vw,52px)] font-semibold">
          Buy the book. Get what goes with it.
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-muted">
          A novel is better with a notebook. A textbook is better with the right pens.
          These sets are priced below buying the pieces separately — and some of what's
          inside is free.
        </p>

        {bundles.length === 0 ? (
          <p className="py-24 text-center text-ink-muted">
            No bundles are running right now. Check back soon.
          </p>
        ) : (
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            {bundles.map((bundle) => {
              const primary = byId.get(bundle.primary_product_id);
              if (!primary) return null;

              const extras = bundle.bundle_items ?? [];
              const extrasFull = extras.reduce(
                (sum, i) => sum + i.products.base_price * i.quantity,
                0,
              );
              const extrasBundle = extras.reduce(
                (sum, i) => sum + (i.price_override ?? i.products.base_price) * i.quantity,
                0,
              );
              const saving = extrasFull - extrasBundle;

              return (
                <Link
                  key={bundle.id}
                  href={`/product/${primary.slug}`}
                  className="group flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong sm:flex-row"
                >
                  <div className="flex shrink-0 gap-2">
                    <Cover product={primary} size="lg" />
                    <div className="flex flex-col gap-2">
                      {extras.slice(0, 2).map((item) => (
                        <Cover key={item.id} product={item.products} size="sm" />
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
                      <Sparkles className="size-3.5" /> Bundle
                    </p>
                    <h2 className="mt-2 font-display text-xl font-semibold text-ink">
                      {bundle.name}
                    </h2>
                    {bundle.description && (
                      <p className="mt-1.5 text-sm text-ink-muted">{bundle.description}</p>
                    )}

                    <ul className="mt-4 space-y-1.5 text-[13px]">
                      <li className="flex justify-between gap-3">
                        <span className="truncate text-ink">{primary.title}</span>
                        <span className="shrink-0 tabular-nums text-ink">
                          {formatPrice(primary.base_price)}
                        </span>
                      </li>
                      {extras.map((item) => {
                        const price = item.price_override ?? item.products.base_price;
                        return (
                          <li key={item.id} className="flex justify-between gap-3">
                            <span className="truncate text-ink-muted">
                              + {item.quantity} × {item.products.title}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {price === 0 ? (
                                <span className="font-medium text-forest">Free</span>
                              ) : (
                                <>
                                  <span className="mr-1.5 text-ink-faint line-through">
                                    {formatPrice(item.products.base_price)}
                                  </span>
                                  <span className="text-ink">{formatPrice(price)}</span>
                                </>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="text-sm font-medium text-ink tabular-nums">
                        {formatPrice(primary.base_price + extrasBundle)} for the set
                      </span>
                      {saving > 0 && (
                        <span className="text-[13px] font-medium text-forest">
                          Save {formatPrice(saving)}
                        </span>
                      )}
                    </div>

                    <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      View the set
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Newsletter />
    </>
  );
}

function Cover({
  product,
  size,
}: {
  product: { title: string; product_images?: { url: string }[] };
  size: "lg" | "sm";
}) {
  const url = product.product_images?.[0]?.url;
  const box = size === "lg" ? "h-[168px] w-[126px]" : "h-20 w-[60px]";

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-surface-muted ${box}`}>
      {url && (
        <Image src={url} alt={product.title} fill sizes="130px" className="object-cover" />
      )}
    </div>
  );
}
