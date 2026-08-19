"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Plus, Search, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import { formatPrice, cn } from "@/lib/utils";
import {
  PageHeader,
  Panel,
  TableWrap,
  Th,
  Td,
  EmptyState,
  TableSkeleton,
} from "@/components/admin/ui";
import type { Product, Category } from "@/types/catalog";

const BLANK = {
  title: "",
  slug: "",
  author: "",
  subtitle: "",
  description: "",
  isbn: "",
  sku: "",
  product_type: "book",
  category_id: "",
  base_price: "",
  compare_at_price: "",
  stock_quantity: "",
  status: "active",
  is_featured: false,
  image_url: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...BLANK });

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      apiGet<Product[]>("product?pageSize=200"),
      apiGet<Category[]>("category"),
    ]);
    setProducts(p.data ?? []);
    setCategories(c.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const slug =
      form.slug.trim() ||
      form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const res = await apiPost<{ id: string }>("product", {
      title: form.title.trim(),
      slug,
      author: form.author.trim() || null,
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      isbn: form.isbn.trim() || null,
      sku: form.sku.trim() || null,
      product_type: form.product_type,
      category_id: form.category_id || null,
      base_price: Number(form.base_price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock_quantity: Number(form.stock_quantity),
      status: form.status,
      is_featured: form.is_featured,
    });

    if (!res.success || !res.data) {
      setSaving(false);
      return toast.error(res.message ?? "Could not create the product");
    }

    // Images live in their own resource; attach one now if a URL was supplied.
    if (form.image_url.trim()) {
      await apiPost("product/images", {
        product_id: res.data.id,
        url: form.image_url.trim(),
        alt: form.title.trim(),
      });
    }

    setSaving(false);
    toast.success(`${form.title} added`);
    setForm({ ...BLANK });
    setShowForm(false);
    load();
  }

  async function toggleStatus(product: Product) {
    const next = product.status === "active" ? "draft" : "active";
    const res = await apiPatch(`product/${product.id}`, { status: next });
    if (!res.success) return toast.error("Could not update the product");
    load();
  }

  async function toggleFeatured(product: Product) {
    const res = await apiPatch(`product/${product.id}`, { is_featured: !product.is_featured });
    if (!res.success) return toast.error("Could not update the product");
    load();
  }

  const visible = products.filter((p) =>
    query.trim()
      ? `${p.title} ${p.author ?? ""} ${p.sku ?? ""}`.toLowerCase().includes(query.toLowerCase())
      : true,
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="The catalogue — books, stationery and everything else you sell."
        actions={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[13px] font-medium text-on-dark transition-colors hover:bg-forest-deep dark:text-canvas"
          >
            {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {showForm ? "Cancel" : "New product"}
          </button>
        }
      />

      {showForm && (
        <Panel className="mb-4">
          <form onSubmit={handleCreate} className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" required>
                <Input
                  value={form.title}
                  onChange={(v) => setForm({ ...form, title: v })}
                  required
                />
              </Field>
              <Field label="URL slug" hint="Leave blank to generate from the title">
                <Input value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
              </Field>
              <Field label="Author">
                <Input value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
              </Field>
              <Field label="Subtitle">
                <Input value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} />
              </Field>
              <Field label="Type">
                <Select
                  value={form.product_type}
                  onChange={(v) => setForm({ ...form, product_type: v })}
                  options={[
                    { value: "book", label: "Book" },
                    { value: "stationery", label: "Stationery" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </Field>
              <Field label="Category">
                <Select
                  value={form.category_id}
                  onChange={(v) => setForm({ ...form, category_id: v })}
                  options={[
                    { value: "", label: "Uncategorised" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </Field>
              <Field label="Price (₦)" required>
                <Input
                  type="number"
                  value={form.base_price}
                  onChange={(v) => setForm({ ...form, base_price: v })}
                  required
                />
              </Field>
              <Field label="Compare-at price (₦)" hint="Shown struck through">
                <Input
                  type="number"
                  value={form.compare_at_price}
                  onChange={(v) => setForm({ ...form, compare_at_price: v })}
                />
              </Field>
              <Field label="Stock on hand" required>
                <Input
                  type="number"
                  value={form.stock_quantity}
                  onChange={(v) => setForm({ ...form, stock_quantity: v })}
                  required
                />
              </Field>
              <Field label="ISBN">
                <Input value={form.isbn} onChange={(v) => setForm({ ...form, isbn: v })} />
              </Field>
              <Field label="SKU">
                <Input value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
              </Field>
              <Field label="Cover image URL" hint="Paste a hosted image URL">
                <Input
                  value={form.image_url}
                  onChange={(v) => setForm({ ...form, image_url: v })}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4">
              <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="size-4 accent-[var(--color-forest)]"
                />
                Feature on the homepage
              </label>
              <Select
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                options={[
                  { value: "active", label: "Active" },
                  { value: "draft", label: "Draft" },
                ]}
              />
              <button
                type="submit"
                disabled={saving}
                className="ml-auto cursor-pointer rounded-full bg-forest px-5 py-2.5 text-[13px] font-medium text-on-dark disabled:opacity-50 dark:text-canvas"
              >
                {saving ? "Saving…" : "Create product"}
              </button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <label className="relative w-full sm:max-w-xs">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, author or SKU"
              className="h-9 w-full rounded-lg border border-border bg-canvas pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
            />
          </label>
          <span className="ml-auto text-[12.5px] text-ink-muted tabular-nums">
            {visible.length} of {products.length}
          </span>
        </div>

        <TableWrap>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <Th>Product</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Available</Th>
                <Th>Featured</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : visible.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Package className="size-5" />}
                      title={query ? "No matching products" : "No products yet"}
                      description={
                        query
                          ? "Try a different search term."
                          : "Add your first product to open the shop."
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                          {product.product_images?.[0]?.url && (
                            <Image
                              src={product.product_images[0].url}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{product.title}</p>
                          <p className="truncate text-[11.5px] text-ink-faint">
                            {product.author ?? product.product_type}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {formatPrice(product.base_price, product.currency)}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {product.available_quantity ?? product.stock_quantity}
                    </Td>
                    <Td>
                      <button
                        onClick={() => toggleFeatured(product)}
                        className={cn(
                          "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                          product.is_featured
                            ? "bg-gold/15 text-gold"
                            : "bg-ink/[0.06] text-ink-faint hover:text-ink",
                        )}
                      >
                        {product.is_featured ? "Featured" : "Not featured"}
                      </button>
                    </Td>
                    <Td>
                      <button
                        onClick={() => toggleStatus(product)}
                        className={cn(
                          "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                          product.status === "active"
                            ? "bg-success/15 text-success"
                            : "bg-ink/[0.06] text-ink-muted",
                        )}
                      >
                        {product.status}
                      </button>
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/product/${product.slug}`}
                        target="_blank"
                        aria-label={`View ${product.title} on the storefront`}
                        className="inline-grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-surface-muted hover:text-ink"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </TableWrap>
      </Panel>
    </>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-ink-faint">{hint}</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full cursor-pointer rounded-lg border border-border bg-canvas px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
