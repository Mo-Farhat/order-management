"use client";

import { useCallback, useEffect, useState } from "react";

const SYNC_EVENT = "sf-cart";

function readCart(key: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, number>;
    }
  } catch {
    /* private mode / blocked storage */
  }
  return {};
}

function writeCart(key: string, value: Record<string, number>) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
  } catch {
    /* ignore */
  }
}

/**
 * Storefront cart, persisted to localStorage so it survives navigating to a
 * per-product page and back. Keyed per tenant slug. Multiple hook instances on
 * one page (nav badge + product grid) stay in sync via a `sf-cart` window event
 * (same tab) and the native `storage` event (other tabs).
 */
export function useStorefrontCart(slug: string) {
  const key = `sf-cart:${slug}`;
  const [lines, setLines] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration + external-store sync
    setLines(readCart(key));
    setHydrated(true);

    const resync = (e: Event) => {
      if (e instanceof CustomEvent && e.detail?.key && e.detail.key !== key) return;
      if (e instanceof StorageEvent && e.key && e.key !== key) return;
      setLines(readCart(key));
    };
    window.addEventListener(SYNC_EVENT, resync);
    window.addEventListener("storage", resync);
    return () => {
      window.removeEventListener(SYNC_EVENT, resync);
      window.removeEventListener("storage", resync);
    };
  }, [key]);

  const setQty = useCallback(
    (productId: string, quantity: number) => {
      setLines((prev) => {
        const next = { ...prev };
        const q = Math.max(0, Math.floor(quantity));
        if (q === 0) delete next[productId];
        else next[productId] = q;
        writeCart(key, next);
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
    try {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
    } catch {
      /* ignore */
    }
  }, [key]);

  const count = Object.values(lines).reduce((n, q) => n + q, 0);

  return { lines, setQty, clear, count, hydrated };
}
