"use client";

import { useState, useCallback, useEffect } from "react";

export interface HistoryEntry {
  id: string;
  ts: string;
  command: string;
  tokens: number;
  agentsCompleted: number;
}

const STORAGE_KEY = "nos_workflow_history";
const MAX = 5;

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function useWorkflowHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(load());
  }, []);

  const addEntry = useCallback((entry: Omit<HistoryEntry, "id" | "ts">) => {
    setHistory((prev) => {
      const next: HistoryEntry[] = [
        {
          id: Date.now().toString(),
          ts: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
          ...entry,
        },
        ...prev,
      ].slice(0, MAX);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { history, addEntry, clearHistory };
}
