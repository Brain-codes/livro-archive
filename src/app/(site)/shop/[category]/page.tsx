import { apiServer } from "@/lib/api/server";
import type { Product, Category } from "@/types/catalog";
import { ShopGrid } from "@/components/site/ShopGrid";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return { title: category.replace(/-/g, " ") };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const catRes = await apiServer<Category>(`category/${category}`, { revalidate: 300 });
  if (!catRes.success || !catRes.data) notFound();

  const productsRes = await apiServer<Product[]>(
    `product?category=${catRes.data.id}&pageSize=48`,
    { revalidate: 60 },
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Shop</p>
        <h1 className="font-display text-4xl text-ink mt-1">{catRes.data.name}</h1>
        {catRes.data.description && (
          <p className="mt-2 max-w-xl text-ink-muted">{catRes.data.description}</p>
        )}
      </header>
      <ShopGrid products={productsRes.data ?? []} />
    </div>
  );
}
