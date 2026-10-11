"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/command-center/Header";
import { ExternalLink, Layers, ArrowLeft, Download, Sparkles } from "lucide-react";

export default function ArchitecturePage() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0A0D14] text-slate-100 font-sans">
      {/* 1. AEGIS Mission Control Header */}
      <Header />

      {/* 2. Top Banner Controls */}
      <div className="h-12 border-b border-slate-800 bg-[#0E131F] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 mono-telemetry">
              AEGIS Technical Architecture Diagram (Generated via Archify)
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-mono font-bold">
            SHOWCASE SPEC
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/aegis-tech-architecture.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-semibold text-cyan-300 transition-colors shadow-sm"
          >
            <span>Open Standalone Artifact</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/world"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </Link>
        </div>
      </div>

      {/* 3. Embedded Interactive Archify Architecture Surface */}
      <div className="flex-1 w-full h-full bg-[#06080E] relative overflow-hidden">
        <iframe
          src="/aegis-tech-architecture.html"
          className="w-full h-full border-0"
          title="AEGIS Technical Architecture"
        />
      </div>
    </div>
  );
}
