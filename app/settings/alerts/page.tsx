"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronRight, Bell, Mail, MessageSquare, Hash,
  Save, Send, AlertTriangle, Clock, Zap, Shield,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { Sidebar } from "@/components/dashboard/sidebar";

// ── Types ──────────────────────────────────────────────────────────────────

interface AlertSettings {
  daily_limit: number;
  per_run_limit: number;
  spike_threshold: number;
  email_enabled: boolean;
  email_address: string;
  discord_enabled: boolean;
  discord_webhook_url: string;
  slack_enabled: boolean;
  slack_webhook_url: string;
}

interface AlertLog {
  id: string;
  alert_type: "warning" | "critical" | "spike";
  message: string;
  tokens_used: number;
  limit_used: number;
  fired_at: string;
}

const DEFAULTS: AlertSettings = {
  daily_limit: 50000,
  per_run_limit: 10000,
  spike_threshold: 15000,
  email_enabled: false,
  email_address: "",
  discord_enabled: false,
  discord_webhook_url: "",
  slack_enabled: false,
  slack_webhook_url: "",
};

const USER_ID = "anonymous";

// ── Sub-components ─────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={clsx(
        "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 transition-all duration-200",
        on ? "bg-[#6366f1] border-[#6366f1]" : "bg-[rgba(99,102,241,0.1)] border-[rgba(99,102,241,0.2)]"
      )}
    >
      <span className={clsx(
        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 mt-[1px]",
        on ? "translate-x-3.5" : "translate-x-0.5"
      )} />
    </button>
  );
}

