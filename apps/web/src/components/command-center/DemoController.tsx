"use client";

import React, { useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export const DemoController: React.FC = () => {
  const {
    isJudgeMode,
    currentDemoStep,
    isAutoPlaying,
    demoSteps,
    isJudgeBriefingOpen,
    toggleJudgeMode,
    toggleJudgeBriefing,
    executeDemoStep,
    nextDemoStep,
    prevDemoStep,
    startAutoPlay,
    pauseAutoPlay,
    resetDemo,
  } = useWorldStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isJudgeMode) {
    return (
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => toggleJudgeMode(true)}
          className="px-3 py-1.5 rounded-full bg-surface-base/90 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Enable Judge Mode</span>
        </button>
      </div>
    );
  }

  const currentStep = demoSteps.find((s) => s.stepIndex === currentDemoStep) || demoSteps[0];

  return (
    <>
      {/* 1. Main Floating Mission Control Demo Bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl select-none">
        <div className="rounded-xl border border-amber-500/40 bg-surface-base/90 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
          {/* Header Strip */}
          <div className="px-4 py-2 border-b border-surface-border/80 bg-surface-elevated/40 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold text-amber-300 tracking-wider">JUDGE MODE</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-semibold">
                STEP {String(currentDemoStep).padStart(2, "0")} / 10
              </span>
              <span className="text-cyan-400 font-bold">[{currentStep.time} AM]</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Judge Briefing Button */}
              <button
                onClick={() => toggleJudgeBriefing(true)}
                className="px-2 py-0.5 rounded bg-blue-950/70 border border-blue-600/60 text-blue-300 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors"
                title="Open 7-Question Judge Briefing Card"
              >
                <HelpCircle className="w-3 h-3 text-blue-400" />
                <span>Judge Q&A</span>
              </button>

              {/* Collapse/Expand toggle */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Collapsible Body */}
          {!isCollapsed && (
            <div className="p-3.5 space-y-3">
              {/* Current Narrative Headline */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                      {currentStep.category.replace(/_/g, " ")}
                    </span>
                    <h3 className="text-xs font-bold text-slate-100 truncate">{currentStep.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug truncate">
                    {currentStep.description}
                  </p>
                </div>

                {/* Primary Transport Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Reset Button */}
                  <button
                    onClick={() => resetDemo()}
                    className="p-2 rounded-lg bg-surface-elevated hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-surface-border transition-colors"
                    title="Idempotent Reset to 10:01 AM Baseline"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Previous Step */}
                  <button
                    onClick={() => prevDemoStep()}
                    disabled={currentDemoStep <= 1}
                    className="p-2 rounded-lg bg-surface-elevated hover:bg-slate-800 text-slate-200 disabled:opacity-30 border border-surface-border transition-colors"
                    title="Previous Timeline Event"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {/* Auto Play / Pause */}
                  {isAutoPlaying ? (
                    <button
                      onClick={() => pauseAutoPlay()}
                      className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all"
                      title="Pause Timeline Autoplay"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                      <span className="font-mono">PAUSE</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => startAutoPlay()}
                      className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
                      title="Auto Play 10-Step Operational Story"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span className="font-mono">AUTO PLAY</span>
                    </button>
                  )}

                  {/* Next Step */}
                  <button
                    onClick={() => nextDemoStep()}
                    disabled={currentDemoStep >= 10}
                    className="p-2 rounded-lg bg-surface-elevated hover:bg-slate-800 text-slate-200 disabled:opacity-30 border border-surface-border transition-colors"
                    title="Next Timeline Event"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 10-Milestone Scrubber Track */}
              <div className="pt-1">
                <div className="grid grid-cols-10 gap-1">
                  {demoSteps.map((step) => {
                    const isPassed = step.stepIndex < currentDemoStep;
                    const isCurrent = step.stepIndex === currentDemoStep;
                    return (
                      <button
                        key={step.stepIndex}
                        onClick={() => executeDemoStep(step.stepIndex)}
                        className={`group relative p-1 rounded border text-left transition-all ${
                          isCurrent
                            ? "bg-cyan-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                            : isPassed
                            ? "bg-surface-elevated/70 border-emerald-500/50 hover:border-emerald-400"
                            : "bg-surface-elevated/30 border-surface-border hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-mono font-bold ${
                              isCurrent
                                ? "text-cyan-300"
                                : isPassed
                                ? "text-emerald-400"
                                : "text-slate-500"
                            }`}
                          >
                            {step.time}
                          </span>
                          <span className="text-[9px] font-mono text-slate-600">
                            {isPassed ? "✓" : `#${step.stepIndex}`}
                          </span>
                        </div>
                        <div className="text-[8.5px] truncate text-slate-400 group-hover:text-slate-200 mt-0.5 font-medium">
                          {step.title.split(" ")[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Judge Briefing Card Modal (Answers the 7 Core Questions) */}
      {isJudgeBriefingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border border-blue-500/40 bg-surface-base/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-surface-border bg-surface-elevated/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                  NEXUS Operational Judge Briefing
                </h2>
              </div>
              <button
                onClick={() => toggleJudgeBriefing(false)}
                className="p-1 rounded-lg hover:bg-surface-elevated text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content: 7 Core Questions */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  1. WHAT HAPPENED?
                </span>
                <p className="text-slate-200">
                  Severe road surface flash flooding (38.0cm water accumulation) blocking Road R17
                  corridor between Bridge B02 and Memorial Way. Multiple vehicles stalled; primary
                  emergency transit artery severed.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  2. WHERE?
                </span>
                <p className="text-slate-200">
                  Road R17 Corridor, South Operational Sector (Jaipur Digital Twin), WGS84: 26.9124°N,
                  75.7873°E.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  3. WHY DOES NEXUS BELIEVE IT?
                </span>
                <p className="text-slate-200">
                  Evidence fusion corroborated 4 independent multimodal signals within 180m and 11
                  minutes: (1) citizen geotagged image, (2) citizen 911 distress voice transcript, (3)
                  mobile keyframe, and (4) municipal IoT culvert sensor P02. Combined confidence: <strong>94%</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  4. WHAT IS AFFECTED?
                </span>
                <p className="text-slate-200">
                  Road R17 is structurally severed. Central Memorial Hospital emergency ingress is
                  compromised (+9.0 min ambulance delay). Stormwater pumping station node P02 is at 94%
                  capacity strain.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  5. WHAT SHOULD WE DO?
                </span>
                <p className="text-slate-200">
                  Non-mutating What-If simulation verified alternative corridor R14 bypass (7.1 min ETA vs
                  18.5 min unmanaged). Response Planner synthesized 5 concrete actions: dispatch rescue
                  pumps, divert traffic, alert hospital, notify citizens, and deploy drone recon.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  6. WHAT DID WE DO?
                </span>
                <p className="text-slate-200">
                  City Commander authorized response plan under strict RBAC policy. High-Water Rescue
                  Unit PU-04 was dispatched; traffic signals diverted non-emergency traffic to Corridor R14.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated/40 space-y-1">
                <span className="font-bold font-mono text-emerald-400 block uppercase tracking-wider text-[11px]">
                  7. DID IT WORK?
                </span>
                <p className="text-slate-200">
                  Closed-loop autonomous drone recon verified residual flood level receded from 38.0cm to
                  4.2cm. Road R17 verified open to traffic; incident transitioned to <strong>RESOLVED</strong>.
                  Citizen portal confirms safe resolution without exposing confidential operational assets.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-surface-border bg-surface-elevated/40 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Idempotent Scenario: Repeatable at any time.
              </span>
              <button
                onClick={() => toggleJudgeBriefing(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs transition-colors"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
