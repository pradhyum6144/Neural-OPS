"use client";

import { useState } from "react";
import { LayoutDashboard, GitBranch, Cpu, Database, Settings, Clock, X, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import type { HistoryEntry } from "@/hooks/use-workflow-history";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: GitBranch,       label: "Workflows",  href: "/dashboard/workflows" },
  { icon: Cpu,             label: "Agents",     href: "/dashboard/agents" },
  { icon: Database,        label: "Memory",     href: "/dashboard/memory" },
];

interface SidebarProps {
  history?: HistoryEntry[];
  onReplayHistory?: (command: string) => void;
  onClearHistory?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function HistoryPanel({
  history,
  onReplay,
  onClear,
  onClose,
}: {
  history: HistoryEntry[];
  onReplay: (command: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="absolute left-16 top-0 bottom-0 w-56 z-50
                 border-r border-[rgba(99,102,241,0.12)] bg-[rgba(10,10,18,0.98)]
                 backdrop-blur-xl flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[rgba(99,102,241,0.1)]">
        <span className="text-[11px] font-semibold text-[#8080b0] uppercase tracking-wider">Run History</span>
        <button onClick={onClose} className="text-[#4a4a6a] hover:text-[#9090b0] transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {history.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <Clock size={20} className="text-[#2a2a4a]" />
            <p className="text-[10px] font-mono text-[#2a2a4a] text-center">No runs yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onReplay(entry.command)}
                className="group w-full text-left rounded-lg p-2.5 border border-transparent
                           hover:border-[rgba(99,102,241,0.2)] hover:bg-[rgba(99,102,241,0.06)]
                           transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] text-[#4a4a6a]">{entry.ts}</span>
                  <RotateCcw size={9} className="text-[#3a3a5a] group-hover:text-[#6366f1] transition-colors" />
                </div>
                <p className="font-mono text-[10px] text-[#8080a0] truncate leading-relaxed">
                  {entry.command}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-[#3a3a5a]">{entry.tokens.toLocaleString()} tkns</span>
                  <span className="text-[9px] text-[#3a3a5a]">·</span>
                  <span className="text-[9px] text-[#3a3a5a]">{entry.agentsCompleted} agents</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="p-2 border-t border-[rgba(99,102,241,0.08)]">
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5
                       text-[#f43f5e] hover:bg-[rgba(244,63,94,0.08)] transition-colors text-[10px]"
          >
            <Trash2 size={10} />
            Clear history
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function Sidebar({
  history = [],
  onReplayHistory,
  onClearHistory,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const path = usePathname();
  const [historyOpen, setHistoryOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <Link
        href="/"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl
                   bg-[#6366f1] text-white text-lg font-bold
                   shadow-[0_0_16px_rgba(99,102,241,0.4)]
                   hover:shadow-[0_0_24px_rgba(99,102,241,0.6)] transition-shadow"
      >
        ⬡
      </Link>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = path === href;
          return (
            <Link
              key={label}
              href={href}
              title={label}
              onClick={onMobileClose}
              className={clsx(
                "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150",
                active
                  ? "bg-[rgba(99,102,241,0.2)] text-[#6366f1]"
                  : "text-[#4a4a6a] hover:text-[#9090b0] hover:bg-[rgba(99,102,241,0.08)]"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)]"
                />
              )}
              <Icon size={18} className="relative z-10" />
            </Link>
          );
        })}

        {/* History button */}
        <button
          title="Run History"
          onClick={() => setHistoryOpen((o) => !o)}
          className={clsx(
            "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150",
            historyOpen
              ? "bg-[rgba(99,102,241,0.2)] text-[#6366f1]"
              : "text-[#4a4a6a] hover:text-[#9090b0] hover:bg-[rgba(99,102,241,0.08)]"
          )}
        >
          <Clock size={18} />
          {history.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#6366f1] text-[8px] font-bold text-white flex items-center justify-center">
              {history.length}
            </span>
          )}
        </button>
      </nav>

      {/* Bottom: settings */}
      <Link
        href="/dashboard/settings"
        title="Settings"
        className="flex h-10 w-10 items-center justify-center rounded-lg
                   text-[#4a4a6a] hover:text-[#9090b0] hover:bg-[rgba(99,102,241,0.08)]
                   transition-all duration-150"
      >
        <Settings size={18} />
      </Link>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:flex md:left-0 md:top-0 md:bottom-0 z-40 w-16 flex-col items-center
                        border-r border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,15,0.95)]
                        backdrop-blur-xl py-4 gap-2">
        {sidebarContent}

        {/* History panel */}
        <AnimatePresence>
          {historyOpen && (
            <HistoryPanel
              history={history}
              onReplay={(cmd) => { onReplayHistory?.(cmd); setHistoryOpen(false); }}
              onClear={() => { onClearHistory?.(); }}
              onClose={() => setHistoryOpen(false)}
            />
          )}
        </AnimatePresence>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-60 flex flex-col
                         border-r border-[rgba(99,102,241,0.15)] bg-[rgba(10,10,18,0.98)]
                         backdrop-blur-xl py-4 px-3 gap-2 md:hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl
                                           bg-[#6366f1] text-white text-lg font-bold">⬡</Link>
                <button onClick={onMobileClose} className="text-[#4a4a6a] hover:text-[#9090b0]">
                  <X size={18} />
                </button>
              </div>

              <nav className="flex flex-col gap-1 flex-1">
                {NAV.map(({ icon: Icon, label, href }) => {
                  const active = path === href;
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={onMobileClose}
                      className={clsx(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
                        active
                          ? "bg-[rgba(99,102,241,0.15)] text-[#6366f1]"
                          : "text-[#4a4a6a] hover:text-[#9090b0] hover:bg-[rgba(99,102,241,0.08)]"
                      )}
                    >
                      <Icon size={16} />
                      <span className="text-sm font-medium">{label}</span>
                    </Link>
                  );
                })}

                {/* History section in mobile */}
                {history.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold text-[#4a4a6a] uppercase tracking-wider px-3 mb-2">
                      Recent Runs
                    </p>
                    {history.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => { onReplayHistory?.(entry.command); onMobileClose?.(); }}
                        className="w-full text-left rounded-lg px-3 py-2 hover:bg-[rgba(99,102,241,0.08)] transition-colors"
                      >
                        <p className="font-mono text-[10px] text-[#8080a0] truncate">{entry.command}</p>
                        <span className="font-mono text-[9px] text-[#4a4a6a]">{entry.ts}</span>
                      </button>
                    ))}
                  </div>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
