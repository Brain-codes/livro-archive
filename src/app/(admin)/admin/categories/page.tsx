"use client";

import { useCallback, useEffect, useState } from "react";
import { Tags, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import {
  PageHeader,
  Panel,
  PanelHeader,
  TableWrap,
  Th,
  Td,
  EmptyState,
  TableSkeleton,
} from "@/components/admin/ui";
import type { Category, Product } from "@/types/catalog";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, p] = await Promise.all([
      apiGet<Category[]>("category"),
      apiGet<Product[]>("product?pageSize=200"),
    ]);
    setCategories(c.data ?? []);

    const tally: Record<string, number> = {};
    for (const product of p.data ?? []) {
      if (product.category_id) tally[product.category_id] = (tally[product.category_id] ?? 0) + 1;
    }
    setCounts(tally);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const res = await apiPost("category", {
      name: name.trim(),
      slug,
      description: description.trim() || null,
      sort_order: categories.length + 1,
    });
    setSaving(false);
    if (!res.success) return toast.error(res.message ?? "Could not create the category");
    toast.success(`${name} added`);
    setName("");
    setDescription("");
    load();
  }

  async function remove(category: Category) {
    if (counts[category.id]) {
      return toast.error(
        `${category.name} still has ${counts[category.id]} product${counts[category.id] === 1 ? "" : "s"}. Move them first.`,
      );
    }
    const res = await apiDelete(`category/${category.id}`);
    if (!res.success) return toast.error(res.message ?? "Could not delete the category");
    toast.success(`${category.name} deleted`);
    load();
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="How the shop is organised for browsing and SEO."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
        <Panel className="h-fit">
          <PanelHeader title="Add a category" />
          <form onSubmit={handleCreate} className="space-y-3 p-5">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Shown on the category page and used as its meta description."
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px] placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-forest/35"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[13px] font-medium text-on-dark disabled:opacity-50 dark:text-canvas"
            >
              <Plus className="size-3.5" />
              {saving ? "Adding…" : "Add category"}
            </button>
          </form>
        </Panel>

        <Panel>
          <PanelHeader title="All categories" />
          <TableWrap>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <Th>Name</Th>
                  <Th>URL</Th>
                  <Th className="text-right">Products</Th>
                  <Th />
                </tr>
              </thead>

              {loading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : categories.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={<Tags className="size-5" />}
                        title="No categories yet"
                        description="Add one to start organising the shop."
                      />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-border last:border-0">
                      <Td>
                        <p className="font-medium text-ink">{category.name}</p>
                        {category.description && (
                          <p className="max-w-sm truncate text-[11.5px] text-ink-faint">
                            {category.description}
                          </p>
                        )}
                      </Td>
                      <Td className="font-mono text-[12px] text-ink-muted">
                        /shop/{category.slug}
                      </Td>
                      <Td className="text-right tabular-nums">{counts[category.id] ?? 0}</Td>
                      <Td className="text-right">
                        <button
                          onClick={() => remove(category)}
                          className="cursor-pointer text-[12.5px] text-ink-faint transition-colors hover:text-danger"
                        >
                          Delete
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </TableWrap>
        </Panel>
      </div>
    </>
  );
}
