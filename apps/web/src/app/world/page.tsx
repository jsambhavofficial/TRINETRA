"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { Header } from "@/components/command-center/Header";
import { LeftRail } from "@/components/command-center/LeftRail";
import { RightRail } from "@/components/command-center/RightRail";
import { BottomBar } from "@/components/command-center/BottomBar";
import dynamic from "next/dynamic";
import { CommandBar } from "@/components/ui/CommandBar";
import { VoiceAssistantModal } from "@/components/command-center/VoiceAssistantModal";
import { Layers, ChevronLeft, ChevronRight, X, Sparkles, Filter } from "lucide-react";

const NexusViewer = dynamic(
  () => import("@/components/spatial/NexusViewer").then((mod) => mod.NexusViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-space-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="font-mono text-xs tracking-wider text-slate-300">
            INITIALIZING HARYANA GIS SPATIAL ENGINE...
          </span>
        </div>
      </div>
    ),
  }
);

function WorldContent() {
  const {
    fetchSnapshot,
    selectedIncident,
    selectedCandidate,
    selectedEntity,
    selectedAsset,
    clearSelection,
  } = useWorldStore();

  // Left Rail sidebar starts collapsed so the map is 100% full screen
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSnapshot("world-nexus-city-01");
  }, [fetchSnapshot]);

  // When any incident, candidate, asset, or entity is selected on map, pop open the right drawer!
  const hasSelection = Boolean(
    selectedIncident || selectedCandidate || selectedEntity || selectedAsset
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-space-950 text-slate-100 relative">
      {/* 1. Mission Control Header */}
      <Header />

      {/* 2. Main Spatial Operational Surface (Full Screen 3D Map) */}
      <main className="flex-1 relative overflow-hidden bg-space-950 w-full h-full">
        {/* Full-Bleed 3D Mapbox / Cesium Spatial Canvas */}
        <div className="absolute inset-0 w-full h-full z-0">
          <NexusViewer />
        </div>

        {/* Floating Toggle Button for Left Sidebar (Layers & Controls) */}
        <div className="absolute left-3 top-3 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md border text-xs font-bold transition-all shadow-2xl ${
              isLeftSidebarOpen
                ? "bg-purple-600/90 border-purple-400 text-white shadow-purple-500/30 scale-[1.02]"
                : "bg-slate-900/90 border-slate-700/80 hover:border-purple-400/80 text-slate-200 hover:text-white"
            }`}
            title="Toggle Layers & GIS Controls"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="font-mono tracking-wider">LAYERS & CONTROLS</span>
            {isLeftSidebarOpen ? (
              <ChevronLeft className="w-3.5 h-3.5 ml-0.5 text-slate-300" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-slate-300" />
            )}
          </button>
        </div>

        {/* Left Rail (Collapsible Slide-over Drawer) */}
        <div
          className={`absolute left-0 top-0 bottom-0 z-30 transition-transform duration-300 ease-in-out ${
            isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
          }`}
        >
          <div className="relative h-full flex shadow-2xl">
            <LeftRail onClose={() => setIsLeftSidebarOpen(false)} />
          </div>
        </div>

        {/* Right Rail (Pop-in Side Drawer when Incident is Clicked) */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-30 transition-transform duration-300 ease-in-out ${
            hasSelection ? "translate-x-0 shadow-2xl" : "translate-x-full pointer-events-none"
          }`}
        >
          <RightRail />
        </div>
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

export default function WorldPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-space-950 text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span className="font-mono text-xs tracking-wider text-slate-300">
              CONNECTING 3D DIGITAL TWIN SPATIAL ENGINE...
            </span>
          </div>
        </div>
      }
    >
      <WorldContent />
    </Suspense>
  );
}
