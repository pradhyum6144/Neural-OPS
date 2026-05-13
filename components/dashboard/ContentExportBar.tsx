"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileDown, Table, Sparkles, Video, X, Copy, Check,
  Download, Camera, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { AgentReport, AgentState, MetricState } from "@/hooks/use-dashboard";

// ── Types ──────────────────────────────────────────────────────────────────────

type ModalId = "infographic" | "instagram" | "video" | null;

interface InstagramData { caption: string; hashtags: string[]; cta: string }
interface VideoPoint { timestamp: string; title: string; script: string }
interface VideoData { hook: string; points: VideoPoint[]; cta: string }

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildContentSummary(reports: AgentReport[]): string {
  return reports
    .map(r => {
      if (r.agentId === "summary") {
        try {
          const m = r.output.match(/\{[\s\S]*\}/);
          if (m) {
            const p = JSON.parse(m[0]) as { title?: string; keyFindings?: string[]; recommendation?: string };
            return [
              `Summary Agent — ${p.title ?? ""}`,
              ...(p.keyFindings?.map(f => `• ${f}`) ?? []),
              p.recommendation ? `Recommendation: ${p.recommendation}` : "",
            ].filter(Boolean).join("\n");
          }
        } catch { /* fall through */ }
      }
      return `${r.agentName}: ${r.output.slice(0, 400)}`;
    })
    .join("\n\n");
}

async function generatePDF(
  reports: AgentReport[],
  agents: AgentState[],
  command: string,
  metrics: MetricState,
  costThisRun: number | null,
  modelUsed: string | null,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;
  const M = 18;
  const CW = PW - M * 2;
  let y = 0;

  const newPage = () => { doc.addPage(); y = 18; };
  const guard = (need: number) => { if (y + need > 272) newPage(); };

  // ── Dark header band ──
  doc.setFillColor(12, 12, 28);
  doc.rect(0, 0, PW, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(224, 224, 255);
  doc.text("Neural OPS", M, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 160);
  doc.text("PIPELINE ANALYSIS REPORT", M, 21);
  doc.text(new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }), PW - M, 14, { align: "right" });

  y = 42;

  // ── Command ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(99, 102, 180);
  doc.text("COMMAND", M, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 90);
  const cmdLines = doc.splitTextToSize(command || "(no command)", CW);
  doc.text(cmdLines as string[], M, y);
  y += (cmdLines as string[]).length * 5 + 10;

  doc.setDrawColor(210, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(M, y - 4, PW - M, y - 4);

  // ── Agent breakdown ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(99, 102, 180);
  doc.text("AGENT BREAKDOWN", M, y);
  y += 7;

  for (const report of reports) {
    guard(25);
    const agent = agents.find(a => a.id === report.agentId);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 90);
    doc.text(report.agentName, M, y);

    if (agent?.tokens) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 170);
      doc.text(`${agent.tokens.toLocaleString()} tokens`, PW - M, y, { align: "right" });
    }
    y += 5;

    let outputText = report.output;
    if (report.agentId === "summary") {
      try {
        const m = outputText.match(/\{[\s\S]*\}/);
        if (m) {
          const p = JSON.parse(m[0]) as { title?: string; keyFindings?: string[]; recommendation?: string; confidence?: number };
          outputText = [
            p.title ? `${p.title}` : "",
            ...(p.keyFindings?.map(f => `* ${f}`) ?? []),
            p.recommendation ? `Recommendation: ${p.recommendation}` : "",
            p.confidence !== undefined ? `Confidence: ${p.confidence}%` : "",
          ].filter(Boolean).join("\n");
        }
      } catch { /* use raw */ }
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 130);
    const lines = doc.splitTextToSize(outputText || "(no output)", CW) as string[];
    const cap = Math.min(lines.length, 10);
    const display = lines.slice(0, cap);
    if (lines.length > cap) display.push("...(truncated)");

    guard(display.length * 4.5 + 10);
    doc.text(display, M, y);
    y += display.length * 4.5 + 8;

    doc.setDrawColor(230, 230, 242);
    doc.setLineWidth(0.2);
    doc.line(M, y - 3, PW - M, y - 3);
    y += 3;
  }

  // ── Metrics ──
  guard(38);
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(99, 102, 180);
  doc.text("METRICS", M, y);
  y += 7;

  const rows: [string, string][] = [
    ["Total Tokens", metrics.tokens.toLocaleString()],
    ["Estimated Cost", costThisRun != null ? `Rs. ${costThisRun.toFixed(4)}` : "N/A"],
    ["Model Used", modelUsed ?? "Default"],
    ["Latency", `${metrics.latency} ms`],
    ["Retries", String(metrics.retries)],
  ];

  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 140);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 100);
    doc.text(value, M + 55, y);
    y += 6;
  }

  // ── Footer ──
  const footerY = 288;
  doc.setDrawColor(210, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(M, footerY - 5, PW - M, footerY - 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 200);
  doc.text("Generated by Neural OPS", M, footerY);
  doc.text(`neural-ops.ai  |  ${new Date().toLocaleDateString("en-IN")}`, PW - M, footerY, { align: "right" });

  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`neural-ops-report-${dateStr}.pdf`);
}

