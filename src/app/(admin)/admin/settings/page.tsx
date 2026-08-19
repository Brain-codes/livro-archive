"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api/client";
import { PageHeader, Panel, PanelHeader } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Setting = {
  key: string;
  value: unknown;
  category: string;
  label: string;
  description: string | null;
  is_public: boolean;
};

const CATEGORY_COPY: Record<string, string> = {
  general: "Names, contact details and the copy shown across the storefront.",
  commerce: "Pricing, delivery and the thresholds the shop runs on.",
  fulfilment: "How orders get to customers.",
  notifications: "How hard the system tries to reach a customer.",
  appearance: "Look and feel defaults.",
};

/**
 * Store configuration. Every value here is data, not code — the point is that nothing
 * store-wide ever needs a deploy or a SQL editor to change (flow.md §12.3).
 */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await apiGet<Setting[]>("settings/all");
    if (!res.success) toast.error(res.message ?? "Could not load settings");
    const data = res.data ?? [];
    setSettings(data);
    setDrafts(Object.fromEntries(data.map((s) => [s.key, toEditable(s.value)])));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(setting: Setting) {
    setSavingKey(setting.key);
    const parsed = fromEditable(drafts[setting.key], setting.value);
    if (parsed === undefined) {
      setSavingKey(null);
      return toast.error("That value isn't valid for this setting");
    }

    const res = await apiPatch(`settings/${setting.key}`, { value: parsed });
    setSavingKey(null);
    if (!res.success) return toast.error(res.message ?? "Could not save");

    setSavedKey(setting.key);
    setTimeout(() => setSavedKey(null), 1600);
    toast.success(`${setting.label} updated`);
  }

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, setting) => {
    (acc[setting.category] ??= []).push(setting);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store configuration. Change it here — never in the code or the database."
      />

      {loading ? (
        <Panel className="p-6 text-[13px] text-ink-faint">Loading settings…</Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {Object.entries(grouped).map(([category, items]) => (
            <Panel key={category} className="h-fit">
              <PanelHeader
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                description={CATEGORY_COPY[category]}
              />
              <div className="divide-y divide-border">
                {items.map((setting) => {
                  const dirty = drafts[setting.key] !== toEditable(setting.value);
                  return (
                    <div key={setting.key} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-ink">{setting.label}</p>
                          {setting.description && (
                            <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        {setting.is_public && (
                          <span className="shrink-0 rounded-full bg-sage-soft/40 px-2 py-0.5 text-[10px] font-medium text-forest">
                            Public
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <SettingInput
                          setting={setting}
                          value={drafts[setting.key] ?? ""}
                          onChange={(v) => setDrafts({ ...drafts, [setting.key]: v })}
                        />
                        <button
                          onClick={() => save(setting)}
                          disabled={!dirty || savingKey === setting.key}
                          className={cn(
                            "shrink-0 cursor-pointer rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors",
                            savedKey === setting.key
                              ? "bg-success/15 text-success"
                              : dirty
                                ? "bg-forest text-on-dark hover:bg-forest-deep dark:text-canvas"
                                : "cursor-default bg-surface-muted text-ink-faint",
                          )}
                        >
                          {savedKey === setting.key ? (
                            <Check className="size-3.5" />
                          ) : savingKey === setting.key ? (
                            "Saving…"
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Panel className="mt-4 p-5">
        <div className="flex items-start gap-3">
          <SettingsIcon className="mt-0.5 size-4 shrink-0 text-ink-muted" />
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            Public settings are readable by the storefront without authentication — never
            put a secret in one. API keys belong in Supabase secrets
            (<code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[11.5px]">supabase secrets set</code>),
            not here.
          </p>
        </div>
      </Panel>
    </>
  );
}

/** jsonb → something a human can type into a box. */
function toEditable(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 0);
}

/** …and back again, matching the shape the setting already had. */
function fromEditable(input: string, previous: unknown): unknown {
  if (typeof previous === "string") return input;
  if (typeof previous === "number") {
    const n = Number(input);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof previous === "boolean") return input === "true";
  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
}

function SettingInput({
  setting,
  value,
  onChange,
}: {
  setting: Setting;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "h-9 w-full rounded-lg border border-border bg-canvas px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35";

  if (typeof setting.value === "boolean") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${base} cursor-pointer`}>
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
    );
  }

  if (typeof setting.value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} tabular-nums`}
      />
    );
  }

  if (typeof setting.value === "object" && setting.value !== null) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} font-mono text-[12px]`}
      />
    );
  }

  return <input value={value} onChange={(e) => onChange(e.target.value)} className={base} />;
}
