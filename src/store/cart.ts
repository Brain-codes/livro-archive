"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

export type CartLine = {
  lineId: string; // client-side unique id (allows same product in two bundle groups)
  productId: string;
  variantId?: string | null;
  bundleId?: string | null;
  bundleName?: string | null;
  title: string;
  image?: string | null;
  unitPrice: number;
  quantity: number;
  maxStock: number;
};

type CartState = {
  sessionToken: string;
  lines: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addLine: (line: Omit<CartLine, "lineId">) => void;
  addBundle: (lines: Array<Omit<CartLine, "lineId">>) => void;
  removeLine: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      sessionToken: nanoid(24),
      lines: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find(
            (l) =>
              l.productId === line.productId &&
              l.variantId === line.variantId &&
              !l.bundleId,
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.lineId === existing.lineId
                  ? { ...l, quantity: Math.min(l.maxStock, l.quantity + line.quantity) }
                  : l,
              ),
              isOpen: true,
            };
          }
          return {
            lines: [...state.lines, { ...line, lineId: nanoid(10) }],
            isOpen: true,
          };
        }),

      addBundle: (lines) =>
        set((state) => ({
          lines: [...state.lines, ...lines.map((l) => ({ ...l, lineId: nanoid(10) }))],
          isOpen: true,
        })),

      removeLine: (lineId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),

      setQuantity: (lineId, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.lineId === lineId
                ? { ...l, quantity: Math.max(1, Math.min(l.maxStock, quantity)) }
                : l,
            )
            .filter((l) => l.quantity > 0),
        })),

      clear: () => set({ lines: [] }),

      subtotal: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    { name: "livro-archive-cart" },
  ),
);
