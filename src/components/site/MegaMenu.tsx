"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Fiction", href: "/shop/fiction" },
  { label: "Non-Fiction", href: "/shop/non-fiction" },
  { label: "Children's Books", href: "/shop/childrens-books" },
  { label: "Textbooks", href: "/shop/textbooks" },
  { label: "Notebooks & Journals", href: "/shop/notebooks-journals" },
  { label: "Writing & Drawing", href: "/shop/writing-drawing" },
  { label: "Classroom Supplies", href: "/shop/classroom-supplies" },
];

export function MegaMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !rootRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-menu-link]", {
        y: 22,
        opacity: 0,
        duration: 0.5,
        stagger: 0.045,
        ease: "power3.out",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [open]);

  return (
    <div
      ref={rootRef}
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 overflow-hidden bg-forest-deep transition-opacity duration-300 dark:bg-[#101a14]",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {/* Oversized ghosted wordmark, bled off the bottom edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[8vw] left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[30vw] font-bold leading-none tracking-[-0.06em] text-on-dark/[0.055]"
      >
        Livro
      </span>

      <button
        onClick={onClose}
        aria-label="Close menu"
        className="absolute right-5 top-5 grid size-11 cursor-pointer place-items-center rounded-full border border-on-dark/20 text-on-dark transition-colors hover:bg-on-dark/10"
      >
        <X className="size-5" />
      </button>

      <nav className="relative flex h-full flex-col items-center justify-center gap-1 px-6">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            data-menu-link
            tabIndex={open ? 0 : -1}
            className="font-display text-[clamp(28px,5.2vw,64px)] font-semibold leading-[1.18] tracking-[-0.035em] text-sage-soft transition-colors duration-200 hover:text-on-dark focus-visible:text-on-dark focus-visible:outline-none"
          >
            {link.label}
          </Link>
        ))}

        <Link
          href="/shop"
          onClick={onClose}
          data-menu-link
          tabIndex={open ? 0 : -1}
          className="mt-8 rounded-full bg-on-dark px-7 py-3 text-sm font-medium text-forest-deep transition-opacity hover:opacity-90"
        >
          Browse everything
        </Link>
      </nav>
    </div>
  );
}
