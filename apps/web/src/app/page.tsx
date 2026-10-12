"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Users,
  Compass,
  FileText,
  Radio,
  ArrowRight,
  ExternalLink,
  MapPin,
  CheckCircle2,
  LogIn,
  Layers,
  Sparkles,
  PhoneCall,
  Activity,
  Award
} from "lucide-react";
import { AegisLogo } from "@/components/ui/AegisLogo";

export default function Home() {
  const [istTime, setIstTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " IST"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const portals = [
    {
      title: "State Leadership",
      hindi: "राज्य नेतृत्व",
      role: "CMO / Chief Secretary",
      desc: "Statewide intelligence, multi-district escalation tracking, macro resource balance, and high-level KPI dashboard.",
      href: "/portal/state-leadership",
      badge: "Level 1 • State Command",
      accent: "border-amber-500/40 hover:border-amber-500 text-amber-400 bg-amber-950/20",
      buttonColor: "bg-amber-600 hover:bg-amber-500 text-black",
      icon: Award,
    },
    {
      title: "District Administration",
      hindi: "जिला प्रशासन",
      role: "Deputy Commissioner (DC)",
      desc: "District-level operational control (Gurugram, Faridabad, Rohtak, etc.), departmental SLAs, and local incident dispatch.",
      href: "/portal/district-admin",
      badge: "Level 2 • District Head",
      accent: "border-blue-500/40 hover:border-blue-500 text-blue-400 bg-blue-950/20",
      buttonColor: "bg-blue-600 hover:bg-blue-500 text-white",
      icon: Building2,
    },
    {
      title: "Line Department Head",
      hindi: "विभागीय नियंत्रण",
      role: "Health / Police / PWD / Fire",
      desc: "Sectoral resource dispatch, unit readiness, department-specific incident queue, and field responder supervision.",
      href: "/portal/department",
      badge: "Level 3 • Sector Lead",
      accent: "border-purple-500/40 hover:border-purple-500 text-purple-400 bg-purple-950/20",
      buttonColor: "bg-purple-600 hover:bg-purple-500 text-white",
      icon: ShieldAlert,
    },
    {
      title: "Field Officer Terminal",
      hindi: "फील्ड अधिकारी",
      role: "Ambulance / Patrol / Inspector",
      desc: "On-ground execution console, assigned task acceptance, GPS live location tracking, and multimodal evidence submission.",
      href: "/portal/field-officer",
      badge: "Level 4 • Tactical Unit",
      accent: "border-emerald-500/40 hover:border-emerald-500 text-emerald-400 bg-emerald-950/20",
      buttonColor: "bg-emerald-600 hover:bg-emerald-500 text-black",
      icon: Radio,
    },
    {
      title: "Citizen Services & Grievance",
      hindi: "नागरिक सेवाएं",
      role: "Haryana Citizens",
      desc: "Submit public civic grievances, track issue resolution lifecycle in real-time, and view verified emergency alerts.",
      href: "/portal/citizen",
      badge: "Public Access • Citizen",
      accent: "border-cyan-500/40 hover:border-cyan-500 text-cyan-400 bg-cyan-950/20",
      buttonColor: "bg-cyan-600 hover:bg-cyan-500 text-white",
      icon: Users,
    },
    {
      title: "3D GIS Command Center",
      hindi: "स्थानिक कमांड केंद्र",
      role: "Unified Spatial Twin",
      desc: "High-definition 3D spatial twin of Haryana with real-time incident heatmap, resource telemetry, and What-If simulation.",
      href: "/world",
      badge: "Spatial Twin • Cesium/Mapbox",
      accent: "border-indigo-500/40 hover:border-indigo-500 text-indigo-400 bg-indigo-950/20",
      buttonColor: "bg-indigo-600 hover:bg-indigo-500 text-white",
      icon: Compass,
    },
  ];

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Haryana State Bar */}
      <div className="bg-[#080d1a] border-b border-surface-border/60 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-emerald-400 tracking-wide flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            GOVERNMENT OF HARYANA | हरियाणा सरकार
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono hidden md:inline">
            Active Node: Chandigarh SDC (Sec-17)
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <PhoneCall className="w-3.5 h-3.5" /> Emergency: 112 (ERSS Panchkula)
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono">{istTime || "IST"}</span>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="border-b border-surface-border bg-surface-base/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AegisLogo className="w-10 h-10" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  TRINETRA
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600">
                    State Core
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                State Governance Intelligence & Response Platform — Haryana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/report"
              className="px-3.5 py-1.5 rounded-md text-xs font-medium border border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              Report Incident
            </Link>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-black transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-900/40"
            >
              <LogIn className="w-3.5 h-3.5" />
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unified Command & Tactical Spatial Intelligence</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Integrated Governance for all <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">22 Districts</span> of Haryana
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Real-time cross-departmental telemetry, closed-loop incident orchestration, and role-based operational portals for State Leadership, District Collectors, Field Units, and Citizens.
          </p>
        </div>

        {/* 6 Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {portals.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.href}
                className={`flex flex-col justify-between p-6 rounded-xl border bg-surface-base/90 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${p.accent}`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-surface-elevated border border-surface-border">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-surface-border">
                      {p.badge}
                    </span>
                  </div>

                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-white flex items-center justify-between">
                      {p.title}
                      <span className="text-xs font-normal text-slate-400">{p.hindi}</span>
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">{p.role}</p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {p.desc}
                  </p>
                </div>

                <Link
                  href={p.href}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${p.buttonColor}`}
                >
                  <span>Launch Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* State Telemetry Footprint */}
        <div className="p-6 rounded-xl border border-surface-border bg-[#0b101d]/80 backdrop-blur-md mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-surface-border/60 pb-4 mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Operational State Baseline — Haryana
              </h4>
              <p className="text-xs text-slate-400">
                Live synchronization with Haryana Space Applications Centre (HARSAC) & State Emergency Response
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2.5 py-1 rounded">
                SYSTEM HEALTH: 100% OPERATIONAL
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border/40">
              <span className="text-2xl font-black font-mono text-white">22</span>
              <p className="text-[11px] text-slate-400 uppercase font-mono mt-1">Districts Connected</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border/40">
              <span className="text-2xl font-black font-mono text-emerald-400">6</span>
              <p className="text-[11px] text-slate-400 uppercase font-mono mt-1">Admin Divisions</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border/40">
              <span className="text-2xl font-black font-mono text-cyan-400">112</span>
              <p className="text-[11px] text-slate-400 uppercase font-mono mt-1">ERSS Integration</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border/40">
              <span className="text-2xl font-black font-mono text-amber-400">&lt; 15m</span>
              <p className="text-[11px] text-slate-400 uppercase font-mono mt-1">Target Response SLA</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-[#080d1a] py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© 2026 Government of Haryana. TRINETRA Governance Intelligence Platform.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Admin Login</Link>
            <span>•</span>
            <Link href="/report" className="hover:text-white transition-colors">Citizen Redressal</Link>
            <span>•</span>
            <Link href="/world" className="hover:text-white transition-colors">GIS Command Twin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
