import Link from "next/link";
import Image from "next/image";
import { PriceTag } from "@/components/ui/PriceTag";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/types/catalog";

export function ProductCard({ product }: { product: Product }) {
  const image = product.product_images?.[0]?.url;
  const outOfStock = product.stock_quantity <= 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-muted transition-transform duration-300 group-hover:-rotate-1 group-hover:scale-[1.02]">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted font-display text-sm">
            {product.title}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-x-3 top-3">
            <Badge tone="danger">Out of stock</Badge>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        {product.author && (
          <p className="text-xs text-ink-muted">{product.author}</p>
        )}
        <h3 className="font-display text-lg leading-snug text-ink line-clamp-2">
          {product.title}
        </h3>
        <PriceTag
          price={product.base_price}
          compareAt={product.compare_at_price}
          currency={product.currency}
          size="sm"
        />
      </div>
    </Link>
  );
}
