import Link from "next/link";
import { ThemeToggle } from "@/components/site/ThemeToggle";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-7xl px-5 py-14 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-display text-lg text-ink">Livro Archive</p>
          <p className="mt-3 text-sm text-ink-muted">
            Books, stationery and everything in between — sold with soul.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/shop" className="text-ink-muted hover:text-ink">All products</Link></li>
            <li><Link href="/shop/fiction" className="text-ink-muted hover:text-ink">Fiction</Link></li>
            <li><Link href="/shop/textbooks" className="text-ink-muted hover:text-ink">Textbooks</Link></li>
            <li><Link href="/shop/notebooks-journals" className="text-ink-muted hover:text-ink">Notebooks & Journals</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Support</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/track" className="text-ink-muted hover:text-ink">Track an order</Link></li>
            <li><Link href="/account" className="text-ink-muted hover:text-ink">Your account</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Livro Archive</p>
          <p className="mt-3 text-sm text-ink-muted">No account needed to buy — ever.</p>
        </div>
      </div>
      <div className="border-t border-border px-5 py-6 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-ink-muted">
          © {new Date().getFullYear()} Livro Archive. All rights reserved.
        </p>
        <ThemeToggle />
      </div>
    </footer>
  );
}
