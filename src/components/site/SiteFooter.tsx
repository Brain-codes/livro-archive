import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "Fiction", href: "/shop/fiction" },
      { label: "Non-fiction", href: "/shop/non-fiction" },
      { label: "Textbooks", href: "/shop/textbooks" },
      { label: "Notebooks & journals", href: "/shop/notebooks-journals" },
      { label: "Bundles", href: "/bundles" },
    ],
  },
  {
    heading: "Your order",
    links: [
      { label: "Track an order", href: "/track" },
      { label: "Your account", href: "/account" },
      { label: "Saved items", href: "/saved" },
      { label: "Basket", href: "/cart" },
    ],
  },
  {
    heading: "Livro Archive",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Delivery", href: "/delivery" },
      { label: "Returns", href: "/returns" },
    ],
  },
];

const PAYMENT_METHODS = ["Visa", "Mastercard", "Verve", "Bank transfer", "USSD"];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-sunken">
      <div className="mx-auto max-w-[1400px] px-5 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-12">
          <Wordmark className="text-ink" />
          <div>
            <p className="font-display text-xl font-semibold text-ink">
              Read more. Carry less.
            </p>
            <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
              Books, stationery and classroom supplies for people who still like the
              paper kind.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow">Contact</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-muted">
              <li>
                <a href="mailto:hello@livroarchive.com" className="hover:text-ink">
                  hello@livroarchive.com
                </a>
              </li>
              <li>Mon–Fri, 9am–5pm</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Instagram", "Twitter", "Facebook"].map((network) => (
                <span
                  key={network}
                  className="rounded-full border border-border px-3 py-1 text-[11px] text-ink-muted"
                >
                  {network}
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="eyebrow">{column.heading}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-ink-muted transition-colors hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border pt-8">
          <span className="eyebrow">Secure payment</span>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted"
              >
                {method}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-ink-faint">Processed by Paystack</span>
        </div>

        <div className="mt-8 flex flex-col-reverse items-center justify-between gap-5 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} Livro Archive. All rights reserved.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
