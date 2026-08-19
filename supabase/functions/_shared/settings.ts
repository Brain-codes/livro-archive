import { serviceClient } from "./db.ts";

type Db = ReturnType<typeof serviceClient>;

/**
 * Reads store configuration from the settings table. Nothing store-wide is ever
 * hardcoded — see flow.md §12.3. Values are jsonb, so they come back already typed.
 */
export async function getSettings(
  db: Db,
  keys: string[],
): Promise<Record<string, unknown>> {
  const { data } = await db.from("settings").select("key, value").in("key", keys);
  return Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
}

export function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
