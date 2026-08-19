import { apiServer } from "@/lib/api/server";
import type { Product } from "@/types/catalog";
import { ShopGrid } from "@/components/site/ShopGrid";

export const metadata = { title: "Shop" };
export const revalidate = 60;

export default async function ShopPage() {
  const res = await apiServer<Product[]>("product?pageSize=48", { revalidate: 60 });
  const products = res.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Shop</p>
        <h1 className="font-display text-4xl text-ink mt-1">Everything on the shelf</h1>
      </header>
      <ShopGrid products={products} />
    </div>
  );
}
