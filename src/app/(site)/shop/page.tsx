import { Suspense } from "react";
import Link from "next/link";
import { apiServer } from "@/lib/api/server";
import type { Product, Category } from "@/types/catalog";
import { ShopGrid } from "@/components/site/ShopGrid";
import { CategoryStrip } from "@/components/site/CategoryStrip";
import { Newsletter } from "@/components/site/Newsletter";
import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Shop all books & stationery",
  description:
    "Browse every title and every notebook in the Livro Archive catalogue — fiction, non-fiction, textbooks, children's books and classroom supplies.",
  alternates: { canonical: `${SITE}/shop` },
};

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;

  const params = new URLSearchParams({ pageSize: "60" });
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);

  const [productsRes, categoriesRes] = await Promise.all([
    apiServer<Product[]>(`product?${params}`, { revalidate: 60 }),
    apiServer<Category[]>("category", { revalidate: 300 }),
  ]);

  const products = productsRes.data ?? [];
  const categories = categoriesRes.data ?? [];

  const covers: Record<string, string | undefined> = {};
  for (const category of categories) {
    covers[category.id] = products.find(
      (p) => p.category_id === category.id && p.product_images?.[0]?.url,
    )?.product_images?.[0]?.url;
  }

  return (
    <>
      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-ink-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="text-ink">{q ? `Search: ${q}` : "Shop"}</li>
          </ol>
        </nav>

        <h1 className="mb-8 font-display text-[clamp(32px,4.4vw,52px)] font-semibold">
          {q ? `Results for "${q}"` : "Everything on the shelf"}
        </h1>

        {!q && (
          <CategoryStrip categories={categories} covers={covers} />
        )}

        <Suspense fallback={<div className="py-24 text-center text-ink-muted">Loading…</div>}>
          <ShopGrid products={products} />
        </Suspense>

        {!q && (
          <section className="mx-auto mt-24 max-w-2xl border-t border-border pt-14">
            <h2 className="font-display text-2xl font-semibold">
              A shelf, not a warehouse
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-muted">
              <p>
                Livro Archive stocks books and the things you use alongside them —
                notebooks, pens, markers, classroom supplies. Everything here is chosen
                deliberately rather than listed automatically, which is why the
                catalogue is smaller than a marketplace and easier to trust.
              </p>
              <p>
                Buying takes no account. Add what you want, check out as a guest, and
                track the order the whole way with your order number and the email or
                phone you used. If you'd rather keep your history in one place, an
                account will pick up every order you've already placed with that email.
              </p>
            </div>
          </section>
        )}
      </div>

      <Newsletter />
    </>
  );
}
