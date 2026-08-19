/**
 * Livro Archive wordmark. Drawn as text in the display face rather than an image
 * so it inherits colour, scales cleanly and costs no extra request.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold leading-none tracking-[-0.05em] ${className}`}
      style={{ fontSize: "inherit" }}
    >
      <span className="text-[22px]">Livro</span>
      <span className="text-[22px] text-forest">.</span>
    </span>
  );
}
