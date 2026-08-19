import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

  const variants: Record<Variant, string> = {
    primary: "bg-primary text-white hover:bg-primary-ink shadow-sm",
    secondary:
      "border border-border bg-surface text-ink hover:bg-surface-muted",
    ghost: "text-ink hover:bg-surface-muted",
    danger: "bg-danger text-white hover:opacity-90",
  };

  const sizes: Record<Size, string> = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-sm",
    lg: "h-13 px-8 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
