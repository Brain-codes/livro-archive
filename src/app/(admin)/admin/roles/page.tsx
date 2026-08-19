"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_super_admin: boolean;
  permissions: string[];
};

const AVAILABLE_PERMISSIONS = [
  "products.manage",
  "orders.manage",
  "stats.view",
  "settings.manage",
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await apiGet<Role[]>("roles");
    if (!res.success) return toast.error("Only a Super Admin can manage roles");
    setRoles(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function togglePermission(p: string) {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const res = await apiPost("roles", { name, slug, permissions });
    setSaving(false);
    if (!res.success) return toast.error(res.message ?? "Failed to create role");
    toast.success("Role created");
    setName("");
    setPermissions([]);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">Roles & permissions</h1>
      <p className="text-ink-muted mb-8 max-w-xl">
        Only a Super Admin can create roles. Every role uses the same console — screens
        just show or hide based on the permissions checked below.
      </p>

      <Card className="p-6 mb-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Role name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Permissions</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PERMISSIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePermission(p)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    permissions.includes(p)
                      ? "border-primary bg-primary/10 text-primary-ink"
                      : "border-border text-ink-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" loading={saving}>Create role</Button>
        </form>
      </Card>

      <Card className="divide-y divide-border">
        {roles.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-ink flex items-center gap-2">
                {r.name}
                {r.is_super_admin && <Badge tone="gold">Super Admin</Badge>}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                {r.is_super_admin ? "Full access" : r.permissions.join(", ") || "No permissions set"}
              </p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
