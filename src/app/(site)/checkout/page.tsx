"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import { useSession } from "@/lib/hooks/useSession";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { apiPost, apiGet } from "@/lib/api/client";
import { Lock } from "lucide-react";

const checkoutSchema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  contact_email: z.string().email("Enter a valid email address"),
  contact_phone: z.string().min(7, "Enter a valid phone number"),
  line1: z.string().min(3, "Enter your street address"),
  line2: z.string().optional(),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  postal_code: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

type PublicSettings = {
  flat_shipping_fee?: number;
  free_shipping_threshold?: number;
};

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCartStore();
  const { user } = useSession();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [settings, setSettings] = useState<PublicSettings>({});

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema) });

  useEffect(() => {
    apiGet<PublicSettings>("settings").then((res) => setSettings(res.data ?? {}));
  }, []);

  // Prefill the email for signed-in shoppers — an account should smooth checkout,
  // never gate it (flow.md §5).
  useEffect(() => {
    if (user?.email) setValue("contact_email", user.email);
  }, [user, setValue]);

  const goods = subtotal();
  const flatFee = Number(settings.flat_shipping_fee ?? 0);
  const freeThreshold = Number(settings.free_shipping_threshold ?? 0);
  const shipping = freeThreshold > 0 && goods >= freeThreshold ? 0 : flatFee;
  const estimatedTotal = goods + shipping;

  async function onSubmit(values: CheckoutForm) {
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      // Stable across retries of THIS basket, so a double-click or a flaky connection
      // can never produce two orders (flow.md §12.4).
      const key = idempotencyKey ?? nanoid(24);
      setIdempotencyKey(key);

      const orderRes = await apiPost<{ id: string; order_number: string }>("orders", {
        contact_email: values.contact_email,
        contact_phone: values.contact_phone,
        idempotency_key: key,
        discount_code: appliedCode || null,
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
      });

      if (!orderRes.success || !orderRes.data) {
        toast.error(orderRes.message ?? "We couldn't create your order");
        setSubmitting(false);
        return;
      }

      const order = orderRes.data;

      const payRes = await apiPost<{ authorization_url: string }>("payments/initialize", {
        orderId: order.id,
      });

      if (payRes.success && payRes.data?.authorization_url) {
        clear();
        window.location.href = payRes.data.authorization_url;
        return;
      }

      // Something sold out during checkout — a real failure the shopper must see.
      if (payRes.message?.toLowerCase().includes("sold out")) {
        toast.error(payRes.message);
        setSubmitting(false);
        return;
      }

      // Payments not switched on yet: the order exists, so show the confirmation
      // rather than a dead end.
      toast.message("Payment isn't switched on yet — your order has been saved.");
      clear();
      router.push(`/checkout/success?order=${order.order_number}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">Your basket is empty</h1>
        <p className="mt-2 text-ink-muted">Add something before checking out.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-14 lg:grid-cols-[1.2fr_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div>
          <h1 className="font-display text-3xl text-ink">Checkout</h1>
          <p className="mt-2 text-sm text-ink-muted">
            No account needed — just where to send it and how to reach you.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.full_name?.message}>
            <Input {...register("full_name")} autoComplete="name" />
          </Field>
          <Field label="Phone number" error={errors.contact_phone?.message}>
            <Input {...register("contact_phone")} type="tel" autoComplete="tel" />
          </Field>
        </div>

        <Field label="Email" error={errors.contact_email?.message}>
          <Input {...register("contact_email")} type="email" autoComplete="email" />
        </Field>
        <p className="-mt-3 text-xs text-ink-muted">
          Your order confirmation and tracking link go here.
        </p>

        <Field label="Street address" error={errors.line1?.message}>
          <Input {...register("line1")} autoComplete="address-line1" />
        </Field>
        <Field label="Apartment, suite, etc. (optional)">
          <Input {...register("line2")} autoComplete="address-line2" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" error={errors.city?.message}>
            <Input {...register("city")} autoComplete="address-level2" />
          </Field>
          <Field label="State" error={errors.state?.message}>
            <Input {...register("state")} autoComplete="address-level1" />
          </Field>
          <Field label="Postal code (optional)">
            <Input {...register("postal_code")} autoComplete="postal-code" />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          <Lock className="size-4" />
          Pay {formatPrice(estimatedTotal)}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          Payments are processed securely by Paystack. We never see your card details.
        </p>
      </form>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-lg text-ink">Order summary</h2>

        <div className="mt-4 space-y-3">
          {lines.map((l) => (
            <div key={l.lineId} className="flex justify-between gap-4 text-sm">
              <span className="text-ink-muted">
                {l.quantity} × {l.title}
                {l.bundleName && (
                  <span className="ml-1 text-xs text-gold">({l.bundleName})</span>
                )}
              </span>
              <span className="tabular-nums whitespace-nowrap">
                {l.unitPrice === 0 ? "Free" : formatPrice(l.unitPrice * l.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <label className="text-xs font-medium text-ink">Discount code</label>
          <div className="mt-1.5 flex gap-2">
            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Optional"
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAppliedCode(codeInput.trim());
                if (codeInput.trim()) {
                  toast.message("Code will be checked when you pay");
                }
              }}
            >
              Apply
            </Button>
          </div>
          {appliedCode && (
            <p className="mt-1.5 text-xs text-accent">
              {appliedCode} will be applied if it's still valid.
            </p>
          )}
        </div>

        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">Subtotal</span>
            <span className="tabular-nums">{formatPrice(goods)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Delivery</span>
            <span className="tabular-nums">
              {shipping === 0 ? "Free" : formatPrice(shipping)}
            </span>
          </div>
          {freeThreshold > 0 && goods < freeThreshold && (
            <p className="text-xs text-gold">
              Spend {formatPrice(freeThreshold - goods)} more for free delivery.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(estimatedTotal)}</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Final total is confirmed by our server before payment.
        </p>
      </aside>
    </div>
  );
}
