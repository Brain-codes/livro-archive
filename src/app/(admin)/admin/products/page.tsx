"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Product, Category } from "@/types/catalog";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    author: "",
    base_price: "",
    stock_quantity: "",
    category_id: "",
    status: "active",
  });

  async function load() {
    const [p, c] = await Promise.all([
      apiGet<Product[]>("product?pageSize=100"),
      apiGet<Category[]>("category"),
    ]);
    setProducts(p.data ?? []);
    setCategories(c.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiPost("product", {
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      author: form.author || null,
      base_price: Number(form.base_price),
      stock_quantity: Number(form.stock_quantity),
      category_id: form.category_id || null,
      status: form.status,
    });
    setSaving(false);
    if (!res.success) return toast.error(res.message ?? "Failed to create product");
    toast.success("Product created");
    setShowForm(false);
    setForm({ title: "", slug: "", author: "", base_price: "", stock_quantity: "", category_id: "", status: "active" });
    load();
  }

  async function toggleStatus(p: Product) {
    const next = p.status === "active" ? "draft" : "active";
    const res = await apiPatch(`product/${p.id}`, { status: next });
    if (!res.success) return toast.error("Failed to update");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Products</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="size-4" /> New product
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="Slug (optional)">
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field label="Author (optional)">
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </Field>
            <Field label="Category">
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Price (NGN)">
              <Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} required />
            </Field>
            <Field label="Stock quantity">
              <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>Create product</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3 font-medium">{p.title}</td>
                <td className="px-5 py-3 tabular-nums">{formatPrice(p.base_price, p.currency)}</td>
                <td className="px-5 py-3 tabular-nums">{p.stock_quantity}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleStatus(p)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs capitalize hover:bg-surface-muted"
                  >
                    {p.status}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