function NosInput({
  label, value, onChange, type = "text", placeholder, helper,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; helper?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#9090b0]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,20,0.6)]
                   px-3 py-2 font-mono text-sm text-[#e0e0ff] placeholder:text-[#3a3a5a]
                   outline-none focus:border-[rgba(99,102,241,0.55)]
                   focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-150"
      />
      {helper && <p className="text-[10px] text-[#4a4a6a] leading-relaxed">{helper}</p>}
    </div>
  );
}

function NumberInput({
  label, value, onChange, min, max, step = 1000,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#9090b0]">{label}</label>
        <span className="font-mono text-xs text-[#6366f1] font-semibold">
          {value.toLocaleString()}
        </span>
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        className="rounded-lg border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,20,0.6)]
                   px-3 py-2 font-mono text-sm text-[#e0e0ff]
                   outline-none focus:border-[rgba(99,102,241,0.55)]
                   focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-150"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5
                   [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-[#6366f1] [&::-webkit-slider-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366f1 ${((value - min) / (max - min)) * 100}%, rgba(99,102,241,0.15) 0%)`,
        }}
      />
      <div className="flex justify-between text-[9px] text-[#3a3a5a] font-mono">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[rgba(99,102,241,0.12)] bg-[rgba(99,102,241,0.04)]"
    >
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[rgba(99,102,241,0.08)]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)]">
          <Icon size={13} className="text-[#6366f1]" />
        </div>
        <span className="text-sm font-semibold text-[#c0c0e0]">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

const BADGE_STYLE: Record<string, string> = {
  warning:  "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)]",
  critical: "bg-[rgba(244,63,94,0.12)]  text-[#f43f5e] border border-[rgba(244,63,94,0.3)]",
  spike:    "bg-[rgba(99,102,241,0.12)] text-[#6366f1] border border-[rgba(99,102,241,0.3)]",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function AlertSettingsPage() {
  const [form, setForm] = useState<AlertSettings>(DEFAULTS);
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load existing settings + alert history
  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, logsRes] = await Promise.all([
          fetch(`/api/alerts/settings?userId=${USER_ID}`),
          fetch(`/api/alerts/logs?userId=${USER_ID}`),
        ]);

        const settingsJson = await settingsRes.json();
        if (settingsJson.data) {
          setForm((prev) => ({ ...prev, ...settingsJson.data }));
        }

        const logsJson = await logsRes.json();
        if (logsJson.data) setLogs(logsJson.data);
      } catch {
        // Supabase not configured — use defaults silently
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const set = useCallback(<K extends keyof AlertSettings>(key: K, val: AlertSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/alerts/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      toast.success("Settings saved", { description: "Alert configuration updated." });
    } catch (err) {
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channel: "email" | "discord" | "slack") => {
    setTesting(channel);
    try {
      const res = await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, settings: form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Test failed");
      toast.success(`Test ${channel} sent`, { description: "Check your channel for the test message." });
    } catch (err) {
      toast.error(`Test failed`, {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setTesting(null);
    }
  };

  const warningAt = Math.floor(form.daily_limit * 0.8);

  if (!loaded) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f]">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center md:pl-16">
          <div className="h-5 w-5 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-[#e0e0ff]">
      <Sidebar />

      <div className="flex flex-1 flex-col md:pl-16">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-[rgba(99,102,241,0.1)]
                           bg-[rgba(10,10,15,0.9)] backdrop-blur-xl px-6">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-[#4a4a6a] hover:text-[#9090b0] transition-colors">Neural OPS</Link>
            <ChevronRight size={13} className="text-[#2a2a3a]" />
            <span className="text-[#4a4a6a]">Settings</span>
            <ChevronRight size={13} className="text-[#2a2a3a]" />
            <span className="text-[#e0e0ff] font-medium">Alerts</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-28">
          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#e0e0ff] tracking-tight">Alert Configuration</h1>
            <p className="mt-1 text-sm text-[#6b6b8a]">
              Get notified when token usage exceeds your limits
            </p>
          </div>

          <div className="max-w-2xl flex flex-col gap-5">

            {/* ── Section 1: Usage Limits ──────────────────────────────── */}
            <Card title="Usage Limits" icon={Shield}>
              <div className="flex flex-col gap-5">
                <NumberInput
                  label="Daily Token Limit"
                  value={form.daily_limit}
                  onChange={(v) => set("daily_limit", v)}
                  min={1000}
                  max={500000}
                  step={1000}
                />
                <NumberInput
                  label="Per Run Limit"
                  value={form.per_run_limit}
                  onChange={(v) => set("per_run_limit", v)}
                  min={1000}
                  max={100000}
                  step={500}
                />
                <NumberInput
                  label="Spike Threshold"
                  value={form.spike_threshold}
                  onChange={(v) => set("spike_threshold", v)}
                  min={1000}
                  max={100000}
                  step={500}
                />

                {/* Live preview */}
                <div className="rounded-lg border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.05)] px-4 py-3 flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold text-[#6060a0] uppercase tracking-wider mb-1">Alert Preview</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)] font-bold">WARNING</span>
                    <span className="font-mono text-[11px] text-[#9090b0]">
                      at <span className="text-[#f59e0b]">{warningAt.toLocaleString()}</span> tokens/day
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-[rgba(244,63,94,0.12)] text-[#f43f5e] border border-[rgba(244,63,94,0.3)] font-bold">CRITICAL</span>
                    <span className="font-mono text-[11px] text-[#9090b0]">
                      at <span className="text-[#f43f5e]">{form.daily_limit.toLocaleString()}</span> tokens/day
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-[rgba(99,102,241,0.12)] text-[#6366f1] border border-[rgba(99,102,241,0.3)] font-bold">SPIKE</span>
                    <span className="font-mono text-[11px] text-[#9090b0]">
                      if single run &gt; <span className="text-[#6366f1]">{form.spike_threshold.toLocaleString()}</span> tokens
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* ── Section 2: Email ──────────────────────────────────────── */}
            <Card title="Email Alerts" icon={Mail}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#c0c0e0]">Email Notifications</p>
                    <p className="text-[11px] text-[#4a4a6a] mt-0.5">Receive HTML email alerts via Resend</p>
                  </div>
                  <Toggle on={form.email_enabled} onChange={(v) => set("email_enabled", v)} />
                </div>

                <AnimatePresence>
                  {form.email_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-3 overflow-hidden"
                    >
                      <NosInput
                        label="Email Address"
                        type="email"
                        value={form.email_address}
                        onChange={(v) => set("email_address", v)}
                        placeholder="you@example.com"
                      />
                      <button
                        onClick={() => handleTest("email")}
                        disabled={testing === "email" || !form.email_address}
                        className="flex items-center gap-2 self-start rounded-lg border border-[rgba(99,102,241,0.25)]
                                   px-3 py-1.5 text-xs font-semibold text-[#6366f1]
                                   hover:bg-[rgba(99,102,241,0.1)] disabled:opacity-40
                                   transition-all duration-150"
                      >
                        {testing === "email"
                          ? <span className="h-3 w-3 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
                          : <Send size={11} />}
                        Send test email
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* ── Section 3: Discord ────────────────────────────────────── */}
            <Card title="Discord Alerts" icon={MessageSquare}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#c0c0e0]">Discord Notifications</p>
                    <p className="text-[11px] text-[#4a4a6a] mt-0.5">Post alerts to a Discord channel via webhook</p>
                  </div>
                  <Toggle on={form.discord_enabled} onChange={(v) => set("discord_enabled", v)} />
                </div>

                <AnimatePresence>
                  {form.discord_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-3 overflow-hidden"
                    >
                      <NosInput
                        label="Webhook URL"
                        value={form.discord_webhook_url}
                        onChange={(v) => set("discord_webhook_url", v)}
                        placeholder="https://discord.com/api/webhooks/..."
                        helper="Create a webhook: Discord Server → Channel Settings → Integrations → Webhooks"
                      />
                      <a
                        href="https://support.discord.com/hc/en-us/articles/228383668"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#6366f1] hover:text-indigo-400 transition-colors w-fit"
                      >
                        How to get a webhook URL →
                      </a>
                      <button
                        onClick={() => handleTest("discord")}
                        disabled={testing === "discord" || !form.discord_webhook_url}
                        className="flex items-center gap-2 self-start rounded-lg border border-[rgba(99,102,241,0.25)]
                                   px-3 py-1.5 text-xs font-semibold text-[#6366f1]
                                   hover:bg-[rgba(99,102,241,0.1)] disabled:opacity-40
                                   transition-all duration-150"
                      >
                        {testing === "discord"
                          ? <span className="h-3 w-3 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
                          : <Send size={11} />}
                        Send test message
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* ── Section 4: Slack ──────────────────────────────────────── */}
            <Card title="Slack Alerts" icon={Hash}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#c0c0e0]">Slack Notifications</p>
                    <p className="text-[11px] text-[#4a4a6a] mt-0.5">Post Block Kit alerts to a Slack channel</p>
                  </div>
                  <Toggle on={form.slack_enabled} onChange={(v) => set("slack_enabled", v)} />
                </div>

                <AnimatePresence>
                  {form.slack_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-3 overflow-hidden"
                    >
                      <NosInput
                        label="Webhook URL"
                        value={form.slack_webhook_url}
                        onChange={(v) => set("slack_webhook_url", v)}
                        placeholder="https://hooks.slack.com/services/..."
                        helper="Add an incoming webhook at api.slack.com/apps → Your App → Incoming Webhooks"
                      />
                      <button
                        onClick={() => handleTest("slack")}
                        disabled={testing === "slack" || !form.slack_webhook_url}
                        className="flex items-center gap-2 self-start rounded-lg border border-[rgba(99,102,241,0.25)]
                                   px-3 py-1.5 text-xs font-semibold text-[#6366f1]
                                   hover:bg-[rgba(99,102,241,0.1)] disabled:opacity-40
                                   transition-all duration-150"
                      >
                        {testing === "slack"
                          ? <span className="h-3 w-3 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
                          : <Send size={11} />}
                        Send test message
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* ── Section 5: Alert History ──────────────────────────────── */}
            <Card title="Alert History" icon={Clock}>
              {logs.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(99,102,241,0.08)]">
                    <Zap size={20} className="text-[#3a3a5a]" />
                  </div>
                  <p className="text-sm text-[#4a4a6a] text-center">
                    No alerts fired yet.<br />
                    <span className="text-[#3a3a5a]">Your usage is within limits.</span>
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[rgba(99,102,241,0.08)]">
                        {["Time", "Type", "Message", "Tokens", "Limit"].map((h) => (
                          <th key={h} className="pb-2 pr-4 text-[10px] font-semibold text-[#4a4a6a] uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-[rgba(99,102,241,0.05)] hover:bg-[rgba(99,102,241,0.03)]">
                          <td className="py-2.5 pr-4 font-mono text-[10px] text-[#4a4a6a] whitespace-nowrap">
                            {new Date(log.fired_at).toLocaleString("en-US", {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit", hour12: false,
                            })}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={clsx(
                              "text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap",
                              BADGE_STYLE[log.alert_type]
                            )}>
                              {log.alert_type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-[11px] text-[#7070a0] max-w-[220px] truncate">
                            {log.message}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-[11px] text-[#a0a0ff] whitespace-nowrap">
                            {log.tokens_used.toLocaleString()}
                          </td>
                          <td className="py-2.5 font-mono text-[11px] text-[#5a5a7a] whitespace-nowrap">
                            {log.limit_used.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

          </div>
        </main>

        {/* Fixed save button */}
        <div className="fixed bottom-0 right-0 left-0 md:left-16 z-30 flex justify-end
                        border-t border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,15,0.95)]
                        backdrop-blur-xl px-6 py-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#6366f1] hover:bg-indigo-500
                       px-5 py-2 text-sm font-semibold text-white
                       disabled:opacity-50 transition-all duration-150
                       shadow-[0_0_16px_rgba(99,102,241,0.3)]
                       hover:shadow-[0_0_24px_rgba(99,102,241,0.5)]"
          >
            {saving
              ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <Save size={13} />}
            Save Alert Settings
          </button>
        </div>
      </div>
    </div>
  );
}
