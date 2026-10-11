"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWorldStore } from "@/store/useWorldStore";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Truck,
  User,
  Zap,
  X,
  Mic,
} from "lucide-react";

const DEMO_EVENTS = [
  { step: 1, title: "Citizen report submitted", target: "/report", desc: "Citizen reports power outage in Sector 17 with photo & location." },
  { step: 2, title: "Nearby citizens corroborate", target: "/report", desc: "13 nearby residents corroborate: 'This is happening here too'." },
  { step: 3, title: "AEGIS fuses related observations", target: "/world", desc: "Multimodal AI fuses 8 photos, 3 videos, 2 audio dispatches, 2 SCADA drops." },
  { step: 4, title: "Candidate incident created", target: "/world", desc: "Candidate incident CAND-R17-GRID-01 formed with 94% confidence." },
  { step: 5, title: "Incident confirmed / reviewed", target: "/world", desc: "Incident INC-R17-GRID-01 confirmed active on 3D command twin." },
  { step: 6, title: "Electricity Department assigned", target: "/world", desc: "Municipal dispatch routes incident to Electricity Operations division." },
  { step: 7, title: "Field Officer receives assignment", target: "/field", desc: "Assignment appears on Field Officer dashboard (Sector 17)." },
  { step: 8, title: "Field Officer opens incident", target: "/field", desc: "Officer inspects aggregated citizen evidence & 420m affected zone." },
  { step: 9, title: "Field Officer dispatches UNIT-04", target: "/field", desc: "Grid Response Team 04 dispatched. Status becomes DISPATCHED." },
  { step: 10, title: "UNIT-04 becomes EN_ROUTE", target: "/field", desc: "Unit 04 navigating bypass route; ETA 6 min." },
  { step: 11, title: "UNIT-04 becomes ON_SITE", target: "/field", desc: "Unit 04 reaches Sector 17 distribution hub." },
  { step: 12, title: "Field Officer starts SOP", target: "/field", desc: "Power grid Standard Operating Procedure initialized (0 / 7)." },
  { step: 13, title: "SOP checklist completed", target: "/field", desc: "All 7 mandatory SOP items executed and checked." },
  { step: 14, title: "Before / after proof uploaded", target: "/field", desc: "Photographic evidence and repair handover note attached." },
  { step: 15, title: "Proof submitted for validation", target: "/field", desc: "Field completion claim moves to AWAITING VALIDATION." },
  { step: 16, title: "Validation passed", target: "/field", desc: "Deterministic checks passed: checklist, proof, restoration signal." },
  { step: 17, title: "Authority confirms resolution", target: "/field", desc: "Authority marks incident resolved in shared world model." },
  { step: 18, title: "Citizen receives resolution notification", target: "/track", desc: "Citizen Portal updates: 'ISSUE MARKED RESOLVED'." },
  { step: 19, title: "Citizen confirms: YES, RESOLVED", target: "/track", desc: "Citizen confirms restoration. Feedback recorded." },
  { step: 20, title: "Incident CLOSED / VERIFIED", target: "/field", desc: "Closed operational loop achieved: Citizen to Field to Verification." },
];

