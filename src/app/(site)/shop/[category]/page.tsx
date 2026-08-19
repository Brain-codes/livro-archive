import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiServer } from "@/lib/api/server";
import type { Product, Category } from "@/types/catalog";
import { ShopGrid } from "@/components/site/ShopGrid";
import { CategoryStrip } from "@/components/site/CategoryStrip";
import { Newsletter } from "@/components/site/Newsletter";
import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const res = await apiServer<Category>(`category/${category}`, { revalidate: 300 });
  if (!res.data) return { title: "Category not found" };

  const description =
    res.data.description ??
    `Browse ${res.data.name.toLowerCase()} at Livro Archive — curated stock, guest checkout and order tracking without an account.`;

  return {
    title: res.data.name,
    description,
    alternates: { canonical: `${SITE}/shop/${res.data.slug}` },
    openGraph: {
      title: `${res.data.name} · Livro Archive`,
      description,
      url: `${SITE}/shop/${res.data.slug}`,
      siteName: "Livro Archive",
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { category } = await params;
  const { sort } = await searchParams;

  const categoryRes = await apiServer<Category>(`category/${category}`, { revalidate: 300 });
  if (!categoryRes.success || !categoryRes.data) notFound();
  const current = categoryRes.data;

  const query = new URLSearchParams({ category: current.id, pageSize: "60" });
  if (sort) query.set("sort", sort);

  const [productsRes, categoriesRes, allRes] = await Promise.all([
    apiServer<Product[]>(`product?${query}`, { revalidate: 60 }),
    apiServer<Category[]>("category", { revalidate: 300 }),
    apiServer<Product[]>("product?pageSize=60", { revalidate: 300 }),
  ]);

  const products = productsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const all = allRes.data ?? [];

  const covers: Record<string, string | undefined> = {};
  for (const c of categories) {
    covers[c.id] = all.find(
      (p) => p.category_id === c.id && p.product_images?.[0]?.url,
    )?.product_images?.[0]?.url;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop` },
      {
        "@type": "ListItem",
        position: 3,
        name: current.name,
        item: `${SITE}/shop/${current.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-ink-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
            <li aria-hidden>/</li>
            <li className="text-ink">{current.name}</li>
          </ol>
        </nav>

        <h1 className="mb-8 font-display text-[clamp(32px,4.4vw,52px)] font-semibold">
          {current.name}
        </h1>

        <CategoryStrip
          categories={categories.filter(
            (c) => c.id === current.id || all.some((p) => p.category_id === c.id),
          )}
          covers={covers}
          activeSlug={current.slug}
        />

        <Suspense fallback={<div className="py-24 text-center text-ink-muted">Loading…</div>}>
          <ShopGrid products={products} />
        </Suspense>
      </div>

      <Newsletter />
    </>
  );
}
