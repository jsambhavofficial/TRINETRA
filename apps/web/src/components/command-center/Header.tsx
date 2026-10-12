"use client";

import React, { useEffect, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { Badge } from "@/components/ui/Badge";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  LogIn,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { AegisLogo } from "@/components/ui/AegisLogo";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    worldMode,
    setWorldMode,
    snapshot,
    candidates,
    isDrillRunning,
    runFullFlagshipDrill,
    resetFlagshipScenario,
    toggleVoiceModal,
  } = useWorldStore();
  const [utcTime, setUtcTime] = useState("");
  const [authUser, setAuthUser] = useState<any>(null);

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

  // Check current session from localStorage / backend
  useEffect(() => {
    try {
      const stored = localStorage.getItem("trinetra_user");
      if (stored) {
        setAuthUser(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("trinetra_user");
    localStorage.removeItem("trinetra_token");
    setAuthUser(null);
    router.push("/login");
  };

  const isCommandCenter = pathname === "/world" || pathname === "/";
  const isStatePortal = pathname === "/portal/state-leadership";
  const isDistrictPortal = pathname === "/portal/district-admin";
  const isDeptPortal = pathname === "/portal/department";
  const isFieldPortal = pathname === "/portal/field-officer" || pathname === "/field";
  const isCitizenPortal = pathname === "/portal/citizen" || pathname === "/report" || pathname === "/track";

  return (
    <header className="h-14 min-h-[56px] border-b border-surface-border bg-surface-base/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 gap-2 overflow-x-hidden">
      {/* Brand & TRINETRA Portal Navigation Tabs */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <AegisLogo />

        <div className="h-6 w-px bg-surface-border hidden sm:block" />

        {/* Dedicated Navigation Tabs */}
        <nav className="flex items-center gap-1">
          <Link
            href="/world"
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isCommandCenter
                ? "bg-sky-600/20 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xl:inline">3D Spatial Twin</span>
            <span className="xl:hidden">Twin</span>
          </Link>

          <Link
            href="/portal/state-leadership"
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isStatePortal
                ? "bg-sky-600/20 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">State Leadership</span>
            <span className="xl:hidden">State</span>
          </Link>

          <Link
            href="/portal/district-admin"
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isDistrictPortal
                ? "bg-sky-600/20 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">District Admin</span>
            <span className="xl:hidden">District</span>
          </Link>

          <Link
            href="/portal/department"
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isDeptPortal
                ? "bg-sky-600/20 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Department</span>
            <span className="xl:hidden">Dept</span>
          </Link>

          <Link
            href="/portal/field-officer"
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isFieldPortal
                ? "bg-sky-600/20 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Field Ops</span>
            <span className="xl:hidden">Field</span>
          </Link>

          <Link
            href="/portal/citizen"
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isCitizenPortal
                ? "bg-sky-600/20 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xl:inline">Citizen Portal</span>
            <span className="xl:hidden">Citizen</span>
          </Link>
        </nav>
      </div>

      {/* Mode Switcher & Operational Telemetry (Center) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Environment Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-700/80 text-[10px] text-slate-300 mono-telemetry">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>HARYANA [DEV PROTOTYPE]</span>
        </div>

        {/* UTC Clock */}
        <div className="hidden 2xl:flex items-center gap-1.5 text-slate-400 text-xs font-mono px-2 py-1 rounded bg-slate-900/60 border border-slate-800">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>{utcTime || "UTC CLOCK"}</span>
        </div>
      </div>

      {/* Right Controls & Auth Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Voice Ops Button */}
        <button
          onClick={() => toggleVoiceModal(true)}
          title="Open Voice Command Center"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400 hover:bg-sky-500/30 text-sky-200 text-xs font-bold font-mono tracking-wider transition-all"
        >
          <Mic className="w-3.5 h-3.5 text-sky-300" />
          <span className="hidden sm:inline">VOICE</span>
        </button>

        <div className="h-5 w-px bg-surface-border hidden sm:block" />

        {/* Authenticated Profile / Logout */}
        {authUser ? (
          <div className="flex items-center gap-2 glass-panel px-2.5 py-1 rounded border border-slate-700/60">
            <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 text-[10px] font-bold">
              {authUser.display_name ? authUser.display_name.slice(0, 2).toUpperCase() : "U"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[11px] font-semibold text-slate-200 leading-tight">
                {authUser.display_name}
              </span>
              <span className="text-[9px] text-sky-400 mono-telemetry leading-tight">
                {authUser.role} {authUser.district_id ? `(${authUser.district_id})` : ""}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Secure Logout"
              className="ml-1 p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-[0_0_10px_rgba(2,132,199,0.3)]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};
