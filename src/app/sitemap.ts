import type { MetadataRoute } from "next";
import { apiServer } from "@/lib/api/server";
import type { Product, Category } from "@/types/catalog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    apiServer<Product[]>("product?pageSize=1000", { revalidate: 3600 }),
    apiServer<Category[]>("category", { revalidate: 3600 }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/track`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories.data ?? []).map((c) => ({
    url: `${SITE}/shop/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = (products.data ?? []).map((p) => ({
    url: `${SITE}/product/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
