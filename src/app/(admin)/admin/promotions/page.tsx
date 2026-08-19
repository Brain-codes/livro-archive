"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, Percent, Link2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import {
  PageHeader,
  Panel,
  PanelHeader,
  EmptyState,
} from "@/components/admin/ui";
import type { Product, Bundle } from "@/types/catalog";

type Discount = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  is_active: boolean;
  used_count: number;
  max_uses: number | null;
};

type BundleRow = Bundle & { primary_product_id: string };

export default function AdminPromotionsPage() {
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [bundleForm, setBundleForm] = useState({
    primary: "",
    name: "",
    description: "",
    extra: "",
    extraPrice: "",
  });
  const [discountForm, setDiscountForm] = useState({ code: "", kind: "percent", value: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [b, d, p] = await Promise.all([
      apiGet<BundleRow[]>("promotions/bundles"),
      apiGet<Discount[]>("promotions/discounts"),
      apiGet<Product[]>("product?pageSize=200"),
    ]);
    setBundles(b.data ?? []);
    setDiscounts(d.data ?? []);
    setProducts(p.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byId = new Map(products.map((p) => [p.id, p]));

  async function createBundle(e: React.FormEvent) {
    e.preventDefault();
    if (!bundleForm.primary || !bundleForm.extra) {
      return toast.error("Pick the main product and at least one add-on");
    }

    const res = await apiPost("promotions/bundles", {
      primary_product_id: bundleForm.primary,
      name: bundleForm.name.trim(),
      description: bundleForm.description.trim() || null,
      is_active: true,
      items: [
        {
          product_id: bundleForm.extra,
          quantity: 1,
          // Blank means full price; 0 means the add-on is free.
          price_override:
            bundleForm.extraPrice === "" ? null : Number(bundleForm.extraPrice),
          sort_order: 1,
        },
      ],
    });

    if (!res.success) return toast.error(res.message ?? "Could not create the bundle");
    toast.success(`${bundleForm.name} created`);
    setBundleForm({ primary: "", name: "", description: "", extra: "", extraPrice: "" });
    load();
  }

  async function createDiscount(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiPost("promotions/discounts", {
      code: discountForm.code.trim(),
      kind: discountForm.kind,
      value: Number(discountForm.value),
      is_active: true,
    });
    if (!res.success) return toast.error(res.message ?? "Could not create the code");
    toast.success(`${discountForm.code.toUpperCase()} created`);
    setDiscountForm({ code: "", kind: "percent", value: "" });
    load();
  }

  return (
    <>
      <PageHeader
        title="Promotions"
        description="Bundles, free add-ons and discount codes — the reasons a basket grows."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Panel>
            <PanelHeader
              title="New bundle"
              description="Attach an add-on to a product at a better price — or free."
            />
            <form onSubmit={createBundle} className="space-y-3 p-5">
              <Labeled label="Main product">
                <select
                  value={bundleForm.primary}
                  onChange={(e) => setBundleForm({ ...bundleForm, primary: e.target.value })}
                  className="h-9 w-full cursor-pointer rounded-lg border border-border bg-canvas px-3 text-[13px]"
                  required
                >
                  <option value="">Choose a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="Bundle name">
                <input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  placeholder="Reader's Companion Set"
                  required
                  className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px]"
                />
              </Labeled>

              <Labeled label="Description">
                <input
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  placeholder="A notebook and marker to go with your read."
                  className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px]"
                />
              </Labeled>

              <Labeled label="Add-on product">
                <select
                  value={bundleForm.extra}
                  onChange={(e) => setBundleForm({ ...bundleForm, extra: e.target.value })}
                  className="h-9 w-full cursor-pointer rounded-lg border border-border bg-canvas px-3 text-[13px]"
                  required
                >
                  <option value="">Choose an add-on…</option>
                  {products
                    .filter((p) => p.id !== bundleForm.primary)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {formatPrice(p.base_price)}
                      </option>
                    ))}
                </select>
              </Labeled>

              <Labeled
                label="Bundle price for the add-on (₦)"
                hint="Leave blank for full price. Enter 0 to give it away free."
              >
                <input
                  type="number"
                  value={bundleForm.extraPrice}
                  onChange={(e) => setBundleForm({ ...bundleForm, extraPrice: e.target.value })}
                  placeholder="Full price"
                  className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px]"
                />
              </Labeled>

              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[13px] font-medium text-on-dark dark:text-canvas"
              >
                <Plus className="size-3.5" /> Create bundle
              </button>
            </form>
          </Panel>

          <Panel>
            <PanelHeader title="New discount code" />
            <form onSubmit={createDiscount} className="space-y-3 p-5">
              <Labeled label="Code">
                <input
                  value={discountForm.code}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="WELCOME10"
                  required
                  className="h-9 w-full rounded-lg border border-border bg-canvas px-3 font-mono text-[13px]"
                />
              </Labeled>
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Type">
                  <select
                    value={discountForm.kind}
                    onChange={(e) => setDiscountForm({ ...discountForm, kind: e.target.value })}
                    className="h-9 w-full cursor-pointer rounded-lg border border-border bg-canvas px-3 text-[13px]"
                  >
                    <option value="percent">Percent off</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </Labeled>
                <Labeled label={discountForm.kind === "percent" ? "Percent" : "Amount (₦)"}>
                  <input
                    type="number"
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                    required
                    className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px]"
                  />
                </Labeled>
              </div>
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[13px] font-medium text-on-dark dark:text-canvas"
              >
                <Percent className="size-3.5" /> Create code
              </button>
            </form>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Active bundles" />
            {loading ? (
              <div className="p-5 text-[13px] text-ink-faint">Loading…</div>
            ) : bundles.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="size-5" />}
                title="No bundles yet"
                description="Bundles are how a single book turns into a basket."
              />
            ) : (
              <div className="divide-y divide-border">
                {bundles.map((bundle) => {
                  const primary = byId.get(bundle.primary_product_id);
                  return (
                    <div key={bundle.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{bundle.name}</p>
                          <p className="text-[12px] text-ink-muted">
                            with {primary?.title ?? "a product"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold">
                          Bundle
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1 text-[12.5px]">
                        {bundle.bundle_items?.map((item) => {
                          const price = item.price_override ?? item.products.base_price;
                          return (
                            <li key={item.id} className="flex justify-between gap-3">
                              <span className="truncate text-ink-muted">
                                + {item.quantity} × {item.products.title}
                              </span>
                              <span className="shrink-0 tabular-nums">
                                {price === 0 ? (
                                  <span className="font-medium text-forest">Free</span>
                                ) : (
                                  formatPrice(price)
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Discount codes" />
            {discounts.length === 0 ? (
              <EmptyState
                icon={<Percent className="size-5" />}
                title="No codes yet"
                description="Codes are validated server-side at checkout."
              />
            ) : (
              <div className="divide-y divide-border">
                {discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div>
                      <p className="font-mono text-[13px] font-medium text-ink">
                        {discount.code}
                      </p>
                      <p className="text-[11.5px] text-ink-muted">
                        {discount.kind === "percent"
                          ? `${discount.value}% off`
                          : `${formatPrice(discount.value)} off`}
                        {" · "}
                        used {discount.used_count}
                        {discount.max_uses ? ` of ${discount.max_uses}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const res = await apiDelete(`promotions/discounts/${discount.id}`);
                        if (!res.success) return toast.error("Could not delete the code");
                        toast.success(`${discount.code} deleted`);
                        load();
                      }}
                      aria-label={`Delete ${discount.code}`}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-faint hover:bg-surface-muted hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-start gap-3">
              <Link2 className="mt-0.5 size-4 shrink-0 text-ink-muted" />
              <div>
                <p className="text-[13px] font-medium text-ink">Related products</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                  Product pages already show "you may also like" suggestions, filled from
                  curated links first and the same category as a fallback. Curated linking
                  UI is not built yet — the fallback runs automatically.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Labeled({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-ink-faint">{hint}</span>}
    </label>
  );
}
