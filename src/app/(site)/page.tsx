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

  // One cover per category, taken from real stock so no tile is ever empty — and
  // categories with nothing active in them aren't advertised at all.
  const covers: Record<string, string | undefined> = {};
  for (const category of categories) {
    covers[category.id] = latest.find(
      (p) => p.category_id === category.id && p.product_images?.[0]?.url,
    )?.product_images?.[0]?.url;
  }
  const stockedCategories = categories.filter((c) =>
    latest.some((p) => p.category_id === c.id),
  );

  // Editorial panels are built from categories that actually have stock, so the
  // block never collapses when something is drafted out of the shop.
  const PANEL_COPY: Record<string, { title: string; copy: string }> = {
    "non-fiction": {
      title: "Ideas worth the shelf space",
      copy: "Business, money and the habits behind them — chosen one at a time.",
    },
    fiction: {
      title: "Stories worth the shelf space",
      copy: "Contemporary novels and modern classics.",
    },
    textbooks: {
      title: "Everything the syllabus asks for",
      copy: "Secondary and university texts, in stock when term starts.",
    },
    "notebooks-journals": {
      title: "The things that go with them",
      copy: "Notebooks and journals that earn their keep.",
    },
    "writing-drawing": {
      title: "Made for putting ink on paper",
      copy: "Pens, fine liners and everything for drawing.",
    },
    "classroom-supplies": {
      title: "Kit for a working classroom",
      copy: "Markers, pads and the rest of the term's supplies.",
    },
    "childrens-books": {
      title: "For the youngest readers",
      copy: "Picture books and first chapter books.",
    },
  };

  const panels = stockedCategories
    .map((category) => {
      const product = latest.find(
        (p) => p.category_id === category.id && p.product_images?.[0]?.url,
      );
      const copy = PANEL_COPY[category.slug];
      return {
        eyebrow: category.name,
        title: copy?.title ?? category.name,
        copy: copy?.copy ?? `Browse everything in ${category.name.toLowerCase()}.`,
        href: `/shop/${category.slug}`,
        product,
      };
    })
    .filter((panel) => panel.product)
    .slice(0, 3);

  const showcase = [...featured, ...latest].filter((p) => p.product_images?.[0]?.url);

  return (
    <>
      <Hero showcase={showcase.slice(0, 2)} />
      <CategoryRail categories={stockedCategories} covers={covers} />
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
