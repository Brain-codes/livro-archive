import type { ApiEnvelope } from "./client";

const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Server Component / route handler variant — public reads only (no user session). */
export async function apiServer<T = unknown>(
  path: string,
  init: RequestInit & { revalidate?: number } = {},
): Promise<ApiEnvelope<T>> {
  const { revalidate, ...rest } = init;
  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
      ...rest.headers,
    },
    next: revalidate !== undefined ? { revalidate } : undefined,
  });
  return (await res.json()) as ApiEnvelope<T>;
}
