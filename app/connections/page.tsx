"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Search, X, Check, ExternalLink,
  Plug, AlertCircle, Loader2, ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";
import { Sidebar } from "@/components/dashboard/sidebar";

// ── Types ──────────────────────────────────────────────────────────────────

type AuthType = "api_key" | "oauth";
type Category = "All" | "CRM" | "Finance" | "Productivity" | "Dev Tools" | "Communication" | "Marketing";

interface ToolDef {
  id: string;
  name: string;
  description: string;
  agentNote: string;          // shown when connected
  category: Category;
  authType: AuthType;
  color: string;              // accent hex
  bg: string;                 // card bg
  emoji: string;
  featured?: boolean;         // India tools section
  apiKeyLabel?: string;
  apiKeyHint?: string;
  oauthNote?: string;
}

// ── Tool catalogue ─────────────────────────────────────────────────────────

const TOOLS: ToolDef[] = [
  // ── Featured India tools ────────────────────────────────────────────────
  {
    id: "razorpay", name: "Razorpay", featured: true,
    description: "Your Finance Agent reads real sales data",
    agentNote: "Last 30 days revenue accessible",
    category: "Finance", authType: "api_key",
    color: "#3395FF", bg: "rgba(51,149,255,0.08)",
    emoji: "💳",
    apiKeyLabel: "Razorpay API Key",
    apiKeyHint: "rzp_live_xxxxxxxxxxxxxxxxxx",
  },
  {
    id: "whatsapp_business", name: "WhatsApp Business", featured: true,
    description: "Send pipeline results to WhatsApp",
    agentNote: "Agents can push summaries to your number",
    category: "Communication", authType: "api_key",
    color: "#25D366", bg: "rgba(37,211,102,0.08)",
    emoji: "💬",
    apiKeyLabel: "WhatsApp Business API Token",
    apiKeyHint: "EAAxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    id: "google_workspace", name: "Google Workspace", featured: true,
    description: "Read your Docs, Sheets, Gmail",
    agentNote: "Research Agent reads Drive files and emails",
    category: "Productivity", authType: "oauth",
    color: "#4285F4", bg: "rgba(66,133,244,0.08)",
    emoji: "🔵",
    oauthNote: "You'll authorize read access to Google Drive, Docs, Sheets, and Gmail.",
  },
  {
    id: "notion", name: "Notion", featured: true,
    description: "Read and write your Notion workspace",
    agentNote: "Agents can read pages and create new ones",
    category: "Productivity", authType: "oauth",
    color: "#ffffff", bg: "rgba(255,255,255,0.05)",
    emoji: "⬜",
    oauthNote: "You'll authorize access to your Notion pages and databases.",
  },
  {
    id: "slack", name: "Slack", featured: true,
    description: "Get pipeline results in Slack",
    agentNote: "Results posted to your chosen channel",
    category: "Communication", authType: "oauth",
    color: "#4A154B", bg: "rgba(74,21,75,0.15)",
    emoji: "⚡",
    oauthNote: "You'll authorize posting messages to your Slack workspace.",
  },
  {
    id: "github", name: "GitHub", featured: true,
    description: "Code Agent reads your repositories",
    agentNote: "Code Agent can search issues and PRs",
    category: "Dev Tools", authType: "oauth",
    color: "#c9d1d9", bg: "rgba(201,209,217,0.06)",
    emoji: "🐙",
    oauthNote: "You'll authorize read access to your GitHub repositories.",
  },

  // ── CRM ─────────────────────────────────────────────────────────────────
  { id: "salesforce", name: "Salesforce", description: "Connect your CRM data", agentNote: "CRM deals and contacts accessible", category: "CRM", authType: "oauth", color: "#00A1E0", bg: "rgba(0,161,224,0.08)", emoji: "☁️" },
  { id: "hubspot", name: "HubSpot", description: "Marketing and sales CRM", agentNote: "Lead and deal pipeline accessible", category: "CRM", authType: "oauth", color: "#FF7A59", bg: "rgba(255,122,89,0.08)", emoji: "🟠" },
  { id: "zoho_crm", name: "Zoho CRM", description: "Indian-made CRM platform", agentNote: "Zoho contacts and deals accessible", category: "CRM", authType: "oauth", color: "#E42527", bg: "rgba(228,37,39,0.08)", emoji: "🔴" },
  { id: "pipedrive", name: "Pipedrive", description: "Sales pipeline management", agentNote: "Pipedrive deals and activities accessible", category: "CRM", authType: "oauth", color: "#28B4E4", bg: "rgba(40,180,228,0.08)", emoji: "🔵" },
  { id: "freshdesk", name: "Freshdesk", description: "Customer support platform", agentNote: "Support tickets and resolutions accessible", category: "CRM", authType: "api_key", color: "#25C16F", bg: "rgba(37,193,111,0.08)", emoji: "🎫", apiKeyLabel: "Freshdesk API Key", apiKeyHint: "xxxxxxxxxxxxxxxxxxxxxxxxxx" },

  // ── Finance ──────────────────────────────────────────────────────────────
  { id: "stripe", name: "Stripe", description: "Payment processing data", agentNote: "Stripe revenue and charges accessible", category: "Finance", authType: "api_key", color: "#635BFF", bg: "rgba(99,91,255,0.08)", emoji: "💜", apiKeyLabel: "Stripe Secret Key", apiKeyHint: "sk_live_xxxxxxxxxxxxxx" },
  { id: "quickbooks", name: "QuickBooks", description: "Accounting and invoices", agentNote: "P&L and invoice data accessible", category: "Finance", authType: "oauth", color: "#2CA01C", bg: "rgba(44,160,28,0.08)", emoji: "📒" },
  { id: "tally", name: "Tally ERP", description: "India's #1 accounting software", agentNote: "Tally ledger entries accessible", category: "Finance", authType: "api_key", color: "#FF6B00", bg: "rgba(255,107,0,0.08)", emoji: "📊", apiKeyLabel: "Tally API Key", apiKeyHint: "tly_xxxxxxxxxxxxxx" },
  { id: "chargebee", name: "Chargebee", description: "Subscription billing", agentNote: "MRR and churn data accessible", category: "Finance", authType: "api_key", color: "#F66B2B", bg: "rgba(246,107,43,0.08)", emoji: "🔄", apiKeyLabel: "Chargebee API Key", apiKeyHint: "xxxxxxxxxxxxxx" },

  // ── Productivity ─────────────────────────────────────────────────────────
  { id: "asana", name: "Asana", description: "Project and task management", agentNote: "Task assignments and due dates accessible", category: "Productivity", authType: "oauth", color: "#F06A6A", bg: "rgba(240,106,106,0.08)", emoji: "✅" },
  { id: "jira", name: "Jira", description: "Engineering issue tracker", agentNote: "Sprint velocity and bug counts accessible", category: "Productivity", authType: "oauth", color: "#0052CC", bg: "rgba(0,82,204,0.08)", emoji: "🔷" },
  { id: "linear", name: "Linear", description: "Modern issue tracker", agentNote: "Linear issues and cycles accessible", category: "Productivity", authType: "api_key", color: "#5E6AD2", bg: "rgba(94,106,210,0.08)", emoji: "⚪", apiKeyLabel: "Linear API Key", apiKeyHint: "lin_api_xxxxxxxxxxxxxx" },
  { id: "monday", name: "Monday.com", description: "Work OS and project boards", agentNote: "Board items and timelines accessible", category: "Productivity", authType: "oauth", color: "#FF3750", bg: "rgba(255,55,80,0.08)", emoji: "🗓️" },
  { id: "trello", name: "Trello", description: "Kanban boards", agentNote: "Trello cards and boards accessible", category: "Productivity", authType: "oauth", color: "#0052CC", bg: "rgba(0,82,204,0.08)", emoji: "📋" },

  // ── Dev Tools ────────────────────────────────────────────────────────────
  { id: "gitlab", name: "GitLab", description: "DevOps platform", agentNote: "GitLab pipelines and MRs accessible", category: "Dev Tools", authType: "oauth", color: "#FC6D26", bg: "rgba(252,109,38,0.08)", emoji: "🦊" },
  { id: "vercel", name: "Vercel", description: "Deployment and analytics", agentNote: "Deployment logs and metrics accessible", category: "Dev Tools", authType: "api_key", color: "#ffffff", bg: "rgba(255,255,255,0.05)", emoji: "▲", apiKeyLabel: "Vercel API Token", apiKeyHint: "xxxxxxxxxxxxxxxxxxxxxx" },
  { id: "sentry", name: "Sentry", description: "Error monitoring", agentNote: "Errors, alerts, and performance data accessible", category: "Dev Tools", authType: "api_key", color: "#F55459", bg: "rgba(245,84,89,0.08)", emoji: "🚨", apiKeyLabel: "Sentry Auth Token", apiKeyHint: "xxxxxxxxxxxxxxxxxxxxxx" },
  { id: "postman", name: "Postman", description: "API testing platform", agentNote: "API collection data accessible", category: "Dev Tools", authType: "api_key", color: "#FF6C37", bg: "rgba(255,108,55,0.08)", emoji: "📬", apiKeyLabel: "Postman API Key", apiKeyHint: "PMAK-xxxxxxxx-xxxxxxxx" },

  // ── Communication ────────────────────────────────────────────────────────
  { id: "discord", name: "Discord", description: "Community and team chat", agentNote: "Results posted to Discord channels", category: "Communication", authType: "api_key", color: "#5865F2", bg: "rgba(88,101,242,0.08)", emoji: "🎮", apiKeyLabel: "Discord Webhook URL", apiKeyHint: "https://discord.com/api/webhooks/..." },
  { id: "telegram", name: "Telegram", description: "Secure messaging", agentNote: "Results sent via Telegram Bot", category: "Communication", authType: "api_key", color: "#0088CC", bg: "rgba(0,136,204,0.08)", emoji: "✈️", apiKeyLabel: "Telegram Bot Token", apiKeyHint: "12345678:ABCxxxxxxxxxxxxxxxxxxxxxx" },
  { id: "zoom", name: "Zoom", description: "Video meetings", agentNote: "Meeting summaries accessible", category: "Communication", authType: "oauth", color: "#2D8CFF", bg: "rgba(45,140,255,0.08)", emoji: "📹" },

  // ── Marketing ────────────────────────────────────────────────────────────
  { id: "mailchimp", name: "Mailchimp", description: "Email marketing", agentNote: "Campaign open rates and list data accessible", category: "Marketing", authType: "api_key", color: "#FFE01B", bg: "rgba(255,224,27,0.08)", emoji: "🐒", apiKeyLabel: "Mailchimp API Key", apiKeyHint: "xxxxxxxxxxxxxx-us21" },
  { id: "sendgrid", name: "Sendgrid", description: "Transactional email", agentNote: "Email delivery stats accessible", category: "Marketing", authType: "api_key", color: "#1A82E2", bg: "rgba(26,130,226,0.08)", emoji: "📧", apiKeyLabel: "Sendgrid API Key", apiKeyHint: "SG.xxxxxxxxxxxxxxxxxxxxxx" },
  { id: "meta_ads", name: "Meta Ads", description: "Facebook & Instagram ads", agentNote: "Ad spend and ROAS accessible", category: "Marketing", authType: "oauth", color: "#1877F2", bg: "rgba(24,119,242,0.08)", emoji: "📱" },
  { id: "brevo", name: "Brevo", description: "Marketing automation", agentNote: "Email and SMS campaign stats accessible", category: "Marketing", authType: "api_key", color: "#0B996E", bg: "rgba(11,153,110,0.08)", emoji: "🌿", apiKeyLabel: "Brevo API Key", apiKeyHint: "xkeysib-xxxxxxxxxxxxxxxxxx" },
];

