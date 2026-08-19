"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Tags,
  Sparkles,
  Users,
  Settings,
  ShieldCheck,
  Search,
  Bell,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";
import { createClient } from "@/lib/supabase/client";
import { apiGet } from "@/lib/api/client";
import { can, type AuthedUser } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/site/Wordmark";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: string;
  badge?: "orders";
};

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Operations",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "stats.view" },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders.manage", badge: "orders" },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory.manage" },
      { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.manage" },
    ],
  },
  {
    heading: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package, permission: "products.manage" },
      { href: "/admin/categories", label: "Categories", icon: Tags, permission: "products.manage" },
      { href: "/admin/promotions", label: "Promotions", icon: Sparkles, permission: "promotions.manage" },
    ],
  },
  {
    heading: "Configuration",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
      { href: "/admin/roles", label: "Roles & access", icon: ShieldCheck, permission: "__super_admin__" },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionCount, setActionCount] = useState<number | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    apiGet<{ awaitingAction: number }>("admin-stats").then((res) =>
      setActionCount(res.data?.awaitingAction ?? null),
    );
  }, [user]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <Loader2 className="size-5 animate-spin text-ink-muted" />
      </div>
    );
  }

  const isStaff = user && (user.role === "staff" || user.role === "admin" || user.isSuperAdmin);
  if (!user || !isStaff) return <AccessDenied signedIn={Boolean(user)} />;

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
  }

  const sidebar = (
    <Sidebar
      user={user}
      pathname={pathname}
      actionCount={actionCount}
      onSignOut={signOut}
      onClose={() => setMobileOpen(false)}
    />
  );

  return (
    <div className="min-h-screen bg-surface-sunken">
      {/* Mobile drawer */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-ink/45 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[264px] transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebar}
      </div>

      <div className="flex">
        <div className="sticky top-0 hidden h-screen w-[264px] shrink-0 lg:block">{sidebar}</div>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-canvas/95 px-5 backdrop-blur lg:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid size-9 cursor-pointer place-items-center rounded-lg border border-border text-ink lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            <label className="relative hidden min-w-0 flex-1 max-w-md md:block">
              <span className="sr-only">Search the console</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                placeholder="Search orders, products, customers…"
                className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-forest/35"
              />
            </label>

            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/"
                className="hidden text-[13px] text-ink-muted transition-colors hover:text-ink sm:block"
              >
                View storefront
              </Link>
              <span className="relative grid size-9 place-items-center rounded-lg border border-border text-ink-muted">
                <Bell className="size-4" />
                {actionCount ? (
                  <span className="absolute -right-1 -top-1 grid min-w-[16px] place-items-center rounded-full bg-clay px-1 text-[10px] font-semibold leading-4 text-white">
                    {actionCount}
                  </span>
                ) : null}
              </span>
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-forest text-[13px] font-semibold text-on-dark dark:text-canvas">
                  {(user.email ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="max-w-[160px] truncate text-[13px] font-medium text-ink">
                    {user.email}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {user.isSuperAdmin ? "Super Admin" : "Staff"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="px-5 py-7 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  user,
  pathname,
  actionCount,
  onSignOut,
  onClose,
}: {
  user: AuthedUser;
  pathname: string;
  actionCount: number | null;
  onSignOut: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="flex h-full flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin/dashboard" className="flex items-baseline gap-2">
          <Wordmark className="text-ink" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Console
          </span>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-muted lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) =>
            item.permission === "__super_admin__" ? user.isSuperAdmin : can(user, item.permission),
          );
          if (items.length === 0) return null;

          return (
            <div key={group.heading}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {group.heading}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors",
                          active
                            ? "bg-forest/10 font-medium text-forest"
                            : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-forest"
                          />
                        )}
                        <Icon className="size-[17px]" />
                        {item.label}
                        {item.badge === "orders" && actionCount ? (
                          <span className="ml-auto rounded-full bg-clay/15 px-2 py-0.5 text-[11px] font-semibold text-clay">
                            {actionCount}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-xl bg-forest p-4">
          <p className="text-[13px] font-medium text-on-dark dark:text-canvas">
            {user.isSuperAdmin ? "Full access" : "Limited access"}
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-on-dark/70 dark:text-canvas/70">
            {user.isSuperAdmin
              ? "You can manage roles and every part of the store."
              : "Ask a Super Admin if you need more permissions."}
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="mt-2 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <LogOut className="size-[17px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function AccessDenied({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-muted">
          <ShieldCheck className="size-6 text-ink-muted" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold">Console access required</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {signedIn
            ? "This account doesn't have permission to use the Livro Archive console."
            : "Sign in with a staff account to reach the Livro Archive console."}
        </p>
        <Link
          href={signedIn ? "/" : "/auth/sign-in"}
          className="mt-6 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-medium text-on-dark dark:text-canvas"
        >
          {signedIn ? "Back to the storefront" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}
