"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/store/cart";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { apiPost } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

const checkoutSchema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  contact_email: z.string().email("Enter a valid email"),
  contact_phone: z.string().min(7, "Enter a valid phone number"),
  line1: z.string().min(3, "Enter your address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  postal_code: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCartStore();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema) });

  async function onSubmit(values: CheckoutForm) {
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      const orderRes = await apiPost<{ id: string; order_number: string; contact_email: string }>(
        "orders",
        {
          contact_email: values.contact_email,
          contact_phone: values.contact_phone,
          shipping_address: {
            full_name: values.full_name,
            phone: values.contact_phone,
            line1: values.line1,
            line2: values.line2,
            city: values.city,
            state: values.state,
            postal_code: values.postal_code,
            country: "Nigeria",
          },
          items: lines.map((l) => ({
            product_id: l.productId,
            variant_id: l.variantId ?? null,
            bundle_id: l.bundleId ?? null,
            quantity: l.quantity,
          })),
        },
      );

      if (!orderRes.success || !orderRes.data) {
        toast.error(orderRes.message ?? "Could not create your order");
        setSubmitting(false);
        return;
      }

      const order = orderRes.data;

      const payRes = await apiPost<{ authorization_url: string }>("payments/initialize", {
        orderId: order.id,
      });

      if (!payRes.success || !payRes.data) {
        // Paystack not configured yet — order exists as pending_payment; let the
        // shopper see the confirmation screen rather than a dead end.
        toast.message("Payment isn't set up yet — your order was saved.");
        clear();
        router.push(`/checkout/success?order=${order.order_number}`);
        return;
      }

      clear();
      window.location.href = payRes.data.authorization_url;
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center text-ink-muted">
        Your basket is empty.
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-14 lg:grid-cols-[1.2fr_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <h1 className="font-display text-3xl text-ink">Checkout</h1>
        <p className="text-sm text-ink-muted">
          No account needed — just where to send it and how to reach you.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.full_name?.message}>
            <Input {...register("full_name")} />
          </Field>
          <Field label="Phone number" error={errors.contact_phone?.message}>
            <Input {...register("contact_phone")} />
          </Field>
        </div>

        <Field label="Email" error={errors.contact_email?.message}>
          <Input type="email" {...register("contact_email")} />
        </Field>

        <Field label="Address" error={errors.line1?.message}>
          <Input placeholder="Street address" {...register("line1")} />
        </Field>
        <Field label="Apartment, suite, etc. (optional)">
          <Input {...register("line2")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" error={errors.city?.message}>
            <Input {...register("city")} />
          </Field>
          <Field label="State" error={errors.state?.message}>
            <Input {...register("state")} />
          </Field>
          <Field label="Postal code (optional)">
            <Input {...register("postal_code")} />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Pay {formatPrice(subtotal())}
        </Button>
      </form>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg text-ink mb-4">Order summary</h2>
        <div className="space-y-3">
          {lines.map((l) => (
            <div key={l.lineId} className="flex justify-between text-sm">
              <span className="text-ink-muted">
                {l.quantity} × {l.title}
              </span>
              <span className="tabular-nums">{formatPrice(l.unitPrice * l.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(subtotal())}</span>
        </div>
      </aside>
    </div>
  );
}
