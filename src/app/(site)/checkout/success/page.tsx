import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <CheckCircle2 className="mx-auto size-14 text-accent" />
      <h1 className="font-display text-3xl text-ink mt-6">Order placed</h1>
      <p className="mt-3 text-ink-muted">
        {order ? (
          <>
            Your order number is <span className="font-semibold text-ink">{order}</span>.
            Save it — you'll need it (with your email or phone) to track your delivery.
          </>
        ) : (
          "Your order has been received."
        )}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {order && (
          <Link href={`/track/${order}`}>
            <Button size="lg">Track this order</Button>
          </Link>
        )}
        <Link href="/shop">
          <Button variant="secondary" size="lg">
            Keep browsing
          </Button>
        </Link>
      </div>
    </div>
  );
}
