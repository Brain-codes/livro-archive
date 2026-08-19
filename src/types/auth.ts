export type AuthedUser = {
  id: string;
  email: string | null;
  role: "customer" | "staff" | "admin";
  permissions: string[];
  isSuperAdmin: boolean;
};

export function can(user: AuthedUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.permissions.includes("*") || user.permissions.includes(permission);
}
