export type ProductImage = { url: string; alt?: string | null; sort_order: number };

export type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  price_override: number | null;
  stock_quantity: number;
  available_quantity: number;
  sort_order: number;
};

export type BundleItem = {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price_override: number | null;
  products: {
    id: string;
    slug: string;
    title: string;
    base_price: number;
    available_quantity?: number;
    product_images: ProductImage[];
  };
};

export type Bundle = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  bundle_items: BundleItem[];
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string | null;
  isbn: string | null;
  product_type: "book" | "stationery" | "other";
  sku?: string | null;
  category_id: string | null;
  base_price: number;
  compare_at_price: number | null;
  currency: string;
  stock_quantity: number;
  reserved_quantity?: number;
  /** stock_on_hand − reserved. This is what a shopper can actually buy. */
  available_quantity: number;
  status: "draft" | "active" | "archived";
  is_featured: boolean;
  product_images: ProductImage[];
  product_variants?: ProductVariant[];
  bundles?: Bundle[];
  related_products?: Product[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
};