const FEATURED = TOOLS.filter((t) => t.featured);
const CATEGORIES: Category[] = ["All", "CRM", "Finance", "Productivity", "Dev Tools", "Communication", "Marketing"];
const STORAGE_KEY = "nos_connections";

// ── localStorage helpers ───────────────────────────────────────────────────

function loadConnected(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

function saveConnected(s: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s))); } catch { /* noop */ }
}

// ── Sync to backend (fire-and-forget) ─────────────────────────────────────

function syncConnect(toolId: string, displayName: string, authType: string, apiKey?: string) {
  fetch("/api/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolName: toolId, displayName, toolType: authType, accessToken: apiKey }),
  }).catch(() => {});
}

function syncRevoke(toolId: string) {
  fetch("/api/connections", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolName: toolId }),
  }).catch(() => {});
}

// ── Logo badge ─────────────────────────────────────────────────────────────

function Logo({ tool, size = 40 }: { tool: ToolDef; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0 text-2xl font-bold select-none"
      style={{ width: size, height: size, background: tool.bg, border: `1px solid ${tool.color}22` }}
    >
      <span style={{ fontSize: size * 0.48 }}>{tool.emoji}</span>
    </div>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={clsx(
        "relative h-6 w-11 rounded-full border-2 transition-all duration-200 flex-shrink-0",
        on ? "bg-[#22d3a5] border-[#22d3a5]" : "bg-[rgba(99,102,241,0.08)] border-[rgba(99,102,241,0.2)]",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200",
          on ? "left-5" : "left-0.5"
        )}
      />
    </button>
  );
}

