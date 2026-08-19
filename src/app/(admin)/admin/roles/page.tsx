"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import { PageHeader, Panel, PanelHeader, EmptyState } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_super_admin: boolean;
  permissions: string[];
};

type Permission = { key: string; label: string; description: string };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([
      apiGet<Role[]>("roles"),
      apiGet<Permission[]>("roles/permissions"),
    ]);
    if (!r.success) {
      setDenied(true);
      return;
    }
    setRoles(r.data ?? []);
    setPermissions(p.data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (denied) {
    return (
      <>
        <PageHeader title="Roles & access" />
        <Panel>
          <EmptyState
            icon={<ShieldCheck className="size-5" />}
            title="Super Admin only"
            description="Only a Super Admin can create roles or change who has access."
          />
        </Panel>
      </>
    );
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const res = await apiPost("roles", {
      name: name.trim(),
      slug,
      description: description.trim() || null,
      permissions: selected,
    });
    setSaving(false);
    if (!res.success) return toast.error(res.message ?? "Could not create the role");
    toast.success(`${name} created`);
    setName("");
    setDescription("");
    setSelected([]);
    load();
  }

  return (
    <>
      <PageHeader
        title="Roles & access"
        description="One console for everyone — a role just decides which parts of it appear."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Panel className="h-fit">
          <PanelHeader title="Create a role" />
          <form onSubmit={createRole} className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink">Role name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fulfilment staff"
                required
                className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-medium text-ink">
                What is this role for?
              </span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Packs and dispatches orders, no access to pricing."
                className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
              />
            </label>

            <div>
              <p className="mb-2 text-[12.5px] font-medium text-ink">Permissions</p>
              <div className="space-y-1.5">
                {permissions.map((permission) => {
                  const active = selected.includes(permission.key);
                  return (
                    <button
                      key={permission.key}
                      type="button"
                      onClick={() =>
                        setSelected((prev) =>
                          prev.includes(permission.key)
                            ? prev.filter((k) => k !== permission.key)
                            : [...prev, permission.key],
                        )
                      }
                      aria-pressed={active}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-forest bg-forest/[0.07]"
                          : "border-border hover:bg-surface-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors",
                          active ? "border-forest bg-forest" : "border-border-strong",
                        )}
                      >
                        {active && (
                          <svg viewBox="0 0 10 8" className="size-2.5 fill-none stroke-white stroke-2">
                            <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-ink">
                          {permission.label}
                        </span>
                        <span className="block text-[11.5px] leading-snug text-ink-muted">
                          {permission.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || selected.length === 0}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[13px] font-medium text-on-dark disabled:opacity-50 dark:text-canvas"
            >
              <Plus className="size-3.5" />
              {saving ? "Creating…" : "Create role"}
            </button>
            {selected.length === 0 && (
              <p className="text-[11.5px] text-ink-faint">Pick at least one permission.</p>
            )}
          </form>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Existing roles" />
            <div className="divide-y divide-border">
              {roles.map((role) => (
                <div key={role.id} className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{role.name}</p>
                      {role.is_super_admin && (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                          Super Admin
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="mt-1 text-[12.5px] text-ink-muted">{role.description}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {role.is_super_admin ? (
                        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[11px] text-forest">
                          Everything
                        </span>
                      ) : role.permissions.length > 0 ? (
                        role.permissions.map((key) => (
                          <span
                            key={key}
                            className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[11px] text-ink-muted"
                          >
                            {key}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11.5px] text-ink-faint">No permissions set</span>
                      )}
                    </div>
                  </div>

                  {!role.is_super_admin && (
                    <button
                      onClick={async () => {
                        const res = await apiDelete(`roles/${role.id}`);
                        if (!res.success) {
                          return toast.error(
                            res.message ?? "Could not delete — someone may still hold this role",
                          );
                        }
                        toast.success(`${role.name} deleted`);
                        load();
                      }}
                      aria-label={`Delete ${role.name}`}
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-faint hover:bg-surface-muted hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" />
              <p className="text-[12.5px] leading-relaxed text-ink-muted">
                Roles are data, not code — adding one never needs a deploy. Every screen in
                this console is the same for every role; permissions only decide what is
                shown and what the backend will accept. Assigning a role to a teammate is
                done from their customer record once they have an account.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
