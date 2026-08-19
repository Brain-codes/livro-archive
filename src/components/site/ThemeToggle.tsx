"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("livro-archive-theme") as ThemeChoice) || "system";
    setChoice(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

  function choose(next: ThemeChoice) {
    setChoice(next);
    localStorage.setItem("livro-archive-theme", next);
    applyTheme(next);
  }

  if (!mounted) return <div className="h-9 w-[108px]" />;

  const options: Array<{ value: ThemeChoice; icon: typeof Sun; label: string }> = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => choose(value)}
          aria-label={`${label} mode`}
          aria-pressed={choice === value}
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-colors",
            choice === value
              ? "bg-primary text-white"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
