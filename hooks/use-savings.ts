"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "nos_savings";

interface SavingsData {
  date: string;       // YYYY-MM-DD
  totalSaved: number; // ₹
  totalCost: number;  // ₹
  runCount: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadData(): SavingsData {
  if (typeof window === "undefined") return { date: todayKey(), totalSaved: 0, totalCost: 0, runCount: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), totalSaved: 0, totalCost: 0, runCount: 0 };
    const parsed = JSON.parse(raw) as SavingsData;
    // Reset if it's a new day
    if (parsed.date !== todayKey()) return { date: todayKey(), totalSaved: 0, totalCost: 0, runCount: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), totalSaved: 0, totalCost: 0, runCount: 0 };
  }
}

export function useSavings() {
  const [data, setData] = useState<SavingsData>({ date: todayKey(), totalSaved: 0, totalCost: 0, runCount: 0 });

  useEffect(() => {
    setData(loadData());
  }, []);

  const addRun = useCallback((costINR: number, savingsINR: number) => {
    setData((prev) => {
      const next: SavingsData = {
        date: todayKey(),
        totalSaved: Math.round((prev.totalSaved + savingsINR) * 100) / 100,
        totalCost:  Math.round((prev.totalCost  + costINR)    * 100) / 100,
        runCount:   prev.runCount + 1,
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  return { savedToday: data.totalSaved, costToday: data.totalCost, runCount: data.runCount, addRun };
}
