"use client";

import { LayoutDashboard, GitBranch, Cpu, Database, Settings, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { motion } from "framer-motion";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: GitBranch,       label: "Workflows",  href: "/dashboard/workflows" },
  { icon: Cpu,             label: "Agents",     href: "/dashboard/agents" },
  { icon: Database,        label: "Memory",     href: "/dashboard/memory" },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-16 flex-col items-center
                      border-r border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,15,0.95)]
                      backdrop-blur-xl py-4 gap-2">
      {/* Logo */}
      <Link href="/" className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl
                                 bg-[#6366f1] text-white text-lg font-bold
                                 shadow-[0_0_16px_rgba(99,102,241,0.4)]
                                 hover:shadow-[0_0_24px_rgba(99,102,241,0.6)] transition-shadow">
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
    </aside>
  );
}
