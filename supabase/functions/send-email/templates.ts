type TemplateData = Record<string, unknown> & { siteUrl?: string };

type Message = { subject: string; text: string; html: string };

const COPY: Record<string, { subject: string; heading: string; body: string }> = {
  order_created: {
    subject: "We've received your order",
    heading: "Thank you for your order",
    body: "We've received it and we're waiting for your payment to be confirmed. We'll email you the moment it goes through.",
  },
  payment_succeeded: {
    subject: "Payment confirmed",
    heading: "Your payment is confirmed",
    body: "Thank you — we're preparing your order now. We'll let you know as soon as it's on its way.",
  },
  payment_failed: {
    subject: "Your payment didn't go through",
    heading: "We couldn't confirm your payment",
    body: "Your order wasn't completed and nothing has been charged. The items have been returned to our shelves — you're welcome to try again.",
  },
  order_processing: {
    subject: "Your order is being prepared",
    heading: "We're preparing your order",
    body: "Our team is picking and packing your items right now.",
  },
  order_ready_for_dispatch: {
    subject: "Your order is ready to go",
    heading: "Almost on its way",
    body: "Your order is packed and waiting for dispatch.",
  },
  order_shipped: {
    subject: "Your order is on its way",
    heading: "Your order has been dispatched",
    body: "It's on the move. You can follow its progress at any time using the link below.",
  },
  order_out_for_delivery: {
    subject: "Arriving today",
    heading: "Your order is out for delivery",
    body: "Please keep your phone nearby — our courier may call you.",
  },
  order_delivered: {
    subject: "Your order has been delivered",
    heading: "Delivered",
    body: "We hope you enjoy it. Thank you for shopping with Livro Archive.",
  },
  order_cancelled: {
    subject: "Your order has been cancelled",
    heading: "Order cancelled",
    body: "Your order has been cancelled. If you were charged, a refund is on its way.",
  },
  order_refunded: {
    subject: "Your refund has been issued",
    heading: "Refund issued",
    body: "We've processed your refund. It may take a few business days to appear on your statement.",
  },
};

export function renderTemplate(eventType: string, data: TemplateData): Message | null {
  const copy = COPY[eventType];
  if (!copy) return null;

  const orderNumber = String(data.order_number ?? "");
  const siteUrl = String(data.siteUrl ?? "").replace(/\/$/, "");
  const trackUrl = orderNumber ? `${siteUrl}/track/${orderNumber}` : `${siteUrl}/track`;

  const courier = data.courier_name ? String(data.courier_name) : null;
  const tracking = data.tracking_number ? String(data.tracking_number) : null;
  const courierLine =
    courier && tracking
      ? `Courier: ${courier} · Tracking number: ${tracking}`
      : courier
        ? `Courier: ${courier}`
        : null;

  const subject = orderNumber
    ? `${copy.subject} — ${orderNumber}`
    : copy.subject;

  const text = [
    copy.heading,
    "",
    copy.body,
    "",
    orderNumber ? `Order number: ${orderNumber}` : "",
    courierLine ?? "",
    "",
    `Track your order: ${trackUrl}`,
    "",
    "Livro Archive",
  ]
    .filter(Boolean)
    .join("\n");

  // Inline styles only — email clients strip stylesheets. Colours mirror the
  // storefront's editorial palette (design.md §1).
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e1dbcd;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7a2230;font-weight:700;">Livro Archive</p>
          <h1 style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#16130f;font-weight:600;">${escapeHtml(copy.heading)}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#6e675c;">${escapeHtml(copy.body)}</p>
        </td></tr>
        ${
          orderNumber
            ? `<tr><td style="padding:20px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;border-radius:12px;">
            <tr><td style="padding:14px 16px;">
              <p style="margin:0;font-size:12px;color:#6e675c;">Order number</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#16130f;">${escapeHtml(orderNumber)}</p>
              ${courierLine ? `<p style="margin:10px 0 0;font-size:13px;color:#6e675c;">${escapeHtml(courierLine)}</p>` : ""}
            </td></tr>
          </table>
        </td></tr>`
            : ""
        }
        <tr><td style="padding:24px 32px 32px;">
          <a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:#7a2230;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:999px;">Track your order</a>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#6e675c;">You're receiving this because you placed an order with Livro Archive.</p>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
