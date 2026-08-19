import { apiServer } from "@/lib/api/server";
import type { Product, Category } from "@/types/catalog";
import { Hero } from "@/components/site/Hero";
import { CategoryRail } from "@/components/site/CategoryRail";
import { EditorialGrid } from "@/components/site/EditorialGrid";
import { FeaturedRail } from "@/components/site/FeaturedRail";
import { TrustBar } from "@/components/site/TrustBar";
import { Newsletter } from "@/components/site/Newsletter";

export const revalidate = 120;

export default async function HomePage() {
  const [featuredRes, latestRes, categoriesRes] = await Promise.all([
    apiServer<Product[]>("product?featured=true&pageSize=10", { revalidate: 120 }),
    apiServer<Product[]>("product?pageSize=40", { revalidate: 120 }),
    apiServer<Category[]>("category", { revalidate: 300 }),
  ]);

  const featured = featuredRes.data ?? [];
  const latest = latestRes.data ?? [];
  const categories = categoriesRes.data ?? [];

  // One cover per category, taken from real stock so no tile is ever empty.
  const covers: Record<string, string | undefined> = {};
  for (const category of categories) {
    covers[category.id] = latest.find(
      (p) => p.category_id === category.id && p.product_images?.[0]?.url,
    )?.product_images?.[0]?.url;
  }

  const bySlug = (slug: string) => categories.find((c) => c.slug === slug);
  const firstIn = (slug: string) => {
    const category = bySlug(slug);
    return category ? latest.find((p) => p.category_id === category.id) : undefined;
  };

  const panels = [
    {
      eyebrow: "Fiction",
      title: "Stories worth the shelf space",
      copy: "Contemporary novels and modern classics, chosen one at a time.",
      href: "/shop/fiction",
      product: firstIn("fiction"),
    },
    {
      eyebrow: "Textbooks",
      title: "Everything the syllabus asks for",
      copy: "Secondary and university texts, in stock when term starts.",
      href: "/shop/textbooks",
      product: firstIn("textbooks"),
    },
    {
      eyebrow: "Stationery",
      title: "The things that go with them",
      copy: "Notebooks, pens and classroom supplies that earn their keep.",
      href: "/shop/notebooks-journals",
      product: firstIn("notebooks-journals"),
    },
  ].filter((panel) => panel.product);

  const showcase = [...featured, ...latest].filter((p) => p.product_images?.[0]?.url);

  return (
    <>
      <Hero showcase={showcase.slice(0, 2)} />
      <CategoryRail categories={categories} covers={covers} />
      <EditorialGrid panels={panels} />
      <FeaturedRail
        products={(featured.length > 0 ? featured : latest).slice(0, 10)}
        eyebrow="Handpicked"
        title="Favourites from our shelves"
      />
      <TrustBar />
      <Newsletter />
    </>
  );
}
