import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { apiServer } from "@/lib/api/server";
import type { Product } from "@/types/catalog";
import { AddToCart } from "@/components/site/AddToCart";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductCard } from "@/components/site/ProductCard";
import { Newsletter } from "@/components/site/Newsletter";
import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await apiServer<Product>(`product/${slug}`, { revalidate: 60 });
  const product = res.data;
  if (!product) return { title: "Product not found" };

  const description =
    product.description?.slice(0, 155) ??
    product.subtitle ??
    `${product.title}${product.author ? ` by ${product.author}` : ""} — available now at Livro Archive.`;
  const image = product.product_images?.[0]?.url;

  return {
    title: product.title,
    description,
    alternates: { canonical: `${SITE}/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.title,
      description,
      url: `${SITE}/product/${product.slug}`,
      siteName: "Livro Archive",
      images: image ? [{ url: image, width: 640, height: 854, alt: product.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: image ? [image] : undefined,
    },
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
  const inStock = (product.available_quantity ?? 0) > 0;
  const related = product.related_products ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.title,
        description: product.description ?? product.subtitle ?? undefined,
        image: images.map((i) => i.url),
        sku: product.sku ?? product.id,
        ...(product.isbn ? { gtin13: product.isbn } : {}),
        brand: { "@type": "Brand", name: product.author ?? "Livro Archive" },
        offers: {
          "@type": "Offer",
          url: `${SITE}/product/${product.slug}`,
          priceCurrency: product.currency,
          price: product.base_price,
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: "Livro Archive" },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/shop` },
          {
            "@type": "ListItem",
            position: 3,
            name: product.title,
            item: `${SITE}/product/${product.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-8">
        <nav aria-label="Breadcrumb" className="mb-8 text-[13px] text-ink-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
            <li aria-hidden>/</li>
            <li className="text-ink">{product.title}</li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={images} title={product.title} />

          <div>
            {product.author && (
              <p className="text-sm text-ink-muted">{product.author}</p>
            )}
            <h1 className="mt-1.5 font-display text-[clamp(28px,3.6vw,44px)] font-semibold">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="mt-2 text-base text-ink-muted">{product.subtitle}</p>
            )}

            <div className="mt-8">
              <AddToCart product={product} />
            </div>

            <div className="mt-8 grid gap-4 border-y border-border py-6 sm:grid-cols-3">
              <InfoItem
                icon={<Truck className="size-4" />}
                title="Delivery"
                detail="2–5 working days"
              />
              <InfoItem
                icon={<RotateCcw className="size-4" />}
                title="Returns"
                detail="7 days, unopened"
              />
              <InfoItem
                icon={<ShieldCheck className="size-4" />}
                title="Secure payment"
                detail="Card, transfer or USSD"
              />
            </div>

            {product.description && (
              <details open className="group border-b border-border py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
                  About this item
                  <span className="text-lg text-ink-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                  {product.description}
                </p>
              </details>
            )}

            <details className="group border-b border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
                Product details
                <span className="text-lg text-ink-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
                {product.author && (
                  <>
                    <dt className="text-ink-muted">Author</dt>
                    <dd>{product.author}</dd>
                  </>
                )}
                {product.isbn && (
                  <>
                    <dt className="text-ink-muted">ISBN</dt>
                    <dd className="tabular-nums">{product.isbn}</dd>
                  </>
                )}
                {product.sku && (
                  <>
                    <dt className="text-ink-muted">SKU</dt>
                    <dd className="tabular-nums">{product.sku}</dd>
                  </>
                )}
                <dt className="text-ink-muted">Type</dt>
                <dd className="capitalize">{product.product_type}</dd>
              </dl>
            </details>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <p className="eyebrow">You may also like</p>
            <h2 className="mt-2 font-display text-[clamp(24px,3vw,34px)] font-semibold">
              Discover something else
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Newsletter />
    </>
  );
}

function InfoItem({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-ink-muted">{icon}</span>
      <div>
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="text-[13px] text-ink-muted">{detail}</p>
      </div>
    </div>
  );
}
