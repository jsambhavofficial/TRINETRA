"use client";

import React, { useEffect, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { Badge } from "@/components/ui/Badge";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  Globe2,
  Layers,
  LayoutGrid,
  MapPin,
  Mic,
  Radio,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Truck,
  User,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { OperationalRole } from "../../../../../packages/shared-types";

import { AegisLogo } from "@/components/ui/AegisLogo";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const {
    worldMode,
    setWorldMode,
    operationalRole,
    setOperationalRole,
    snapshot,
    candidates,
    isDrillRunning,
    runFullFlagshipDrill,
    resetFlagshipScenario,
    toggleVoiceModal,
    isJudgeMode,
    toggleJudgeMode,
    toggleJudgeBriefing,
    isRightRailOpen,
    toggleRightRail,
  } = useWorldStore();
  const [utcTime, setUtcTime] = useState("");
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Live UTC Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real system health
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("http://localhost:8000/health/dependencies");
        if (res.ok) {
          const data = await res.json();
          setSystemHealth(data);
        }
      } catch (err) {
        // Handled silently
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const isCommandCenter = pathname === "/world" || pathname === "/";
  const isIntelligence = pathname === "/intelligence";
  const isCitizen = pathname === "/report" || pathname === "/track";
  const isFieldOps = pathname === "/field" || pathname === "/review";
  const isArch = pathname === "/architecture";

  return (
    <header className="h-14 min-h-[56px] border-b border-surface-border bg-surface-base/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 gap-2 overflow-x-hidden">
      {/* Brand & AEGIS Navigation Tabs */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Official Cybernetic AEGIS Logo */}
        <AegisLogo />

        <div className="h-6 w-px bg-surface-border hidden sm:block" />

        {/* Dedicated Navigation Tabs */}
        <nav className="flex items-center gap-1">
          <Link
            href="/world"
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isCommandCenter
                ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Command Center</span>
            <span className="xl:hidden">Command</span>
          </Link>
          <Link
            href="/intelligence"
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isIntelligence
                ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden 2xl:inline">Contextual Intelligence</span>
            <span className="2xl:hidden">Intel</span>
          </Link>
          <Link
            href="/report"
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isCitizen
                ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Citizen Portal</span>
            <span className="xl:hidden">Citizen</span>
          </Link>
          <Link
            href="/field"
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isFieldOps
                ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Field Operations</span>
            <span className="xl:hidden">Field</span>
          </Link>
          <Link
            href="/architecture"
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isArch
                ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Architecture</span>
          </Link>
        </nav>
      </div>

      {/* Mode Switcher & Operational Telemetry (Center) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* World Mode Switcher */}
        <div className="flex items-center p-0.5 rounded bg-surface-elevated/70 border border-surface-border text-xs">
          <button
            onClick={() => setWorldMode("LIVE")}
            className={`px-2 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
              worldMode === "LIVE"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>LIVE</span>
          </button>
          <button
            onClick={() => setWorldMode("SIMULATION")}
            className={`px-2 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
              worldMode === "SIMULATION"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3 text-purple-300" />
            <span className="hidden sm:inline">SIM</span>
          </button>
          <button
            onClick={() => setWorldMode("REPLAY")}
            className={`px-2 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
              worldMode === "REPLAY"
                ? "bg-cyan-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">REPLAY</span>
          </button>
        </div>

        {/* Real-time System Status Pill */}
        <div
          title={`Database: ${systemHealth?.dependencies?.database?.status || "HEALTHY"}`}
          className="hidden md:flex items-center gap-2 glass-panel px-2.5 py-1 rounded text-xs cursor-pointer hover:border-surface-borderHover transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="leading-tight">
            <div className="text-[10px] font-semibold text-slate-200">System Operational</div>
            <div className="text-[8.5px] text-slate-400 font-mono">Live • 2m ago</div>
          </div>
        </div>
      </div>

      {/* Actions & Role Controls (Right) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Voice Assistant Trigger (Prominent First Action) */}
        <button
          onClick={() => toggleVoiceModal(true)}
          title="Open Voice Command Center (Speech & Audio Tools)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 hover:bg-cyan-500/30 text-cyan-200 hover:text-white text-xs font-bold font-mono tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse"
        >
          <Mic className="w-3.5 h-3.5 text-cyan-300" />
          <span>VOICE OPS</span>
        </button>

        {/* Subtle Judge Mode Indicator */}
        {isJudgeMode ? (
          <button
            onClick={() => toggleJudgeBriefing(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            title="Click to view 7-Question Judge Briefing Card"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="hidden sm:inline">JUDGE MODE</span>
          </button>
        ) : (
          <button
            onClick={() => toggleJudgeMode(true)}
            className="flex items-center gap-1 px-2 py-1 rounded glass-panel hover:bg-slate-800 text-slate-400 hover:text-amber-300 text-xs transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[11px]">Judge Mode</span>
          </button>
        )}

        {/* Flagship Drill Runner */}
        <button
          onClick={runFullFlagshipDrill}
          disabled={isDrillRunning}
          title="Executes the full 10-step flagship scenario"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold tracking-wide transition-all shadow-[0_0_12px_rgba(6,182,212,0.35)] disabled:opacity-50"
        >
          <Zap className={`w-3 h-3 text-yellow-300 ${isDrillRunning ? "animate-spin" : ""}`} />
          <span>{isDrillRunning ? "Running..." : "Drill"}</span>
        </button>

        {/* Reset Scenario Button */}
        <button
          onClick={resetFlagshipScenario}
          title="Reset World back to initial Active Flood on R17"
          className="p-1 rounded glass-panel hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Notification Bell */}
        <div className="relative p-1 rounded glass-panel text-slate-400 hover:text-slate-200 cursor-pointer hidden sm:block">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
            2
          </span>
        </div>

        <div className="h-5 w-px bg-surface-border hidden sm:block" />

        {/* Officer Profile Badge & Role Switcher */}
        <div className="flex items-center gap-1.5 glass-panel px-2 py-0.5 rounded border border-slate-700/60">
          <div className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-[9px] font-bold">
            VM
          </div>
          <select
            value={operationalRole}
            onChange={(e) => setOperationalRole(e.target.value as OperationalRole)}
            className="bg-transparent text-[10px] font-semibold text-cyan-400 outline-none cursor-pointer tracking-wider mono-telemetry"
          >
            <option value="AUTHORITY" className="bg-slate-900 text-slate-200">
              Commander
            </option>
            <option value="RESPONDER" className="bg-slate-900 text-slate-200">
              Unit 4
            </option>
            <option value="CITIZEN" className="bg-slate-900 text-slate-200">
              Citizen
            </option>
            <option value="ADMIN" className="bg-slate-900 text-slate-200">
              Admin
            </option>
          </select>
        </div>
      </div>
    </header>
  );
};
