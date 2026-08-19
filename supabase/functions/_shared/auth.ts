import { createClient } from "jsr:@supabase/supabase-js@2";

export type AuthedUser = {
  id: string;
  email: string | null;
  role: "customer" | "staff" | "admin";
  permissions: string[];
  isSuperAdmin: boolean;
};

/** Resolves the caller from the Authorization bearer token, or null for guests. */
export async function getCallerFromRequest(
  req: Request,
): Promise<AuthedUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  const svc = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await svc
    .from("profiles")
    .select("role, email, admin_role_id, admin_roles(permissions, is_super_admin)")
    .eq("id", data.user.id)
    .single();

  const adminRole = profile?.admin_roles as
    | { permissions: string[]; is_super_admin: boolean }
    | { permissions: string[]; is_super_admin: boolean }[]
    | null
    | undefined;
  const resolvedRole = Array.isArray(adminRole) ? adminRole[0] : adminRole;

  return {
    id: data.user.id,
    email: profile?.email ?? data.user.email ?? null,
    role: (profile?.role as AuthedUser["role"]) ?? "customer",
    permissions: resolvedRole?.permissions ?? [],
    isSuperAdmin: resolvedRole?.is_super_admin ?? false,
  };
}

/** Coarse role check — kept for endpoints that only care about customer vs staff/admin. */
export function requireRole(
  user: AuthedUser | null,
  roles: Array<AuthedUser["role"]>,
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/** Fine-grained permission check. Super admin and the wildcard '*' always pass. */
export function can(user: AuthedUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.permissions.includes("*") || user.permissions.includes(permission);
}
