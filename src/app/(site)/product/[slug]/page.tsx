import { apiServer } from "@/lib/api/server";
import type { Product } from "@/types/catalog";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { AddToCart } from "@/components/site/AddToCart";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await apiServer<Product>(`product/${slug}`, { revalidate: 60 });
  if (!res.data) return { title: "Product not found" };
  return {
    title: res.data.title,
    description: res.data.description ?? res.data.subtitle ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await apiServer<Product>(`product/${slug}`, { revalidate: 60 });
  if (!res.success || !res.data) notFound();
  const product = res.data;
  const images = product.product_images ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-surface-muted">
            {images[0] ? (
              <Image
                src={images[0].url}
                alt={product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-2xl text-ink-muted">
                {product.title}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className="relative h-20 w-16 flex-none overflow-hidden rounded-lg bg-surface-muted"
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.author && (
            <p className="text-sm text-ink-muted">{product.author}</p>
          )}
          <h1 className="font-display text-4xl text-ink mt-1">{product.title}</h1>
          {product.subtitle && (
            <p className="mt-2 text-lg text-ink-muted">{product.subtitle}</p>
          )}

          <div className="mt-4">
            {product.stock_quantity > 0 ? (
              <Badge tone="success">In stock</Badge>
            ) : (
              <Badge tone="danger">Out of stock</Badge>
            )}
          </div>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          {product.description && (
            <div className="mt-10 border-t border-border pt-8">
              <h2 className="font-display text-lg text-ink mb-2">About this item</h2>
              <p className="whitespace-pre-line text-ink-muted leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
