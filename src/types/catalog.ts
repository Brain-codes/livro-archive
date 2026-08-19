export type ProductImage = { url: string; alt?: string | null; sort_order: number };

export type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
  price_override: number | null;
  stock_quantity: number;
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
  category_id: string | null;
  base_price: number;
  compare_at_price: number | null;
  currency: string;
  stock_quantity: number;
  status: "draft" | "active" | "archived";
  is_featured: boolean;
  product_images: ProductImage[];
  product_variants?: ProductVariant[];
  bundles?: Bundle[];
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
