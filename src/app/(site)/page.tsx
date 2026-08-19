import { apiServer } from "@/lib/api/server";
import type { Product, Category } from "@/types/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { Hero } from "@/components/site/Hero";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const revalidate = 120;

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    apiServer<Product[]>("product?featured=true&pageSize=8", { revalidate: 120 }),
    apiServer<Category[]>("category", { revalidate: 300 }),
  ]);

  const products = featured.data ?? [];
  const cats = (categories.data ?? []).slice(0, 6);

  return (
    <div>
      <Hero />

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Curated for you
            </p>
            <h2 className="font-display text-3xl text-ink mt-1">Featured picks</h2>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            Browse everything <ArrowRight className="size-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-ink-muted text-sm">
            No featured products yet — add some in the admin console.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="font-display text-3xl text-ink mb-8">Shop by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/shop/${c.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center transition-transform hover:-translate-y-1"
              >
                <span className="font-display text-sm text-ink">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="rounded-3xl bg-ink px-8 py-14 text-center text-canvas sm:px-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">
            Complete the set
          </p>
          <h2 className="font-display text-3xl sm:text-4xl mt-2 max-w-xl mx-auto">
            Every book pairs with something. We make it easy to add it.
          </h2>
          <p className="mt-4 text-canvas/70 max-w-lg mx-auto">
            Bundle a novel with a notebook, a textbook with the right pens — at a price
            that rewards buying the whole set.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary-ink"
          >
            Start shopping <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
