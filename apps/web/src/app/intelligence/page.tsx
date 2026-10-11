"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/command-center/Header";
import { useWorldStore } from "@/store/useWorldStore";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Flame,
  Globe2,
  Hospital,
  Info,
  Layers,
  ListTree,
  MapPin,
  Mic,
  Navigation,
  Play,
  Radio,
  RotateCcw,
  Route,
  Scale,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Video,
  Volume2,
  Zap,
} from "lucide-react";

export default function ContextualIntelligencePage() {
  const router = useRouter();
  const {
    snapshot,
    fetchSnapshot,
    selectedIncident,
    selectIncident,
    impactData,
    fetchIncidentImpact,
    simulationResult,
    isSimulating,
    runSimulationScenario,
    responsePlan,
    fetchResponsePlan,
    approveResponseAction,
    executeResponseAction,
    verifyIncidentClosedLoop,
    triggerFlyTo,
    operationalRole,
  } = useWorldStore();

  const [activeTab, setActiveTab] = useState<
    "CONTEXT" | "WHY_FUSED" | "IMPACT" | "SIMULATION" | "RESPONSE" | "VERIFICATION" | "TIMELINE"
  >("CONTEXT");
  const [searchQuery, setSearchQuery] = useState("");
  const [explanation, setExplanation] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [isLoadingIntel, setIsLoadingIntel] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  // Active Incident Selection
  const currentIncident =
    selectedIncident ||
    snapshot?.incidents.find((i) => i.incidentNumber === 1047) ||
    snapshot?.incidents[0];

  useEffect(() => {
    if (!currentIncident) return;

    fetchIncidentImpact(currentIncident.id);
    fetchResponsePlan(currentIncident.id);

    let isMounted = true;
    const fetchIntel = async () => {
      setIsLoadingIntel(true);
      try {
        const [expRes, timeRes, evRes] = await Promise.all([
          fetch(`http://localhost:8000/api/v1/incidents/${currentIncident.id}/explanation`).catch(
            () => null
          ),
          fetch(`http://localhost:8000/api/v1/incidents/${currentIncident.id}/timeline`).catch(
            () => null
          ),
          fetch(`http://localhost:8000/api/v1/incidents/${currentIncident.id}/evidence`).catch(
            () => null
          ),
        ]);

        if (isMounted) {
          if (expRes && expRes.ok) {
            const expData = await expRes.json();
            setExplanation(expData);
          }
          if (timeRes && timeRes.ok) {
            const timeData = await timeRes.json();
            setTimeline(Array.isArray(timeData) ? timeData : []);
          }
          if (evRes && evRes.ok) {
            const evData = await evRes.json();
            setEvidenceList(evData.items || []);
          }
        }
      } catch (err) {
        console.error("Error loading intelligence:", err);
      } finally {
        if (isMounted) setIsLoadingIntel(false);
      }
    };

    fetchIntel();
    return () => {
      isMounted = false;
    };
  }, [currentIncident?.id, fetchIncidentImpact, fetchResponsePlan]);

  const handleFocusIn3D = () => {
    if (currentIncident) {
      selectIncident(currentIncident);
      triggerFlyTo(currentIncident.id, "incident");
    }
    router.push("/world");
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090F] text-slate-100 font-sans">
      {/* 1. AEGIS Mission Control Header */}
      <Header />

      {/* 2. Main Contextual Intelligence Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Incident Roster & Selector */}
        <div className="w-80 border-r border-slate-800/80 bg-[#0B0F19] flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 mono-telemetry">
                  Active Intelligence Feed
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono font-bold">
                {snapshot?.incidents.length || 3} ACTIVE
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incident, location, or code..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Incident List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(snapshot?.incidents || []).map((inc) => {
              const isSelected = currentIncident?.id === inc.id;
              const isCritical = inc.severity === "CRITICAL" || inc.severity === "HIGH";

              return (
                <div
                  key={inc.id}
                  onClick={() => selectIncident(inc)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                      <span className="font-bold text-slate-100 font-mono">
                        #{inc.incidentNumber}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isCritical
                            ? "bg-red-950/80 text-red-400 border border-red-800"
                            : "bg-amber-950/80 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {Math.round((inc.corroborationScore || 0.95) * 100)}% Match
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 line-clamp-2">
                    {inc.title}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {(inc as any).districtId || "North Sector"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {inc.evidenceCount || 4} Evidences
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick 3D Viewport Launcher */}
          <div className="p-3 border-t border-slate-800 bg-[#07090F]">
            <button
              onClick={handleFocusIn3D}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all group"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Inspect in 3D Viewport</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Section: Comprehensive Contextual Intelligence Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0E18]">
          {/* Top Incident Summary Banner */}
          {currentIncident && (
            <div className="p-4 border-b border-slate-800 bg-[#0D1220]/90 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-300">
                    INCIDENT #{currentIncident.incidentNumber}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                    {currentIncident.evidenceCount || 4} EVIDENCES FUSED
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                    {currentIncident.epistemicStatus || "OBSERVED"}
                  </span>
                </div>
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {currentIncident.title}
                </h1>
              </div>

              {/* Focus in 3D Viewport CTA Button */}
              <button
                onClick={handleFocusIn3D}
                className="px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
              >
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <span>Focus in 3D Viewport</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Tab Navigation Ribbon */}
          <div className="flex items-center gap-1 px-4 border-b border-slate-800 bg-[#090C16] text-xs shrink-0">
            {[
              { id: "CONTEXT", label: "Context", icon: Info },
              { id: "WHY_FUSED", label: "Why Fused?", icon: Brain },
              { id: "IMPACT", label: "Impact", icon: AlertTriangle },
              { id: "SIMULATION", label: "Simulation", icon: SlidersHorizontal },
              { id: "RESPONSE", label: "Response Plan", icon: Zap },
              { id: "VERIFICATION", label: "Verification", icon: CheckCircle2 },
              { id: "TIMELINE", label: "Timeline", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 font-bold transition-all flex items-center gap-2 border-b-2 ${
                    isActive
                      ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: CONTEXT */}
            {activeTab === "CONTEXT" && currentIncident && (
              <div className="space-y-6 max-w-4xl">
                {/* Ground Reality Summary */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mono-telemetry">
                    Ground Reality Summary
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-mono">
                    {(currentIncident as any).groundRealitySummary ||
                      "RESOLVED: Road R17 flooding cleared by auxiliary pump deployment. Water level decreased to 4cm. Culvert drained and corridor reopened to traffic."}
                  </p>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Severity</div>
                    <div className="text-base font-bold text-red-400 font-mono">
                      {currentIncident.severity}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {Math.round((currentIncident.corroborationScore || 0.99) * 100)}% Corroborated
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Affected Radius</div>
                    <div className="text-base font-bold text-cyan-400 font-mono">
                      {currentIncident.affectedRadiusMeters || 120}m
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Coordinates</div>
                    <div className="text-xs font-bold text-slate-300 font-mono pt-1">
                      {currentIncident.geometry?.latitude?.toFixed(4) || "26.9124"}°N,{" "}
                      {currentIncident.geometry?.longitude?.toFixed(4) || "75.7873"}°E
                    </div>
                  </div>
                </div>

                {/* Downstream Causal Impact */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mono-telemetry flex items-center justify-between">
                    <span>Downstream Causal Impact</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Automated Network Topology Analysis
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Route className="w-4 h-4 text-red-400" />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            Road R17 Severance
                          </div>
                          <div className="text-[11px] text-slate-500">
                            North industrial corridor impassable due to standing storm water
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                        DEGRADED (38%)
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Hospital className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            Central Memorial Hospital
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Direct ambulance ingress severed. Bypass delay +8.5 minutes
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                        ACCESS CUT (+9m)
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            Ambulance MED-102
                          </div>
                          <div className="text-[11px] text-slate-500">
                            En route to emergency trauma ward. Rerouted via Corridor R14
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        REROUTE ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WHY FUSED */}
            {activeTab === "WHY_FUSED" && (
              <div className="space-y-4 max-w-4xl">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mono-telemetry">
                    Multi-Evidence Fusion Rationale
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {explanation?.fusionRationale ||
                      "Incident #1047 was corroborated by fusing 4 independent observation streams: Citizen photo geo-tagged on R17, Video upload of impassable corridor, Voice emergency report, and Culvert hydrostatic flow sensors."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      type: "PHOTO",
                      title: "Citizen Photo (Ingest #1047-A)",
                      source: "Citizen Mobile App",
                      model: "YOLOv8 + CLIP Geo-matching",
                      verdict: "Water level 45cm detected across 4 lanes",
                      icon: CameraIcon,
                    },
                    {
                      type: "VIDEO",
                      title: "Traffic Video (Ingest #1047-B)",
                      source: "Public Safety Cam / Citizen",
                      model: "Video Temporal Frame Sampler",
                      verdict: "Vehicles turning back; standing water velocity <0.1m/s",
                      icon: Video,
                    },
                    {
                      type: "VOICE",
                      title: "Citizen Voice Emergency Dispatch",
                      source: "Hindi Emergency Audio",
                      model: "Whisper ASR + Hindi NLP",
                      verdict: '"Bridge ke paas pura paani bhar gaya hai, gaadiyan fas rahi hain"',
                      icon: Volume2,
                    },
                    {
                      type: "SENSOR",
                      title: "Culvert Infrastructure Flow Telemetry",
                      source: "SCADA Hydrological Sensor",
                      model: "In-situ Pressure Transducer",
                      verdict: "Culvert C-04 drainage capacity degraded by 85%",
                      icon: DropletIcon,
                    },
                  ].map((ev, i) => {
                    const Icon = ev.icon;
                    return (
                      <div
                        key={i}
                        className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-cyan-400" />
                            {ev.type} EVIDENCE
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            Corroborated
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200">{ev.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{ev.verdict}</div>
                        <div className="text-[10px] text-slate-500 font-mono pt-1">
                          Pipeline: {ev.model}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: IMPACT */}
            {activeTab === "IMPACT" && (
              <div className="space-y-4 max-w-4xl">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Mobility Impact</div>
                    <div className="text-2xl font-bold text-red-400 font-mono mt-1">38%</div>
                    <div className="text-[10px] text-slate-400 mt-1">North Corridor Severed</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Emergency Delay</div>
                    <div className="text-2xl font-bold text-amber-400 font-mono mt-1">+8.5m</div>
                    <div className="text-[10px] text-slate-400 mt-1">Hospital Trauma Route</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Bypass Corridor</div>
                    <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">R14</div>
                    <div className="text-[10px] text-slate-400 mt-1">Capacity 92% Nominal</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mono-telemetry">
                    Automated Reroute & Bypass Corridor Telemetry
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    All emergency traffic originating from West Sector is routed via Road R14 bypass.
                    Clearance time estimated at 7.1 minutes to Central Memorial Hospital.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: SIMULATION */}
            {activeTab === "SIMULATION" && (
              <div className="space-y-4 max-w-4xl">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mono-telemetry">
                        What-If Hydrological Simulation Engine
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Runoff modeling for 50mm/hr intense cloudburst scenario
                      </div>
                    </div>
                    <button
                      onClick={() => runSimulationScenario("FLASH_FLOOD_R17")}
                      disabled={isSimulating}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isSimulating ? "Simulating..." : "Run What-If Simulation"}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    <div>Precipitation: 50.0 mm/hr</div>
                    <div>Culvert Flow Rate: 1.2 m³/s (Degraded)</div>
                    <div>Predicted Corridor Cleared: In 42 min with 2x High-Capacity Pumps</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: RESPONSE PLAN */}
            {activeTab === "RESPONSE" && (
              <div className="space-y-4 max-w-4xl">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mono-telemetry">
                        AI Recommended Dispatch Plan
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Authorized by Chief Incident Commander
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      APPROVED
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-mono text-slate-200">
                        1. Deploy 2x Auxiliary Pumps to Culvert C-04
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        EXECUTED
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-mono text-slate-200">
                        2. Divert general traffic to Road R14 Corridor
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        EXECUTED
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-mono text-slate-200">
                        3. Issue Priority Ingress Clearance for Unit MED-102
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        EXECUTED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: VERIFICATION */}
            {activeTab === "VERIFICATION" && (
              <div className="space-y-4 max-w-4xl">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mono-telemetry">
                    Closed-Loop Verification
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    Post-action sensor telemetry confirms water level on R17 decreased from 45cm to 4cm.
                    Corridor R17 reopened to full dual-direction traffic.
                  </p>
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>VERIFIED RESOLVED: Zero active standing water bottlenecks.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: TIMELINE */}
            {activeTab === "TIMELINE" && (
              <div className="space-y-3 max-w-4xl font-mono text-xs">
                {[
                  { time: "14:31:12", event: "Citizen Photo received via Mobile Ingest", type: "PHOTO" },
                  { time: "14:31:18", event: "Vision AI detected severe flooding on R17", type: "AI" },
                  { time: "14:31:48", event: "Citizen B video upload received", type: "VIDEO" },
                  { time: "14:32:05", event: "Voice report: 'Bridge ke paas pura paani bhar gaya'", type: "VOICE" },
                  { time: "14:32:09", event: "Infrastructure sensor: Culvert C-04 degraded", type: "SENSOR" },
                  { time: "14:32:11", event: "Fusion: 4 observations merged into Incident #1047", type: "FUSION" },
                  { time: "14:32:20", event: "What-If Simulator computed bypass corridor R14", type: "SIMULATION" },
                  { time: "14:32:35", event: "Commander authorized pump deployment & diversion", type: "DISPATCH" },
                  { time: "14:35:10", event: "Auxiliary pumps deployed; water cleared", type: "ACTION" },
                  { time: "14:36:00", event: "Closed-loop verification confirmed corridor clear", type: "VERIFIED" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 font-bold">{item.time}</span>
                      <span>{item.event}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraIcon(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function DropletIcon(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}
