import { createClient } from "@/lib/supabase/client";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  meta: Record<string, unknown>;
  errors: unknown;
};

const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Calls a Supabase Edge Function resource. Never queries tables directly — every
 * data operation in this app goes through this wrapper, per the Supabase architecture
 * rule (one Edge Function per resource, standard response envelope).
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token ?? ANON_KEY;

  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
      ...options.headers,
    },
  });

  const json = (await res.json()) as ApiEnvelope<T>;
  return json;
}

export function apiGet<T = unknown>(path: string) {
  return api<T>(path, { method: "GET" });
}

export function apiPost<T = unknown>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPatch<T = unknown>(path: string, body: unknown) {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete<T = unknown>(path: string) {
  return api<T>(path, { method: "DELETE" });
}
