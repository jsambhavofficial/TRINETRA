"use client";

import React, { useEffect } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { Header } from "@/components/command-center/Header";
import { LeftRail } from "@/components/command-center/LeftRail";
import { RightRail } from "@/components/command-center/RightRail";
import { BottomBar } from "@/components/command-center/BottomBar";
import dynamic from "next/dynamic";
import { CommandBar } from "@/components/ui/CommandBar";
import { VoiceAssistantModal } from "@/components/command-center/VoiceAssistantModal";

const NexusViewer = dynamic(
  () => import("@/components/spatial/NexusViewer").then((mod) => mod.NexusViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-space-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="font-mono text-xs tracking-wider text-slate-300">INITIALIZING HARYANA GIS SPATIAL ENGINE...</span>
        </div>
      </div>
    ),
  }
);

export default function WorldPage() {
  const { fetchSnapshot } = useWorldStore();

  useEffect(() => {
    fetchSnapshot("world-nexus-city-01");
  }, [fetchSnapshot]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-space-950 text-slate-100">
      {/* 1. Mission Control Header */}
      <Header />

      {/* 2. Main Spatial Operational Surface */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Rail: Layer Controls & District Directory */}
        <LeftRail />

        {/* Center: 3D Cesium Spatial Canvas */}
        <section className="flex-1 relative overflow-hidden bg-space-950">
          <NexusViewer />
        </section>

        {/* Right Rail: Contextual Intelligence & Entity Telemetry */}
        <RightRail />
      </main>

      {/* 3. Operational World Status & Real-time Telemetry Stream */}
      <BottomBar />

      {/* 4. Global Command Bar (⌘K) */}
      <CommandBar />

      {/* 5. Voice Intelligence & Spoken Command Center */}
      <VoiceAssistantModal />
    </div>
  );
}
