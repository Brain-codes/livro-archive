"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Search, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import {
  PageHeader,
  Panel,
  TableWrap,
  Th,
  Td,
  EmptyState,
  TableSkeleton,
  StatCard,
} from "@/components/admin/ui";

type Customer = {
  email: string;
  name: string | null;
  phone: string | null;
  orders: number;
  spent: number;
  hasAccount: boolean;
  lastOrderAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    const res = await apiGet<Customer[]>(`customers${params}`);
    if (!res.success) toast.error(res.message ?? "Could not load customers");
    setCustomers(res.data ?? []);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const registered = customers.filter((c) => c.hasAccount).length;
  const revenue = customers.reduce((sum, c) => sum + c.spent, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has bought something — guests included."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          featured
          label="Customers"
          value={customers.length}
          sub="Unique email addresses"
          icon={<Users className="size-4" />}
          loading={loading}
        />
        <StatCard
          label="With an account"
          value={registered}
          sub={`${customers.length - registered} checked out as guests`}
          icon={<UserCheck className="size-4" />}
          loading={loading}
        />
        <StatCard
          label="Lifetime revenue"
          value={formatPrice(revenue)}
          sub="Paid orders only"
          icon={<UserPlus className="size-4" />}
          loading={loading}
        />
      </div>

      <Panel>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <label className="relative w-full sm:max-w-xs">
            <span className="sr-only">Search customers</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Email or phone"
              className="h-9 w-full rounded-lg border border-border bg-canvas pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-forest/35"
            />
          </label>
        </div>

        <TableWrap>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <Th>Customer</Th>
                <Th>Type</Th>
                <Th className="text-right">Orders</Th>
                <Th className="text-right">Spent</Th>
                <Th className="text-right">Last order</Th>
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : customers.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<Users className="size-5" />}
                      title={query ? "No matching customers" : "No customers yet"}
                      description={
                        query
                          ? "Try a different email or phone number."
                          : "Anyone who checks out will show up here, account or not."
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.email} className="border-b border-border last:border-0">
                    <Td>
                      <p className="font-medium text-ink">{customer.name ?? customer.email}</p>
                      <p className="text-[11.5px] text-ink-faint">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </p>
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          customer.hasAccount
                            ? "bg-forest/15 text-forest"
                            : "bg-ink/10 text-ink-muted"
                        }`}
                      >
                        {customer.hasAccount ? "Registered" : "Guest"}
                      </span>
                    </Td>
                    <Td className="text-right tabular-nums">{customer.orders}</Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatPrice(customer.spent)}
                    </Td>
                    <Td className="text-right text-ink-muted tabular-nums">
                      {new Date(customer.lastOrderAt).toLocaleDateString()}
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </TableWrap>
      </Panel>
    </>
  );
}
