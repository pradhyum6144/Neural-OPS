"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY   = "nos_credits";
const INITIAL_BALANCE = 50.00;

function load(): number {
  if (typeof window === "undefined") return INITIAL_BALANCE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw !== null ? parseFloat(raw) : INITIAL_BALANCE;
  } catch { return INITIAL_BALANCE; }
}

function persist(v: number) {
  try { localStorage.setItem(STORAGE_KEY, v.toFixed(2)); } catch { /* noop */ }
}

export function useCredits() {
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);

  useEffect(() => { setBalance(load()); }, []);

  const deduct = useCallback((costINR: number) => {
    if (costINR <= 0) return;
    setBalance((prev) => {
      const next = Math.max(0, Math.round((prev - costINR) * 100) / 100);
      persist(next);
      return next;
    });
  }, []);

  const addCredits = useCallback((amountINR: number) => {
    if (amountINR <= 0) return;
    setBalance((prev) => {
      const next = Math.round((prev + amountINR) * 100) / 100;
      persist(next);
      return next;
    });
  }, []);

  return { balance, deduct, addCredits };
}
