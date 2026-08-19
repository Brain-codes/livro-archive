"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { can } from "@/types/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  ShieldCheck,
  Tags,
  Loader2,
} from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "stats.view" },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products.manage" },
  { href: "/admin/categories", label: "Categories", icon: Tags, permission: "products.manage" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders.manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
  { href: "/admin/roles", label: "Roles", icon: ShieldCheck, permission: "__super_admin__" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <Loader2 className="size-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  const isStaff = user && (user.role === "staff" || user.role === "admin" || user.isSuperAdmin);

  if (!user || !isStaff) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-canvas text-center px-6">
        <ShieldCheck className="size-10 text-ink-muted" />
        <p className="font-display text-xl text-ink">Console access required</p>
        <p className="text-ink-muted max-w-sm">
          Sign in with a staff account to reach the Livro Archive console.
        </p>
        <Link href="/auth/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  const visibleNav = NAV.filter((item) =>
    item.permission === "__super_admin__" ? user.isSuperAdmin : can(user, item.permission),
  );

  return (
    <div className="flex min-h-screen bg-canvas text-sm">
      <aside className="hidden w-60 flex-none border-r border-border bg-surface lg:block">
        <div className="px-5 py-6">
          <p className="font-display text-lg text-ink">Livro Archive</p>
          <p className="text-xs text-ink-muted">Console</p>
        </div>
        <nav className="space-y-1 px-3">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  active
                    ? "bg-primary/10 text-primary-ink font-medium"
                    : "text-ink-muted hover:bg-surface-muted"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
