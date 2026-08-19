const PROMISES = [
  {
    title: "Chosen, not aggregated",
    copy: "Every title is picked by a human. No endless catalogue, no filler.",
  },
  {
    title: "Buy without an account",
    copy: "Checkout as a guest and still track the order the whole way.",
  },
  {
    title: "Complete the set",
    copy: "The notebook, the pens, the marker — offered together, priced better.",
  },
];

export function TrustBar() {
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-14">
      <div className="grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {PROMISES.map((promise) => (
          <div key={promise.title} className="px-0 py-6 sm:px-8 sm:first:pl-0 sm:last:pr-0">
            <h3 className="font-display text-sm font-semibold text-ink">{promise.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{promise.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