// ── Connect modal ──────────────────────────────────────────────────────────

interface ModalProps {
  tool: ToolDef;
  phase: "form" | "success";
  apiKey: string;
  saving: boolean;
  onApiKeyChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

function ConnectModal({ tool, phase, apiKey, saving, onApiKeyChange, onConfirm, onClose }: ModalProps) {
  return (
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="w-full max-w-md rounded-2xl border border-[rgba(99,102,241,0.25)]
                   bg-[rgba(12,12,22,0.98)] shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
      >
        {phase === "success" ? (
          <div className="flex flex-col items-center p-8 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(34,211,165,0.12)] border border-[rgba(34,211,165,0.3)]">
              <Check size={28} className="text-[#22d3a5]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#e0e0ff]">{tool.name} connected!</p>
              <p className="text-sm text-[#7070a0] mt-1">{tool.agentNote}</p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-[#22d3a5] px-8 py-2.5 text-sm font-semibold text-[#0a0a14] hover:bg-[#1cb890] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <Logo tool={tool} size={36} />
                <div>
                  <p className="font-bold text-[#e0e0ff]">Connect {tool.name}</p>
                  <p className="text-xs text-[#5050a0]">{tool.category}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#4a4a6a] hover:text-[#9090b0] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-4">
              {/* What you'll get */}
              <div className="rounded-xl bg-[rgba(34,211,165,0.04)] border border-[rgba(34,211,165,0.12)] p-3">
                <p className="text-[10px] font-semibold text-[#22d3a5] uppercase tracking-wider mb-2">What you'll get</p>
                <p className="text-sm text-[#c0c0e0]">{tool.description}</p>
                <p className="text-xs text-[#7070a0] mt-1.5 flex items-center gap-1.5">
                  <Check size={10} className="text-[#22d3a5] flex-shrink-0" />
                  {tool.agentNote}
                </p>
              </div>

              {/* Form */}
              {tool.authType === "api_key" ? (
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-[#8080b0] uppercase tracking-wider">
                    {tool.apiKeyLabel}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder={tool.apiKeyHint}
                    className="w-full rounded-xl border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,20,0.8)]
                               px-4 py-3 font-mono text-sm text-[#e0e0ff] placeholder:text-[#3a3a5a]
                               outline-none focus:border-[rgba(99,102,241,0.5)] transition-colors"
                    autoComplete="off"
                    autoFocus
                  />
                  <p className="text-[10px] text-[#4a4a6a]">
                    Your key is stored securely and never shared with third parties.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-[rgba(99,102,241,0.12)] bg-[rgba(99,102,241,0.04)] p-3">
                  <p className="text-sm text-[#9090b0]">{tool.oauthNote}</p>
                  <p className="text-[11px] text-[#5050a0] mt-1.5 flex items-center gap-1">
                    <ExternalLink size={9} />
                    You will be redirected to {tool.name} to authorize
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-[rgba(99,102,241,0.15)] py-2.5 text-sm
                             text-[#6060a0] hover:text-[#9090b0] hover:border-[rgba(99,102,241,0.3)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={saving || (tool.authType === "api_key" && !apiKey.trim())}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#6366f1]
                             py-2.5 text-sm font-semibold text-white hover:bg-indigo-500
                             disabled:opacity-40 disabled:cursor-not-allowed transition-all
                             shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : tool.authType === "oauth" ? (
                    <>Authorize <ExternalLink size={12} /></>
                  ) : (
                    "Connect →"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Featured India tool card ───────────────────────────────────────────────

function FeaturedCard({
  tool,
  connected,
  onToggle,
}: {
  tool: ToolDef;
  connected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      className={clsx(
        "relative rounded-2xl border p-4 flex items-start gap-4 transition-all duration-200",
        connected
          ? "border-[rgba(34,211,165,0.25)] bg-[rgba(34,211,165,0.03)]"
          : "border-[rgba(99,102,241,0.12)] bg-[rgba(10,10,20,0.5)] hover:border-[rgba(99,102,241,0.25)]"
      )}
    >
      <Logo tool={tool} size={44} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-[#e0e0ff] text-sm">{tool.name}</p>
          <Toggle on={connected} onChange={onToggle} />
        </div>
        <p className="text-xs text-[#7070a0] mt-0.5">{tool.description}</p>

        <AnimatePresence>
          {connected && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mt-2 text-[11px] text-[#22d3a5] flex items-center gap-1.5">
                <Check size={10} />
                {tool.agentNote}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Composio grid card ─────────────────────────────────────────────────────

function GridCard({
  tool,
  connected,
  onConnect,
  onRevoke,
}: {
  tool: ToolDef;
  connected: boolean;
  onConnect: () => void;
  onRevoke: () => void;
}) {
  return (
    <div
      className={clsx(
        "relative rounded-xl border p-3 flex flex-col items-center gap-2 text-center transition-all duration-150",
        connected
          ? "border-[rgba(34,211,165,0.2)] bg-[rgba(34,211,165,0.03)]"
          : "border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,20,0.4)] hover:border-[rgba(99,102,241,0.22)] hover:bg-[rgba(10,10,20,0.7)]"
      )}
    >
      {connected && (
        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(34,211,165,0.15)]">
          <Check size={8} className="text-[#22d3a5]" />
        </span>
      )}
      <Logo tool={tool} size={36} />
      <p className="text-[11px] font-semibold text-[#c0c0e0] leading-tight">{tool.name}</p>
      {connected ? (
        <button
          onClick={onRevoke}
          className="text-[9px] font-mono text-[#f43f5e] hover:text-[#ff6b6b] transition-colors"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          className="text-[9px] font-mono text-[#6366f1] hover:text-[#818cf8] transition-colors"
        >
          Connect →
        </button>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ tool: ToolDef; phase: "form" | "success" } | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");

  // Load from localStorage on mount
  useEffect(() => { setConnected(loadConnected()); }, []);

  // Persist whenever connected changes
  useEffect(() => { saveConnected(connected); }, [connected]);

  const openModal = useCallback((tool: ToolDef) => {
    setApiKey("");
    setModal({ tool, phase: "form" });
  }, []);

  const closeModal = useCallback(() => { setModal(null); setApiKey(""); }, []);

  const handleConnect = useCallback(async () => {
    if (!modal) return;
    setSaving(true);

    // Simulate brief save delay for UX
    await new Promise((r) => setTimeout(r, 600));

    setConnected((prev) => {
      const next = new Set(prev);
      next.add(modal.tool.id);
      saveConnected(next);
      return next;
    });
    syncConnect(modal.tool.id, modal.tool.name, modal.tool.authType, apiKey || undefined);
    setModal((m) => m ? { ...m, phase: "success" } : null);
    setSaving(false);
  }, [modal, apiKey]);

  const handleRevoke = useCallback((toolId: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      next.delete(toolId);
      saveConnected(next);
      return next;
    });
    syncRevoke(toolId);
  }, []);

  // For featured tools: toggle = open modal if connecting, revoke immediately if disconnecting
  const handleFeaturedToggle = useCallback((tool: ToolDef) => {
    if (connected.has(tool.id)) handleRevoke(tool.id);
    else openModal(tool);
  }, [connected, handleRevoke, openModal]);

  // Filter composio grid tools
  const gridTools = useMemo(() => {
    const base = TOOLS.filter((t) => !t.featured);
    const byCategory = category === "All" ? base : base.filter((t) => t.category === category);
    if (!search.trim()) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter((t) =>
      t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [search, category]);

  // Connected summary
  const connectedList = TOOLS.filter((t) => connected.has(t.id));

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-[#e0e0ff]">
      <Sidebar />

      <div className="flex flex-1 flex-col md:pl-16">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 md:px-8
                           border-b border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,15,0.9)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#4a4a6a] hidden sm:inline">Neural OPS</span>
            <ChevronRight size={13} className="text-[#2a2a3a] hidden sm:inline" />
            <span className="font-medium text-[#e0e0ff]">Connections</span>
          </div>
          {connectedList.length > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-[rgba(34,211,165,0.2)]
                            bg-[rgba(34,211,165,0.05)] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22d3a5]" />
              <span className="text-xs font-mono text-[#22d3a5]">
                {connectedList.length} connected
              </span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-10">

            {/* Page title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#e0e0ff]">Connect your tools</h1>
              <p className="mt-2 text-[#7070a0] text-sm md:text-base max-w-lg">
                Your agents get more powerful when they can read your real data.
                Connect once, and every pipeline run uses live information.
              </p>
            </div>

            {/* ── Section 1: India Tools ──────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider">India Stack</span>
                <span className="text-[9px] text-[#3a3a5a] font-mono border border-[rgba(99,102,241,0.2)] rounded px-1.5 py-0.5">
                  Most used
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FEATURED.map((tool) => (
                  <FeaturedCard
                    key={tool.id}
                    tool={tool}
                    connected={connected.has(tool.id)}
                    onToggle={() => handleFeaturedToggle(tool)}
                  />
                ))}
              </div>
            </section>

            {/* ── Section 2: All Composio Tools ──────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider">All Tools</span>
                <span className="text-[9px] text-[#3a3a5a] font-mono border border-[rgba(99,102,241,0.2)] rounded px-1.5 py-0.5">
                  150+ available
                </span>
              </div>

              {/* Search + category filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a6a]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search 150+ tools…"
                    className="w-full rounded-xl border border-[rgba(99,102,241,0.15)] bg-[rgba(10,10,20,0.7)]
                               pl-8 pr-4 py-2.5 text-sm text-[#e0e0ff] placeholder:text-[#3a3a5a]
                               outline-none focus:border-[rgba(99,102,241,0.4)] transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-[#9090b0]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={clsx(
                        "rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-all duration-150",
                        category === cat
                          ? "border-[rgba(99,102,241,0.4)] bg-[rgba(99,102,241,0.12)] text-[#a0a0ff]"
                          : "border-[rgba(99,102,241,0.1)] text-[#5050a0] hover:text-[#8080c0] hover:border-[rgba(99,102,241,0.2)]"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {gridTools.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {gridTools.map((tool) => (
                    <GridCard
                      key={tool.id}
                      tool={tool}
                      connected={connected.has(tool.id)}
                      onConnect={() => openModal(tool)}
                      onRevoke={() => handleRevoke(tool.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Search size={28} className="text-[#2a2a4a]" />
                  <p className="text-sm text-[#4a4a6a] font-mono">No tools match "{search}"</p>
                  <button onClick={() => setSearch("")} className="text-xs text-[#6366f1] hover:text-[#818cf8]">
                    Clear search
                  </button>
                </div>
              )}
            </section>

            {/* ── Section 3: Connected summary ────────────────────────── */}
            <AnimatePresence>
              {connectedList.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                >
                  <div className="rounded-2xl border border-[rgba(34,211,165,0.2)]
                                  bg-[rgba(34,211,165,0.03)] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Plug size={14} className="text-[#22d3a5]" />
                      <p className="font-semibold text-[#e0e0ff]">
                        You have {connectedList.length} tool{connectedList.length !== 1 ? "s" : ""} connected.{" "}
                        Your agents can now:
                      </p>
                    </div>

                    <ul className="flex flex-col gap-2">
                      {connectedList.map((tool) => (
                        <li key={tool.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <Logo tool={tool} size={24} />
                            <span className="text-sm text-[#c0c0e0]">
                              <span className="text-[#22d3a5] font-medium">{tool.agentNote}</span>
                              {" "}· {tool.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRevoke(tool.id)}
                            className="text-[10px] font-mono text-[#4a4a6a] hover:text-[#f43f5e] transition-colors flex-shrink-0"
                          >
                            Disconnect
                          </button>
                        </li>
                      ))}
                    </ul>

                    {/* Agent routing hint */}
                    <div className="mt-4 rounded-xl border border-[rgba(99,102,241,0.1)]
                                    bg-[rgba(99,102,241,0.04)] px-4 py-3">
                      <p className="text-[11px] font-mono text-[#5050a0]">
                        <span className="text-[#6366f1]">→</span>{" "}
                        Your next pipeline run will inject this context into every agent automatically.
                      </p>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {connectedList.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[rgba(99,102,241,0.12)]
                              bg-[rgba(99,102,241,0.02)] p-8 flex flex-col items-center gap-3">
                <AlertCircle size={24} className="text-[#3a3a5a]" />
                <p className="text-sm text-[#4a4a6a] text-center">
                  No tools connected yet. Toggle a tool above to get started.
                </p>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <ConnectModal
            tool={modal.tool}
            phase={modal.phase}
            apiKey={apiKey}
            saving={saving}
            onApiKeyChange={setApiKey}
            onConfirm={handleConnect}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
