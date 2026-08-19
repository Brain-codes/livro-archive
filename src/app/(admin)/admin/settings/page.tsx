"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

type Setting = {
  key: string;
  value: unknown;
  category: string;
  label: string;
  description: string | null;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    const res = await apiGet<Setting[]>("settings/all");
    const data = res.data ?? [];
    setSettings(data);
    setDrafts(Object.fromEntries(data.map((s) => [s.key, JSON.stringify(s.value)])));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(key: string) {
    setSavingKey(key);
    try {
      const value = JSON.parse(drafts[key]);
      const res = await apiPatch(`settings/${key}`, { value });
      if (!res.success) throw new Error(res.message);
      toast.success(`${key} updated`);
    } catch {
      toast.error("Invalid value — check the format (text needs quotes, e.g. \"NGN\")");
    } finally {
      setSavingKey(null);
    }
  }

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">Settings</h1>
      <p className="text-ink-muted mb-8 max-w-xl">
        Everything here is store configuration, not code — change it and the storefront
        picks it up on next load. No deploys needed.
      </p>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <Card key={category} className="p-6">
            <h2 className="font-display text-lg text-ink mb-4 capitalize">{category}</h2>
            <div className="space-y-5">
              {items.map((s) => (
                <div key={s.key} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.label}</p>
                    {s.description && <p className="text-xs text-ink-muted">{s.description}</p>}
                  </div>
                  <input
                    value={drafts[s.key] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                    className="h-10 rounded-lg border border-border bg-surface px-3 font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={savingKey === s.key}
                    onClick={() => save(s.key)}
                  >
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
