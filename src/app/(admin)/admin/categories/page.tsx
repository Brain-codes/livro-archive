"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { toast } from "sonner";
import type { Category } from "@/types/catalog";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await apiGet<Category[]>("category");
    setCategories(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const res = await apiPost("category", { name, slug, sort_order: categories.length + 1 });
    setSaving(false);
    if (!res.success) return toast.error(res.message ?? "Failed to create category");
    toast.success("Category created");
    setName("");
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">Categories</h1>

      <Card className="p-6 mb-6">
        <form onSubmit={handleCreate} className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="New category name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
          </div>
          <Button type="submit" loading={saving}>Add</Button>
        </form>
      </Card>

      <Card className="divide-y divide-border">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="font-medium">{c.name}</span>
            <span className="text-ink-muted">{c.slug}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
