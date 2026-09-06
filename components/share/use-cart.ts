"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Storefront cart, persisted to localStorage so it survives navigating to a
 * per-product page and back. Keyed per tenant slug.
 */
export function useStorefrontCart(slug: string) {
  const key = `sf-cart:${slug}`;
  const [lines, setLines] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once from localStorage after mount (SSR renders an empty cart).
  useEffect(() => {
    let next: Record<string, number> = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") next = parsed;
      }
    } catch {
      /* private mode / blocked storage — start empty */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
    setLines(next);
    setHydrated(true);
  }, [key]);

  const setQty = useCallback(
    (productId: string, quantity: number) => {
      setLines((prev) => {
        const next = { ...prev };
        const q = Math.max(0, Math.floor(quantity));
        if (q === 0) delete next[productId];
        else next[productId] = q;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    setLines({});
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key]);

  const count = Object.values(lines).reduce((n, q) => n + q, 0);

  return { lines, setQty, clear, count, hydrated };
}
