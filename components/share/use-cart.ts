"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SYNC_EVENT = "sf-cart";

type Lines = Record<string, number>;

function readCart(key: string): Lines {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Lines;
    }
  } catch {
    /* private mode / blocked storage */
  }
  return {};
}

function sameLines(a: Lines, b: Lines): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => a[k] === b[k]);
}

/**
 * Storefront cart, persisted to localStorage so it survives navigating to a
 * per-product page and back. Keyed per tenant slug. Multiple hook instances on
 * one page (nav badge + product grid) stay in sync via a `sf-cart` window event
 * (same tab) and the native `storage` event (other tabs).
 *
 * Writes happen in the event handler, never inside a `setState` updater — a
 * synchronous dispatch from an updater would land as a setState-during-render
 * in whichever other instance is mid-render.
 */
export function useStorefrontCart(slug: string) {
  const key = `sf-cart:${slug}`;
  const [lines, setLines] = useState<Lines>({});
  const [hydrated, setHydrated] = useState(false);

  /** Mirrors `lines` so writers can derive the next value without an updater. */
  const ref = useRef<Lines>(lines);
  ref.current = lines;

  useEffect(() => {
    const initial = readCart(key);
    ref.current = initial;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from an external store
    setLines(initial);
    setHydrated(true);

    const resync = (e: Event) => {
      if (e instanceof CustomEvent && e.detail?.key && e.detail.key !== key) return;
      if (e instanceof StorageEvent && e.key && e.key !== key) return;
      const next = readCart(key);
      // Skip the render when nothing actually moved (every instance gets this event).
      if (sameLines(ref.current, next)) return;
      ref.current = next;
      setLines(next);
    };
    window.addEventListener(SYNC_EVENT, resync);
    window.addEventListener("storage", resync);
    return () => {
      window.removeEventListener(SYNC_EVENT, resync);
      window.removeEventListener("storage", resync);
    };
  }, [key]);

  const commit = useCallback(
    (next: Lines, persist: () => void) => {
      ref.current = next;
      setLines(next);
      persist();
      try {
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
      } catch {
        /* ignore */
      }
    },
    [key],
  );

  const setQty = useCallback(
    (productId: string, quantity: number) => {
      const next = { ...ref.current };
      const q = Math.max(0, Math.floor(quantity));
      if (q === 0) delete next[productId];
      else next[productId] = q;
      commit(next, () => {
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      });
    },
    [commit, key],
  );

  const clear = useCallback(() => {
    commit({}, () => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
  }, [commit, key]);

  const count = Object.values(lines).reduce((n, q) => n + q, 0);

  return { lines, setQty, clear, count, hydrated };
}
