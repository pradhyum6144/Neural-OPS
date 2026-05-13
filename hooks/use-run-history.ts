"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "nos_run_history";
const MAX_RECORDS = 50;

export interface RunRecord {
  id: string;
  date: string;        // ISO string
  command: string;
  model: string;
  tokens: number;
  costINR: number;
  savedINR: number;
}

function load(): RunRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RunRecord[]) : [];
  } catch { return []; }
}

function persist(records: RunRecord[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* noop */ }
}

export function useRunHistory() {
  const [records, setRecords] = useState<RunRecord[]>([]);

  useEffect(() => { setRecords(load()); }, []);

  const addRecord = useCallback((rec: Omit<RunRecord, "id" | "date">) => {
    setRecords((prev) => {
      const next = [
        { id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, date: new Date().toISOString(), ...rec },
        ...prev,
      ].slice(0, MAX_RECORDS);
      persist(next);
      return next;
    });
  }, []);

  return { records, addRecord };
}