export const JudgeDemoController: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isJudgeBriefingOpen, toggleJudgeBriefing, toggleVoiceModal } = useWorldStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [showHeroMessage, setShowHeroMessage] = useState<boolean>(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-play timer loop
  useEffect(() => {
    if (isPlaying) {
      autoPlayTimer.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 20) {
            setIsPlaying(false);
            setShowHeroMessage(true);
            return 20;
          }
          const next = prev + 1;
          executeStep(next, false);
          return next;
        });
      }, 3500);
    } else {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isPlaying]);

  const executeStep = async (stepNum: number, navigate: boolean = true) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/field/demo/step/${stepNum}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentStep(stepNum);
        if (stepNum === 20) {
          setShowHeroMessage(true);
        }
        if (navigate && DEMO_EVENTS[stepNum - 1]?.target) {
          router.push(DEMO_EVENTS[stepNum - 1].target);
        }
      }
    } catch (err) {
      console.error("Step execution failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setIsPlaying(false);
    setShowHeroMessage(false);
    setLoading(true);
    try {
      await fetch("http://localhost:8000/api/v1/field/demo/reset", { method: "POST" });
      setCurrentStep(1);
      router.push("/report");
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 20) {
      const next = currentStep + 1;
      executeStep(next, true);
    } else {
      setShowHeroMessage(true);
    }
  };

  const activeEvent = DEMO_EVENTS[currentStep - 1] || DEMO_EVENTS[0];

  return (
    <>
      {/* Subtle toggle pill when dock is closed (docked bottom-left to leave bottom-right clear for Voice) */}
      {!isOpen && (
        <div className="fixed bottom-11 left-6 z-40 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/60 hover:border-amber-400 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.35)] backdrop-blur transition-all"
            title="Open Judge 20-Step Controller"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Judge Mode (Step {currentStep}/20)</span>
          </button>
        </div>
      )}

      {/* Floating Compact Judge Controller Dock (docked cleanly above BottomBar) */}
      {isOpen && (
        <div className="fixed bottom-10 sm:bottom-11 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[94vw] sm:w-auto animate-in fade-in duration-200">
          <div className="p-3 sm:p-4 rounded-2xl border border-amber-500/50 bg-slate-950/95 backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.25)] space-y-2.5">
            {/* Top Bar: Judge Tag & Step Counter */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                  JUDGE MODE • DEMO SCENARIO
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-200 font-bold">
                  STEP {currentStep} OF 20
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleVoiceModal(true)}
                  className="text-[11px] font-mono text-cyan-300 hover:text-white px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 hover:border-cyan-400 transition-colors flex items-center gap-1"
                  title="Open Voice Command Center"
                >
                  <Mic className="w-3 h-3 text-cyan-400" />
                  <span>Voice</span>
                </button>
                <button
                  onClick={() => toggleJudgeBriefing(true)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 transition-colors flex items-center gap-1"
                  title="View 7-Question Judge Briefing Card"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Judge Q&A</span>
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-[11px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                >
                  {isMinimized ? "Expand Dock" : "Minimize"}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Hide Judge Dock (click badge to reopen)"
                  className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          {!isMinimized && (
            <>
              {/* Event Progress & Description */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-amber-400 font-mono">EVENT {currentStep.toString().padStart(2, "0")}:</span>
                    <span>{activeEvent.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeEvent.desc}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">View:</span>
                  <button
                    onClick={() => router.push("/report")}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      pathname === "/report" || pathname === "/track"
                        ? "bg-cyan-600 text-slate-950 font-black shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    CITIZEN
                  </button>
                  <button
                    onClick={() => router.push("/field")}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      pathname === "/field"
                        ? "bg-cyan-600 text-slate-950 font-black shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    FIELD OPS
                  </button>
                  <button
                    onClick={() => router.push("/world")}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      pathname === "/world" || pathname === "/"
                        ? "bg-cyan-600 text-slate-950 font-black shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    COMMAND
                  </button>
                </div>
              </div>

              {/* Core Execution Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>RESET DEMO</span>
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                      isPlaying
                        ? "bg-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? "PAUSE" : "AUTO PLAY"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNext}
                    disabled={loading || currentStep >= 20}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 text-xs font-black tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-1.5"
                  >
                    <span>NEXT EVENT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {currentStep === 20 && (
                    <button
                      onClick={() => setShowHeroMessage(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    >
                      ★ HERO MESSAGE
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* HERO MESSAGE MODAL (Section 48) */}
      {showHeroMessage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-8 rounded-3xl border-2 border-cyan-500/70 bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-950/40 text-center space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.35)] animate-in zoom-in-95 duration-300">
            {/* Shield Icon Beacon */}
            <div className="w-20 h-20 rounded-2xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-4xl text-cyan-400 mx-auto shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-pulse">
              🛡️
            </div>

            {/* Hero Chain */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                OPERATIONAL VERIFICATION LOOP CLOSED
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-emerald-300">
                OBSERVE → CORROBORATE → UNDERSTAND → RESPOND → VERIFY
              </h2>
            </div>

            {/* Core Hero Manifesto Quotes (Section 48) */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-slate-200">
              <p className="text-base sm:text-lg font-bold text-white tracking-wide">
                &ldquo;AEGIS doesn&apos;t just receive complaints.&rdquo;
              </p>
              <p className="text-sm sm:text-base font-medium text-cyan-200 leading-relaxed max-w-xl mx-auto">
                &ldquo;AEGIS connects people, evidence, decisions and field action into one living operational loop.&rdquo;
              </p>
            </div>

            {/* Milestone Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">COMMUNITY CITIZENS</span>
                <strong className="text-emerald-400 font-bold block mt-0.5">14 Corroborated</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">MULTIMODAL EVIDENCE</span>
                <strong className="text-cyan-400 font-bold block mt-0.5">15 Fused Items</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">FIELD SOP PROTOCOL</span>
                <strong className="text-purple-400 font-bold block mt-0.5">7 / 7 Verified</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">LOOP STATUS</span>
                <strong className="text-emerald-400 font-bold block mt-0.5">VERIFIED CLOSED</strong>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowHeroMessage(false)}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                DISMISS
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono transition-colors"
              >
                REPLAY DEMO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-QUESTION JUDGE BRIEFING CARD MODAL */}
      {isJudgeBriefingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/50 bg-slate-900/95 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                  AEGIS / NEXUS Operational Judge Briefing (7 Core Answers)
                </h2>
              </div>
              <button
                onClick={() => toggleJudgeBriefing(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content: 7 Core Questions */}
            <div className="p-6 space-y-3.5 max-h-[72vh] overflow-y-auto text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  1. WHAT HAPPENED?
                </span>
                <p className="text-slate-200">
                  Severe road surface flash flooding (38.0cm water accumulation) blocking Road R17
                  corridor between Bridge B02 and Memorial Way. Multiple vehicles stalled; primary
                  emergency transit artery severed.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  2. WHERE?
                </span>
                <p className="text-slate-200">
                  Road R17 Corridor, South Operational Sector (Jaipur Digital Twin), WGS84: 26.9124°N, 75.7873°E.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  3. WHY DOES AEGIS BELIEVE IT?
                </span>
                <p className="text-slate-200">
                  Evidence fusion corroborated 4 independent multimodal signals within 180m and 11
                  minutes: (1) citizen geotagged image, (2) citizen 911 distress voice transcript, (3)
                  mobile keyframe, and (4) municipal IoT culvert sensor P02. Combined confidence: <strong>94%</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  4. WHAT IS AFFECTED?
                </span>
                <p className="text-slate-200">
                  Road R17 is structurally severed. Central Memorial Hospital emergency ingress is
                  compromised (+9.0 min ambulance delay). Stormwater pumping station node P02 is at 94%
                  capacity strain.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  5. WHAT SHOULD WE DO?
                </span>
                <p className="text-slate-200">
                  Non-mutating What-If simulation verified alternative corridor R14 bypass (7.1 min ETA vs
                  18.5 min unmanaged). Response Planner synthesized 5 concrete actions: dispatch rescue
                  pumps, divert traffic, alert hospital, notify citizens, and deploy drone recon.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="font-bold font-mono text-cyan-400 block uppercase tracking-wider text-[11px]">
                  6. WHAT DID WE DO?
                </span>
                <p className="text-slate-200">
                  City Commander authorized response plan under strict RBAC policy. High-Water Rescue
                  Unit PU-04 was dispatched; traffic signals diverted non-emergency traffic to Corridor R14.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <span className="font-bold font-mono text-emerald-400 block uppercase tracking-wider text-[11px]">
                  7. DID IT WORK?
                </span>
                <p className="text-slate-200">
                  Closed-loop autonomous drone recon verified residual flood level receded from 38.0cm to
                  4.2cm. Road R17 verified open to traffic; incident transitioned to <strong>RESOLVED</strong>.
                  Citizen portal confirms safe resolution with verified before/after proof.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Idempotent Scenario: Repeatable at any time.
              </span>
              <button
                onClick={() => toggleJudgeBriefing(false)}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs transition-colors"
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
