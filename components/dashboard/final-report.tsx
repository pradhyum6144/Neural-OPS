"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, CheckCircle, Brain, Search, Monitor, TrendingUp, Mic, Download } from "lucide-react";
import type { AgentReport } from "@/hooks/use-dashboard";

const AGENT_ICONS: Record<string, React.ElementType> = {
  planner: Brain,
  research: Search,
  browser: Monitor,
  finance: TrendingUp,
  voice: Mic,
  summary: FileText,
};

function ReportCard({ report, index }: { report: AgentReport; index: number }) {
  const Icon = AGENT_ICONS[report.agentId] ?? FileText;
  const isError = report.output.startsWith("[Error]");

  interface SummaryData { title?: string; keyFindings?: string[]; recommendation?: string; confidence?: number }
  let parsed: SummaryData | null = null;
  if (report.agentId === "summary") {
    try {
      const jsonMatch = report.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]) as SummaryData;
    } catch {
      // not valid JSON
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="rounded-xl border border-[rgba(99,102,241,0.15)] bg-[rgba(10,10,20,0.7)] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)]">
          <Icon size={13} className="text-[#6366f1]" />
        </div>
        <span className="text-xs font-semibold text-[#c0c0e0]">{report.agentName}</span>
        {!isError && <CheckCircle size={11} className="text-[#22d3a5] ml-auto" />}
      </div>

      {parsed ? (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] font-bold text-[#a0a0ff]">{parsed.title ?? ""}</p>
          {Array.isArray(parsed.keyFindings) && (
            <ul className="flex flex-col gap-1">
              {parsed.keyFindings.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#6366f1] mt-0.5">·</span>
                  <span className="font-mono text-[10px] text-[#8080a0]">{f}</span>
                </li>
              ))}
            </ul>
          )}
          {parsed.recommendation && (
            <div className="mt-1 rounded-lg bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] px-3 py-2">
              <span className="font-mono text-[10px] text-[#6366f1] font-semibold">Recommendation: </span>
              <span className="font-mono text-[10px] text-[#9090b0]">{parsed.recommendation}</span>
            </div>
          )}
          {parsed.confidence !== undefined && (
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[9px] text-[#4a4a6a]">Confidence</span>
              <div className="flex-1 h-1 rounded-full bg-[rgba(99,102,241,0.08)]">
                <div
                  className="h-full rounded-full bg-[#22d3a5]"
                  style={{ width: `${parsed.confidence}%` }}
                />
              </div>
              <span className="font-mono text-[9px] text-[#22d3a5]">{parsed.confidence}%</span>
            </div>
          )}
        </div>
      ) : (
        <p className={`font-mono text-[10px] leading-relaxed line-clamp-4 ${isError ? "text-[#f43f5e]" : "text-[#7070a0]"}`}>
          {report.output || "No output"}
        </p>
      )}
    </motion.div>
  );
}

interface FinalReportProps {
  reports: AgentReport[];
  open: boolean;
  onClose: () => void;
  onExport?: () => void;
}

export function FinalReport({ reports, open, onClose, onExport }: FinalReportProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed inset-x-4 top-12 bottom-8 z-50 mx-auto max-w-2xl overflow-hidden rounded-2xl
                       border border-[rgba(99,102,241,0.25)] bg-[rgba(12,12,22,0.97)]
                       shadow-[0_0_60px_rgba(99,102,241,0.12)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(99,102,241,0.1)]">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#6366f1]" />
                <span className="text-sm font-semibold text-[#c0c0e0]">Final Report</span>
                <span className="nos-badge-success text-[9px] ml-1">{reports.length} agents</span>
              </div>
              <div className="flex items-center gap-2">
                {onExport && (
                  <button
                    onClick={onExport}
                    className="flex items-center gap-1.5 rounded-lg border border-[rgba(99,102,241,0.2)]
                               px-2.5 py-1 text-[10px] font-semibold text-[#6366f1]
                               hover:bg-[rgba(99,102,241,0.1)] transition-colors"
                  >
                    <Download size={11} />
                    .md
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg
                             hover:bg-[rgba(99,102,241,0.1)] transition-colors"
                >
                  <X size={13} className="text-[#6060a0]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {reports.map((r, i) => (
                <ReportCard key={r.agentId} report={r} index={i} />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
