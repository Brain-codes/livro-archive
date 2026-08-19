"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PackageSearch } from "lucide-react";

export default function TrackLandingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber || !contact) return;
    router.push(`/track/${encodeURIComponent(orderNumber)}?contact=${encodeURIComponent(contact)}`);
  }

  return (
    <div className="mx-auto max-w-md px-5 py-24">
      <div className="text-center mb-8">
        <PackageSearch className="mx-auto size-10 text-primary" />
        <h1 className="font-display text-3xl text-ink mt-4">Track your order</h1>
        <p className="mt-2 text-ink-muted">
          No account needed — just your order number and the email or phone you checked out with.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Order number">
          <Input
            placeholder="LA-20260819-1234"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </Field>
        <Field label="Email or phone used at checkout">
          <Input value={contact} onChange={(e) => setContact(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Track order
        </Button>
      </form>
    </div>
  );
}
