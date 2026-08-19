"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    // Subscriber capture isn't wired to a list yet — say so rather than pretending.
    setTimeout(() => {
      setSubmitting(false);
      setEmail("");
      toast.success("Thanks — we'll be in touch when this opens up.");
    }, 400);
  }

  return (
    <section className="bg-surface-sunken py-16">
      <div className="mx-auto max-w-[1400px] px-5">
        <div className="grid overflow-hidden rounded-2xl bg-forest md:grid-cols-[0.8fr_1.2fr]">
          <div className="hidden bg-sage md:block dark:bg-sage-soft" aria-hidden />
          <div className="px-8 py-12 lg:px-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-dark/60">
              Livro Archive newsletter
            </p>
            <h2 className="mt-3 max-w-md font-display text-[clamp(26px,3.2vw,38px)] font-semibold text-on-dark">
              Ten percent off your first order.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-on-dark/75">
              New arrivals, restocks and the occasional reading list — no more than
              twice a month.
            </p>

            <form onSubmit={onSubmit} className="mt-6 max-w-md">
              <div className="flex items-center gap-2 rounded-full bg-canvas p-1.5 pl-4">
                <Mail className="size-4 shrink-0 text-ink-faint" aria-hidden />
                <label className="sr-only" htmlFor="newsletter-email">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="h-9 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="shrink-0 cursor-pointer rounded-full bg-forest px-5 py-2 text-[13px] font-medium text-on-dark transition-colors hover:bg-forest-deep disabled:opacity-50 dark:text-canvas"
                >
                  {submitting ? "Signing up…" : "Sign up"}
                </button>
              </div>
              <p className="mt-3 text-xs text-on-dark/55">
                We'll email your discount code once you confirm.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