function generateCSV(reports: AgentReport[], agents: AgentState[], metrics: MetricState, costThisRun: number | null) {
  const totalTokens = agents.reduce((s, a) => s + a.tokens, 0) || 1;
  const header = ["Agent", "Status", "Tokens", "Cost (Rs.)", "Output Preview (100 chars)", "Duration (ms)"];

  const rows = agents.map(agent => {
    const report = reports.find(r => r.agentId === agent.id);
    const agentCost = costThisRun != null
      ? ((agent.tokens / totalTokens) * costThisRun).toFixed(5)
      : "N/A";
    const preview = (report?.output ?? "").replace(/[\n\r"]/g, " ").slice(0, 100);
    return [agent.name, agent.status, agent.tokens, agentCost, preview, agent.durationMs ?? 0];
  });

  // totals row
  rows.push(["TOTAL", "", metrics.tokens, costThisRun != null ? costThisRun.toFixed(5) : "N/A", "", ""]);

  const csv = [header, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neural-ops-agents-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── ModalShell ─────────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <motion.div
        key="bd"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="fixed inset-x-4 top-16 bottom-8 z-50 mx-auto max-w-xl overflow-hidden rounded-2xl
                   border border-[rgba(99,102,241,0.25)] bg-[rgba(12,12,22,0.97)]
                   shadow-[0_0_60px_rgba(99,102,241,0.12)] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(99,102,241,0.1)]">
          <span className="text-sm font-semibold text-[#c0c0e0]">{title}</span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[rgba(99,102,241,0.1)] transition-colors"
          >
            <X size={13} className="text-[#6060a0]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </>
  );
}

// ── InfographicModal ───────────────────────────────────────────────────────────

const INFOGRAPHIC_STEPS = ["Analyzing pipeline output…", "Designing layout…", "Rendering…"];

function InfographicModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setDone(true), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <ModalShell title="🎨 Make Infographic" onClose={onClose}>
      <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-[320px]">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5"
            >
              {/* Animated rings */}
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[rgba(99,102,241,0.15)] animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-[rgba(99,102,241,0.2)] animate-ping"
                     style={{ animationDelay: "0.3s" }} />
                <div className="h-10 w-10 rounded-full bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)]
                                flex items-center justify-center">
                  <Sparkles size={18} className="text-[#6366f1]" />
                </div>
              </div>

              {/* Step progress */}
              <div className="flex flex-col items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="text-sm font-mono text-[#8080b0]"
                  >
                    {INFOGRAPHIC_STEPS[step]}
                  </motion.p>
                </AnimatePresence>
                <div className="flex gap-1.5 mt-1">
                  {INFOGRAPHIC_STEPS.map((_, i) => (
                    <div key={i}
                         className={`h-1 rounded-full transition-all duration-500 ${
                           i <= step ? "w-8 bg-[#6366f1]" : "w-4 bg-[rgba(99,102,241,0.15)]"
                         }`} />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5 w-full"
            >
              {/* Placeholder infographic card */}
              <div className="w-full max-w-xs rounded-2xl border border-[rgba(99,102,241,0.25)]
                              bg-[rgba(99,102,241,0.06)] overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#22d3a5]" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#6366f1]">⬡</span>
                    <span className="text-[11px] font-semibold text-[#6060a0] uppercase tracking-wider">Neural OPS Report</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["Research", "Finance", "Browser", "Summary"].map(l => (
                      <div key={l} className="rounded-lg bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.12)] px-3 py-2">
                        <div className="text-[8px] text-[#4a4a6a] uppercase tracking-wider">{l}</div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-[rgba(99,102,241,0.1)]">
                          <div className="h-full rounded-full bg-[#6366f1] opacity-60"
                               style={{ width: `${40 + Math.random() * 50}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-[rgba(99,102,241,0.1)]" />
                  <div className="text-[9px] font-mono text-[#3a3a5a] text-center">
                    Generated by Neural OPS
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#22d3a5]">✅ Your infographic is ready!</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => toast.info("Full DASHVERSE API integration coming soon!")}
                  className="flex items-center gap-2 rounded-xl border border-[rgba(99,102,241,0.25)]
                             bg-[rgba(99,102,241,0.08)] px-4 py-2.5 text-[11px] font-semibold text-[#8080d0]
                             hover:bg-[rgba(99,102,241,0.14)] transition-all"
                >
                  <Download size={12} />
                  Download PNG
                </button>
                <button
                  onClick={() => toast.info("Full DASHVERSE API integration coming soon!")}
                  className="flex items-center gap-2 rounded-xl border border-[rgba(99,102,241,0.15)]
                             px-4 py-2.5 text-[11px] font-semibold text-[#5050a0]
                             hover:bg-[rgba(99,102,241,0.06)] transition-all"
                >
                  <Copy size={12} />
                  Copy to clipboard
                </button>
              </div>

              <p className="text-[10px] text-[#3a3a5a] font-mono">Powered by DASHVERSE</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalShell>
  );
}

// ── InstagramModal ─────────────────────────────────────────────────────────────

function InstagramModal({ reports, onClose }: { reports: AgentReport[]; onClose: () => void }) {
  const [data, setData] = useState<InstagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"caption" | "hashtags" | null>(null);

  useEffect(() => {
    const content = buildContentSummary(reports);
    fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "instagram", content }),
    })
      .then(r => r.json())
      .then((d: InstagramData) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to generate post. Try again."); setLoading(false); });
  }, [reports]);

  const copy = useCallback((text: string, type: "caption" | "hashtags") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  return (
    <ModalShell title="📱 Instagram Post" onClose={onClose}>
      <div className="p-5">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 size={28} className="text-[#6366f1] animate-spin" />
            <p className="text-sm font-mono text-[#5050a0]">Crafting your post…</p>
          </div>
        )}
        {error && (
          <div className="py-8 text-center text-sm text-[#f43f5e] font-mono">{error}</div>
        )}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5"
          >
            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="w-64 rounded-[2rem] border-[3px] border-[#1a1a2e] bg-[#0d0d1a] shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="flex justify-center pt-2 pb-1 bg-[#0d0d1a]">
                  <div className="w-16 h-4 rounded-full bg-[#0d0d1a] border border-[#1a1a2e]" />
                </div>

                {/* Instagram post card */}
                <div className="bg-white mx-2 mb-2 rounded-xl overflow-hidden shadow-lg">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white text-[9px] font-bold">
                      N
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-900 leading-none">neural_ops</p>
                      <p className="text-[8px] text-gray-400">Sponsored</p>
                    </div>
                    <span className="ml-auto text-gray-300 text-xs">•••</span>
                  </div>

                  {/* Image area (gradient placeholder) */}
                  <div className="aspect-square bg-gradient-to-br from-indigo-900 via-purple-900 to-[#0a0a1f]
                                  flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-indigo-400 opacity-70">⬡</span>
                    <span className="text-[9px] font-mono text-indigo-300 opacity-50 uppercase tracking-widest">Neural OPS</span>
                  </div>

                  {/* Engagement row */}
                  <div className="flex items-center gap-3 px-3 py-2 text-gray-600">
                    <span className="text-base">♥</span>
                    <span className="text-base">💬</span>
                    <span className="text-base">↗</span>
                    <span className="ml-auto text-base">🔖</span>
                  </div>

                  {/* Likes */}
                  <div className="px-3">
                    <p className="text-[9px] font-bold text-gray-900">2,847 likes</p>
                  </div>

                  {/* Caption */}
                  <div className="px-3 pt-1 pb-3">
                    <p className="text-[9px] text-gray-800 leading-relaxed">
                      <span className="font-bold">neural_ops </span>
                      {data.caption}
                    </p>
                    <p className="text-[8px] text-blue-500 mt-1 leading-relaxed">
                      {data.hashtags.slice(0, 6).join(" ")}
                    </p>
                    <p className="text-[9px] text-gray-700 font-semibold mt-1">{data.cta}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full text sections with copy buttons */}
            <div className="rounded-xl border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.04)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider">Caption</span>
                <button
                  onClick={() => copy(data.caption + "\n\n" + data.cta, "caption")}
                  className="flex items-center gap-1 rounded-lg border border-[rgba(99,102,241,0.2)]
                             px-2.5 py-1 text-[10px] font-semibold text-[#6366f1]
                             hover:bg-[rgba(99,102,241,0.1)] transition-colors"
                >
                  {copied === "caption" ? <Check size={10} className="text-[#22d3a5]" /> : <Copy size={10} />}
                  {copied === "caption" ? "Copied!" : "Copy caption"}
                </button>
              </div>
              <p className="text-[11px] font-mono text-[#9090b0] leading-relaxed whitespace-pre-line">{data.caption}</p>
              <p className="text-[11px] font-semibold text-[#8080c0] mt-2">{data.cta}</p>
            </div>

            <div className="rounded-xl border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.04)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider">Hashtags</span>
                <button
                  onClick={() => copy(data.hashtags.join(" "), "hashtags")}
                  className="flex items-center gap-1 rounded-lg border border-[rgba(99,102,241,0.2)]
                             px-2.5 py-1 text-[10px] font-semibold text-[#6366f1]
                             hover:bg-[rgba(99,102,241,0.1)] transition-colors"
                >
                  {copied === "hashtags" ? <Check size={10} className="text-[#22d3a5]" /> : <Copy size={10} />}
                  {copied === "hashtags" ? "Copied!" : "Copy hashtags"}
                </button>
              </div>
              <p className="text-[11px] font-mono text-blue-400 leading-relaxed">{data.hashtags.join(" ")}</p>
            </div>
          </motion.div>
        )}
      </div>
    </ModalShell>
  );
}

// ── VideoScriptModal ───────────────────────────────────────────────────────────

function VideoScriptModal({ reports, onClose }: { reports: AgentReport[]; onClose: () => void }) {
  const [data, setData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const content = buildContentSummary(reports);
    fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "video_script", content }),
    })
      .then(r => r.json())
      .then((d: VideoData) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to generate script. Try again."); setLoading(false); });
  }, [reports]);

  const buildScriptText = useCallback(() => {
    if (!data) return "";
    const lines = [
      "NEURAL OPS — VIDEO SCRIPT",
      "=" .repeat(40),
      "",
      "[HOOK — 0:00 - 0:05]",
      data.hook,
      "",
      ...data.points.flatMap(p => [
        `[${p.title.toUpperCase()} — ${p.timestamp}]`,
        p.script,
        "",
      ]),
      "[CALL TO ACTION — Final 10s]",
      data.cta,
      "",
      "—",
      `Generated by Neural OPS on ${new Date().toLocaleDateString("en-IN")}`,
    ];
    return lines.join("\n");
  }, [data]);

  const handleCopy = useCallback(() => {
    const text = buildScriptText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [buildScriptText]);

  const handleDownload = useCallback(() => {
    const text = buildScriptText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neural-ops-script-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [buildScriptText]);

  return (
    <ModalShell title="▶️ Video Script" onClose={onClose}>
      <div className="p-5">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 size={28} className="text-[#6366f1] animate-spin" />
            <p className="text-sm font-mono text-[#5050a0]">Writing your script…</p>
          </div>
        )}
        {error && (
          <div className="py-8 text-center text-sm text-[#f43f5e] font-mono">{error}</div>
        )}
        {data && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            {/* Hook */}
            <ScriptSection
              label="HOOK"
              timestamp="0:00 – 0:05"
              color="#22d3a5"
              colorBg="rgba(34,211,165,0.08)"
              colorBorder="rgba(34,211,165,0.25)"
            >
              <p className="text-[12px] font-mono text-[#a0f0e0] leading-relaxed italic">&quot;{data.hook}&quot;</p>
            </ScriptSection>

            {/* Main points */}
            {data.points.map((p, i) => (
              <ScriptSection
                key={i}
                label={`POINT ${i + 1} — ${p.title}`}
                timestamp={p.timestamp}
                color="#6366f1"
                colorBg="rgba(99,102,241,0.06)"
                colorBorder="rgba(99,102,241,0.2)"
              >
                <p className="text-[11px] font-mono text-[#9090c0] leading-relaxed">{p.script}</p>
              </ScriptSection>
            ))}

            {/* CTA */}
            <ScriptSection
              label="CALL TO ACTION"
              timestamp="Final 10s"
              color="#f59e0b"
              colorBg="rgba(245,158,11,0.08)"
              colorBorder="rgba(245,158,11,0.25)"
            >
              <p className="text-[12px] font-mono text-[#fcd34d] leading-relaxed italic">&quot;{data.cta}&quot;</p>
            </ScriptSection>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(99,102,241,0.25)]
                           bg-[rgba(99,102,241,0.08)] py-2.5 text-[11px] font-semibold text-[#8080d0]
                           hover:bg-[rgba(99,102,241,0.14)] transition-all"
              >
                {copied ? <Check size={12} className="text-[#22d3a5]" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy script"}
              </button>
              <button
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(99,102,241,0.18)]
                           py-2.5 text-[11px] font-semibold text-[#5050a0]
                           hover:bg-[rgba(99,102,241,0.06)] transition-all"
              >
                <Download size={12} />
                Download .txt
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </ModalShell>
  );
}

function ScriptSection({
  label, timestamp, color, colorBg, colorBorder, children,
}: {
  label: string; timestamp: string; color: string; colorBg: string; colorBorder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4" style={{ background: colorBg, borderColor: colorBorder }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
        <span className="rounded-full border px-2 py-0.5 text-[9px] font-mono"
              style={{ color, borderColor: colorBorder }}>
          {timestamp}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── ContentExportBar ───────────────────────────────────────────────────────────

interface ContentExportBarProps {
  reports: AgentReport[];
  agents: AgentState[];
  command: string;
  metrics: MetricState;
  costThisRun: number | null;
  modelUsed: string | null;
}

const BUTTONS = [
  { id: "pdf",         label: "Export PDF",       icon: FileDown,    color: "#f43f5e" },
  { id: "csv",         label: "Export CSV",        icon: Table,       color: "#22d3a5" },
  { id: "infographic", label: "Make Infographic",  icon: Sparkles,    color: "#a855f7" },
  { id: "instagram",   label: "Instagram Post",    icon: Camera,      color: "#f97316" },
  { id: "video",       label: "Make Video Script", icon: Video,       color: "#6366f1" },
] as const;

export function ContentExportBar({
  reports, agents, command, metrics, costThisRun, modelUsed,
}: ContentExportBarProps) {
  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleClick = useCallback(async (id: string) => {
    if (id === "pdf") {
      setPdfLoading(true);
      try {
        await generatePDF(reports, agents, command, metrics, costThisRun, modelUsed);
        toast.success("PDF downloaded!");
      } catch {
        toast.error("PDF generation failed.");
      } finally {
        setPdfLoading(false);
      }
      return;
    }
    if (id === "csv") {
      generateCSV(reports, agents, metrics, costThisRun);
      toast.success("CSV downloaded!");
      return;
    }
    setActiveModal(id as ModalId);
  }, [reports, agents, command, metrics, costThisRun, modelUsed]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="mx-4 md:mx-6"
      >
        <div className="rounded-2xl border border-[rgba(99,102,241,0.14)] bg-[rgba(99,102,241,0.03)] px-4 py-3">
          <div className="flex items-center gap-1 mb-2.5">
            <span className="text-[9px] font-semibold text-[#4a4a6a] uppercase tracking-widest">
              Turn into content
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {BUTTONS.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => handleClick(id)}
                disabled={id === "pdf" && pdfLoading}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold
                           transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: `${color}33`,
                  color,
                  background: `${color}10`,
                }}
              >
                {id === "pdf" && pdfLoading
                  ? <Loader2 size={11} className="animate-spin" />
                  : <Icon size={11} />
                }
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {activeModal === "infographic" && (
          <InfographicModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === "instagram" && (
          <InstagramModal reports={reports} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === "video" && (
          <VideoScriptModal reports={reports} onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
