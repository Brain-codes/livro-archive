"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Saved items. Local-only and guest-friendly — saving something should never
 * prompt an account (flow.md §5).
 */
type WishlistState = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        })),
      clear: () => set({ ids: [] }),
    }),
    { name: "livro-archive-wishlist" },
  ),
);
