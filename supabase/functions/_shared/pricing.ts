import { serviceClient } from "./db.ts";
import { getSettings, num } from "./settings.ts";

type Db = ReturnType<typeof serviceClient>;

export type RequestedItem = {
  product_id: string;
  variant_id?: string | null;
  bundle_id?: string | null;
  quantity: number;
};

export type PricedLine = {
  product_id: string;
  variant_id: string | null;
  bundle_id: string | null;
  title_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type PricedOrder = {
  lines: PricedLine[];
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  total: number;
  discount_code: string | null;
};

export type PricingError = { error: string; status: number };

/**
 * Recomputes an entire order's pricing from the database. The client's idea of a price
 * is never trusted — see flow.md §4. Also verifies availability
 * (stock_on_hand − reserved) without holding any stock; the hold happens later at
 * payment initialization.
 */
export async function priceOrder(
  db: Db,
  items: RequestedItem[],
  discountCode?: string | null,
): Promise<PricedOrder | PricingError> {
  if (!items?.length) return { error: "Your basket is empty", status: 400 };

  const lines: PricedLine[] = [];
  let subtotal = 0;

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { error: "Invalid quantity", status: 400 };
    }

    const { data: product } = await db
      .from("products")
      .select("id, title, base_price, available_quantity, status")
      .eq("id", item.product_id)
      .maybeSingle();

    if (!product || product.status !== "active") {
      return { error: "One of the products is no longer available", status: 409 };
    }

    let unitPrice = Number(product.base_price);
    let available = product.available_quantity ?? 0;
    let title = product.title;

    if (item.variant_id) {
      const { data: variant } = await db
        .from("product_variants")
        .select("name, price_override, available_quantity")
        .eq("id", item.variant_id)
        .eq("product_id", item.product_id)
        .maybeSingle();
      if (!variant) return { error: "Selected option is unavailable", status: 409 };

      if (variant.price_override != null) unitPrice = Number(variant.price_override);
      available = variant.available_quantity ?? 0;
      title = `${product.title} — ${variant.name}`;
    }

    // Bundle pricing: an item bought as part of a bundle may be discounted or free.
    if (item.bundle_id) {
      const { data: bundle } = await db
        .from("bundles")
        .select("id, is_active")
        .eq("id", item.bundle_id)
        .maybeSingle();
      if (!bundle?.is_active) {
        return { error: "That bundle is no longer available", status: 409 };
      }

      const { data: bundleItem } = await db
        .from("bundle_items")
        .select("price_override")
        .eq("bundle_id", item.bundle_id)
        .eq("product_id", item.product_id)
        .maybeSingle();

      if (bundleItem?.price_override != null) {
        unitPrice = Number(bundleItem.price_override);
      }
    }

    if (available < item.quantity) {
      return {
        error: `${product.title} — only ${available} left in stock`,
        status: 409,
      };
    }

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    lines.push({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      bundle_id: item.bundle_id ?? null,
      title_snapshot: title,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    });
  }

  // ── Discount code (optional) ───────────────────────────────────────────
  let discountTotal = 0;
  let appliedCode: string | null = null;

  if (discountCode) {
    const { data: discount } = await db
      .from("discounts")
      .select("*")
      .eq("code", discountCode.trim().toUpperCase())
      .maybeSingle();

    const now = new Date();
    const valid =
      discount &&
      discount.is_active &&
      (!discount.starts_at || new Date(discount.starts_at) <= now) &&
      (!discount.ends_at || new Date(discount.ends_at) >= now) &&
      (discount.max_uses == null || discount.used_count < discount.max_uses);

    if (valid) {
      discountTotal =
        discount.kind === "percent"
          ? Math.round((subtotal * Number(discount.value)) / 100)
          : Math.min(Number(discount.value), subtotal);
      appliedCode = discount.code;
    }
  }

  // ── Shipping (settings-driven, never hardcoded) ────────────────────────
  const settings = await getSettings(db, ["flat_shipping_fee", "free_shipping_threshold"]);
  const flatFee = num(settings.flat_shipping_fee, 0);
  const freeThreshold = num(settings.free_shipping_threshold, 0);

  const discountedSubtotal = subtotal - discountTotal;
  const shippingFee =
    freeThreshold > 0 && discountedSubtotal >= freeThreshold ? 0 : flatFee;

  return {
    lines,
    subtotal,
    discount_total: discountTotal,
    shipping_fee: shippingFee,
    total: discountedSubtotal + shippingFee,
    discount_code: appliedCode,
  };
}

export function isPricingError(v: PricedOrder | PricingError): v is PricingError {
  return (v as PricingError).error !== undefined;
}
