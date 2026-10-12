"use client";

import React from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Crosshair,
  ExternalLink,
  FileCheck,
  FileText,
  Flame,
  GitMerge,
  Hospital,
  Info,
  Layers,
  ListTree,
  MapPin,
  Maximize2,
  Navigation,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Route,
  Scale,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import Link from "next/link";

export const RightRail: React.FC = () => {
  const {
    selectedDistrict,
    selectedEntity,
    selectedAsset,
    selectedIncident,
    selectedCandidate,
    clearSelection,
    triggerFlyTo,
    confirmCandidate,
    rejectCandidate,
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
    activeRightRailTab,
    setActiveRightRailTab,
    isRightRailOpen,
    toggleRightRail,
  } = useWorldStore();

  const [incidentTab, setIncidentTab] = React.useState<
    "CONTEXT" | "WHY_FUSED" | "IMPACT" | "SIMULATION" | "RESPONSE" | "TIMELINE"
  >("CONTEXT");
  const [explanation, setExplanation] = React.useState<any>(null);
  const [timeline, setTimeline] = React.useState<any[]>([]);
  const [evidenceList, setEvidenceList] = React.useState<any[]>([]);
  const [loadingIntel, setLoadingIntel] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);

  // Sync with store active tab if triggered externally
  React.useEffect(() => {
    if (activeRightRailTab) {
      const map: Record<string, typeof incidentTab> = {
        context: "CONTEXT",
        why: "WHY_FUSED",
        impact: "IMPACT",
        simulation: "SIMULATION",
        response: "RESPONSE",
        timeline: "TIMELINE",
      };
      if (map[activeRightRailTab]) {
        setIncidentTab(map[activeRightRailTab]);
      }
    }
  }, [activeRightRailTab]);

  // Fetch contextual incident intelligence when selected
  React.useEffect(() => {
    if (!selectedIncident) {
      setExplanation(null);
      setTimeline([]);
      setEvidenceList([]);
      return;
    }

    // Pre-fetch Phase 5 impact and response plans
    fetchIncidentImpact(selectedIncident.id);
    fetchResponsePlan(selectedIncident.id);

    let isMounted = true;
    const fetchIntel = async () => {
      setLoadingIntel(true);
      try {
        const [expRes, timeRes, evRes] = await Promise.all([
          fetch(`/api/v1/incidents/${selectedIncident.id}/explanation`).catch(() => null),
          fetch(`/api/v1/incidents/${selectedIncident.id}/timeline`).catch(() => null),
          fetch(`/api/v1/incidents/${selectedIncident.id}/evidence`).catch(() => null),
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
        console.error("Error loading incident intelligence:", err);
      } finally {
        if (isMounted) setLoadingIntel(false);
      }
    };

    fetchIntel();
    return () => {
      isMounted = false;
    };
  }, [selectedIncident?.id]);

  const hasSelection =
    Boolean(selectedDistrict) ||
    Boolean(selectedEntity) ||
    Boolean(selectedAsset) ||
    Boolean(selectedIncident) ||
    Boolean(selectedCandidate);

  if (!isRightRailOpen) {
    return (
      <div className="absolute right-0 top-16 z-20 flex flex-col items-end pointer-events-auto">
        <button
          onClick={() => toggleRightRail(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-l-lg bg-surface-base/95 border-l border-y border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold hover:bg-slate-800 shadow-2xl transition-all hover:pr-4"
          title="Open Contextual Intelligence Drawer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Contextual Intel</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="w-[400px] min-w-[360px] max-w-[420px] border-l border-surface-border bg-surface-base/95 backdrop-blur-md flex flex-col shrink-0 overflow-hidden select-none z-20 transition-all shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-surface-border bg-surface-elevated/60">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 mono-telemetry">
            Contextual Intelligence
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Link to Fullscreen Dedicated Intelligence Workspace */}
          <Link
            href="/intelligence"
            title="Open Dedicated Fullscreen Intelligence Workspace"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono hover:bg-cyan-900/60 transition-colors"
          >
            <span>Full Workspace</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>

          {hasSelection && (
            <button
              onClick={clearSelection}
              title="Clear active selection"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => toggleRightRail(false)}
            title="Collapse Intelligence Drawer"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* CASE 0: CANDIDATE INCIDENT (PHASE 3 MULTIMODAL INGESTION) */}
        {selectedCandidate && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-bold uppercase tracking-wider">
                  HYPOTHESIS / CANDIDATE
                </span>
                <Badge
                  variant={
                    selectedCandidate.severityHint === "CRITICAL"
                      ? "critical"
                      : selectedCandidate.severityHint === "HIGH"
                      ? "warning"
                      : "nominal"
                  }
                  size="sm"
                >
                  {selectedCandidate.severityHint || "HIGH"}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{selectedCandidate.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-snug">{selectedCandidate.summary}</p>
            </div>

            {/* AI Perception Telemetry */}
            <div className="glass-panel p-2.5 rounded space-y-2 text-xs">
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider mono-telemetry font-bold block">
                Multimodal AI Perception Breakdown
              </span>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Confidence Score:</span>
                <span className="text-cyan-300 font-mono font-bold">
                  {Math.round(selectedCandidate.confidence * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(selectedCandidate.confidence * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Perception Models:</span>
                <span className="text-slate-200 font-mono text-[11px]">Grounding DINO + SAM 2</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Evidence Count:</span>
                <span className="text-slate-200 font-mono text-[11px]">{selectedCandidate.evidenceCount || 1} source item(s)</span>
              </div>
            </div>

            {/* Spatial Resolution Match */}
            <div className="glass-panel p-2.5 rounded space-y-1.5 text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mono-telemetry block">
                Spatial & Entity Resolution
              </span>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Matched Entity:</span>
                <span className="text-slate-100 font-bold mono-telemetry">
                  {selectedCandidate.resolvedEntityId || "Corridor Match"}
                </span>
              </div>
              {selectedCandidate.entityMatchConfidence && (
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Match Confidence:</span>
                  <span className="text-emerald-400 font-mono">
                    {(selectedCandidate.entityMatchConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            {/* Operator Actions */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Human-in-the-Loop Operator Decision
              </div>
              {selectedCandidate.status === "PENDING_REVIEW" ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    onClick={() => confirmCandidate(selectedCandidate.id)}
                    icon={<CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  >
                    Authorize Active Incident
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-800"
                    onClick={() => rejectCandidate(selectedCandidate.id)}
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-center text-slate-400">
                  Decision Logged: <strong className="text-slate-200">{selectedCandidate.status}</strong>
                </div>
              )}

              {selectedCandidate.geometry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => triggerFlyTo(selectedCandidate.id, "candidate")}
                  icon={<Crosshair className="w-3.5 h-3.5" />}
                >
                  Focus 3D Viewport
                </Button>
              )}
            </div>
          </div>
        )}

        {/* CASE 1: INCIDENT SELECTED (PHASE 4 LIVING INCIDENT INTELLIGENCE) */}
        {!selectedCandidate && selectedIncident && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Header & Status */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {(selectedIncident as any).tracking_id ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/60 text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-2.5 h-2.5 text-blue-400" />
                    {(selectedIncident as any).tracking_id}
                  </span>
                ) : selectedIncident.status === "CORROBORATED" ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    <Shield className="w-2.5 h-2.5 text-cyan-400" />
                    CORROBORATED
                  </span>
                ) : (
                  <Badge variant="critical" size="sm" dot>
                    INCIDENT #{selectedIncident.incidentNumber}
                  </Badge>
                )}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold">
                  {selectedIncident.evidenceCount || 1} RECORD
                </span>
                <Badge variant={selectedIncident.severity === "CRITICAL" ? "critical" : selectedIncident.severity === "HIGH" ? "warning" : "nominal"} size="sm">
                  {selectedIncident.severity || "MEDIUM"}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-100 leading-snug">
                {selectedIncident.title}
              </h3>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-6 gap-1 p-0.5 rounded bg-surface-elevated/80 border border-surface-border text-[10px] mono-telemetry">
              <button
                onClick={() => setIncidentTab("CONTEXT")}
                className={`py-1 rounded text-center font-medium transition-colors ${
                  incidentTab === "CONTEXT"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Context
              </button>
              <button
                onClick={() => setIncidentTab("WHY_FUSED")}
                className={`py-1 rounded text-center font-medium transition-colors flex items-center justify-center gap-0.5 ${
                  incidentTab === "WHY_FUSED"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Brain className="w-2.5 h-2.5 text-cyan-300" />
                Why?
              </button>
              <button
                onClick={() => setIncidentTab("IMPACT")}
                className={`py-1 rounded text-center font-medium transition-colors flex items-center justify-center gap-0.5 ${
                  incidentTab === "IMPACT"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <AlertTriangle className="w-2.5 h-2.5 text-amber-300" />
                Impact
              </button>
              <button
                onClick={() => setIncidentTab("SIMULATION")}
                className={`py-1 rounded text-center font-medium transition-colors flex items-center justify-center gap-0.5 ${
                  incidentTab === "SIMULATION"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <SlidersHorizontal className="w-2.5 h-2.5 text-purple-300" />
                Sim
              </button>
              <button
                onClick={() => setIncidentTab("RESPONSE")}
                className={`py-1 rounded text-center font-medium transition-colors flex items-center justify-center gap-0.5 ${
                  incidentTab === "RESPONSE"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" />
                Plan
              </button>
              <button
                onClick={() => setIncidentTab("TIMELINE")}
                className={`py-1 rounded text-center font-medium transition-colors flex items-center justify-center gap-0.5 ${
                  incidentTab === "TIMELINE"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="w-2.5 h-2.5 text-blue-300" />
                Time
              </button>
            </div>

            {/* TAB 1: CONTEXT */}
            {incidentTab === "CONTEXT" && (
              <div className="space-y-3">
                {/* Real Grievance Dossier (Populated from Citizen Submission) */}
                {(selectedIncident as any).tracking_id && (
                  <div className="p-3 rounded-xl bg-slate-900/95 border border-emerald-500/30 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>REF: {(selectedIncident as any).tracking_id}</span>
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        selectedIncident.status === "RESOLVED"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                          : selectedIncident.status === "IN_PROGRESS"
                          ? "bg-blue-950/80 text-blue-300 border border-blue-500/40"
                          : selectedIncident.status === "ASSIGNED"
                          ? "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                          : "bg-purple-950/80 text-purple-300 border border-purple-500/40"
                      }`}>
                        {selectedIncident.status}
                      </span>
                    </div>

                    {/* Exact Location & GPS Coordinates */}
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{(selectedIncident as any).address || (selectedIncident as any).district_name || "Haryana"}</span>
                      </div>
                      {selectedIncident.geometry && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 pl-4">
                          <span>GPS: {selectedIncident.geometry.latitude?.toFixed(6)}° N, {selectedIncident.geometry.longitude?.toFixed(6)}° E</span>
                          <span className="text-emerald-400 text-[9px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                            EXACT LOCATION
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Department & Citizen Attribution */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Assigned Department</span>
                        <span className="font-semibold text-slate-200 truncate block">
                          {(selectedIncident as any).department_name || (selectedIncident as any).department_id || "Public Works"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Reported By</span>
                        <span className="font-semibold text-slate-200 truncate block">
                          {(selectedIncident as any).citizen_name || "Citizen"}
                        </span>
                      </div>
                    </div>

                    {/* 1-Click Action Buttons */}
                    <div className="pt-1 flex items-center gap-1.5">
                      <Link
                        href="/portal/department"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <Building className="w-3 h-3" />
                        <span>Dept Portal</span>
                      </Link>
                      <Link
                        href="/portal/field-officer"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <Truck className="w-3 h-3" />
                        <span>Field Ops</span>
                      </Link>
                      <Link
                        href={`/portal/citizen?track=${encodeURIComponent((selectedIncident as any).tracking_id)}`}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Track</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Severity & Confidence Gauge */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded glass-panel text-xs mono-telemetry">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Severity</span>
                    <span className="text-red-400 font-bold tracking-wider">
                      {selectedIncident.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Confidence</span>
                    <span className="text-emerald-400 font-bold tracking-wider">
                      {(((selectedIncident as any).confidence ?? 0.94) * 100).toFixed(0)}% Corroborated
                    </span>
                  </div>
                </div>

                {/* Ground Reality Summary */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry block mb-1">
                    Ground Reality Summary
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed glass-panel p-2.5 rounded">
                    {selectedIncident.summary || selectedIncident.description || selectedIncident.title}
                  </p>
                </div>

                {/* Downstream Impact Propagation */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry block mb-1.5">
                    Downstream Causal Impact
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-surface-elevated border-l-2 border-l-amber-500">
                      <span className="text-slate-200">Road R17 Severance</span>
                      <Badge variant="warning" size="sm">
                        DEGRADED (38cm)
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-surface-elevated border-l-2 border-l-red-500">
                      <span className="text-slate-200">Central Memorial Hospital</span>
                      <Badge variant="critical" size="sm">
                        ACCESS CUT (+9m)
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-surface-elevated border-l-2 border-l-blue-500">
                      <span className="text-slate-200">Ambulance MED-102</span>
                      <Badge variant="info" size="sm">
                        REROUTE REQUIRED
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WHY DOES NEXUS THINK THIS? (EXPLAINABILITY DRAWER) */}
            {incidentTab === "WHY_FUSED" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Rationale Banner */}
                <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/40 text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold mb-1 mono-telemetry">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Fusion Rationale</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {explanation?.rationale ||
                      "4 observations refer to the same road segment (Road R17 / Bridge B02) within a 53-second window and share compatible flooding characteristics across citizen photos, video footage, voice transcript, and municipal telemetry."}
                  </p>
                </div>

                {/* Transparent 6 Sub-Scores */}
                <div className="glass-panel p-2.5 rounded space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-400 border-b border-surface-border pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mono-telemetry">
                      Corroboration Score Matrix
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {explanation?.scores?.overall ? `${(explanation.scores.overall * 100).toFixed(0)}%` : "88%"} OVERALL
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {[
                      { label: "Spatial Compatibility", score: explanation?.scores?.spatial ?? 0.94, desc: "PostGIS / H3 18m distance" },
                      { label: "Temporal Overlap", score: explanation?.scores?.temporal ?? 0.91, desc: "53s capture delta" },
                      { label: "Semantic Compatibility", score: explanation?.scores?.semantic ?? 0.88, desc: "Dense text cosine similarity" },
                      { label: "Entity Resolution", score: explanation?.scores?.entity ?? 0.92, desc: "Road R17 / Bridge B02 anchor" },
                      { label: "Visual Similarity", score: explanation?.scores?.visual ?? 0.71, desc: "Multimodal visual alignment" },
                      { label: "Source Independence", score: explanation?.scores?.source_independence ?? 0.83, desc: "3 citizens + 1 sensor" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-0.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-300">{item.label}</span>
                          <span className="font-mono text-cyan-300 font-bold">
                            {(item.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                            style={{ width: `${Math.min(100, item.score * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Epistemic Breakdown (Observed vs Inferred vs Unknown) */}
                <div className="glass-panel p-2.5 rounded space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mono-telemetry block border-b border-surface-border pb-1">
                    Epistemic Breakdown
                  </span>
                  
                  <div>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                      • Observed Facts
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 pl-1 space-y-0.5">
                      {(explanation?.epistemic_breakdown?.observed || [
                        "standing water",
                        "road obstruction",
                        "reduced vehicle speed",
                        "overtopping embankment",
                      ]).map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                      • Inferences
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 pl-1 space-y-0.5">
                      {(explanation?.epistemic_breakdown?.inferences || [
                        "road accessibility degraded",
                        "bridge structural clearance restricted",
                      ]).map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      • Operational Unknowns
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-400 pl-1 space-y-0.5">
                      {(explanation?.epistemic_breakdown?.unknowns || [
                        "exact water depth",
                        "expected recession duration",
                      ]).map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: IMPACT INTELLIGENCE & DEPENDENCY GRAPH */}
            {incidentTab === "IMPACT" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* District Accessibility Metric */}
                <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/40 text-xs space-y-1">
                  <div className="flex justify-between items-center text-amber-300 font-bold mono-telemetry">
                    <span>{impactData?.impactSummary.districtMetrics.districtName || "South Operational Sector"}</span>
                    <span className="text-red-400">{impactData?.impactSummary.districtMetrics.indexDropPct || "-23.6%"} Health</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span>Pop. Exposed: <strong>{impactData?.impactSummary.districtMetrics.populationExposed?.toLocaleString() || "42,500"}</strong></span>
                    <span>Access Index: <strong>{impactData?.impactSummary.districtMetrics.overallAccessibilityIndex || "71.4"}%</strong></span>
                  </div>
                </div>

                {/* Direct Impacts */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mono-telemetry block mb-1">
                    Direct Roadway Severance
                  </span>
                  {(impactData?.directImpacts || [
                    {
                      name: "Road R17 Corridor",
                      entityId: "ent-road-r17",
                      impactType: "STRUCTURAL_SEVERANCE",
                      severity: "CRITICAL",
                      reason: "Active floodwaters (38cm) blocking travel surface. Speed restricted to 0 km/h.",
                    }
                  ]).map((di: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded glass-panel border-l-2 border-l-red-500 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-100">{di.name}</span>
                        <Badge variant="critical" size="sm">{di.severity}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{di.reason}</p>
                    </div>
                  ))}
                </div>

                {/* Access Impacts (Hospital) */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mono-telemetry block mb-1">
                    Facility Access Obstructions
                  </span>
                  {(impactData?.accessImpacts || [
                    {
                      name: "Central Memorial Hospital",
                      entityId: "facility-hosp-01",
                      impactType: "INGRESS_COMPROMISED",
                      severity: "HIGH",
                      delayMinutes: 9.0,
                      reason: "Primary southern emergency ingress via Road R17 severed. Trauma ambulances delayed by +9 mins.",
                    }
                  ]).map((ai: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded glass-panel border-l-2 border-l-amber-500 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-100">{ai.name}</span>
                        <span className="text-amber-400 font-bold mono-telemetry text-[11px]">+{ai.delayMinutes}m DELAY</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{ai.reason}</p>
                    </div>
                  ))}
                </div>

                {/* Route Impacts (Ambulance) */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mono-telemetry block mb-1">
                    Emergency Unit Route Disruptions
                  </span>
                  {(impactData?.routeImpacts || [
                    {
                      name: "Ambulance MED-102",
                      entityId: "asset-amb-102",
                      impactType: "ROUTE_OBSTRUCTION",
                      severity: "CRITICAL",
                      delayMinutes: 14.3,
                      reason: "Planned transit line intersects R17 flood zone. Reroute required to prevent engine flooding.",
                      recommendedReroute: "Road R14 Northern Bypass (B01 Span)",
                    }
                  ]).map((ri: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded glass-panel border-l-2 border-l-blue-500 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-100">{ri.name}</span>
                        <span className="text-blue-400 font-bold mono-telemetry text-[11px]">+{ri.delayMinutes || 14.3}m DELAY</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{ri.reason}</p>
                      {ri.recommendedReroute && (
                        <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 pt-0.5">
                          <Navigation className="w-3 h-3" />
                          <span>Reroute: {ri.recommendedReroute}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Interactive Relationship Graph Nodes */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mono-telemetry block mb-1">
                    Causal Dependency Graph
                  </span>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    {(impactData?.graph?.edges || [
                      { source: "Incident #1047", target: "Road R17", relationship: "SEVERS", severity: "CRITICAL" },
                      { source: "Road R17", target: "Central Memorial Hospital", relationship: "DELAYS_INGRESS (+9m)", severity: "HIGH" },
                      { source: "Road R17", target: "Ambulance MED-102", relationship: "BLOCKS_ROUTE (+14.3m)", severity: "CRITICAL" },
                      { source: "Road R17", target: "Drainage Pump Node U-03", relationship: "OVERLOADS_CAPACITY", severity: "MEDIUM" },
                    ]).map((edge: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-300 font-mono truncate">{edge.source}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold font-mono">
                          {edge.relationship}
                        </span>
                        <span className="text-slate-300 font-mono truncate">{edge.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WHAT-IF SPATIAL SIMULATION */}
            {incidentTab === "SIMULATION" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Non-Mutating Banner */}
                <div className="p-2 rounded bg-purple-950/40 border border-purple-500/40 text-xs flex items-center justify-between">
                  <span className="text-purple-300 font-mono font-semibold text-[11px]">
                    NON-MUTATING OPERATIONAL TWIN
                  </span>
                  <Badge variant="info" size="sm">SIMULATION</Badge>
                </div>

                {/* Run Simulation Trigger */}
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                  onClick={() => runSimulationScenario("ROAD_CLOSURE", "ent-road-r17")}
                  disabled={isSimulating}
                  icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                >
                  {isSimulating ? "Computing Graph Matrix..." : "⚡ Run R17 Closure Simulation"}
                </Button>

                {/* Comparison Delta Cards */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs mono-telemetry">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 block uppercase">Normal Transit</span>
                    <span className="text-sm font-bold text-slate-200">
                      {simulationResult?.metrics.baselineTransitMins || 4.2}m
                    </span>
                  </div>
                  <div className="p-2 rounded bg-red-950/30 border border-red-500/30">
                    <span className="text-[9px] text-red-400 block uppercase">Unmitigated</span>
                    <span className="text-sm font-bold text-red-400">
                      {simulationResult?.metrics.unmitigatedTransitMins || 18.5}m
                    </span>
                  </div>
                  <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30">
                    <span className="text-[9px] text-emerald-400 block uppercase">Sim. Reroute</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {simulationResult?.metrics.simulatedRerouteMins || 7.1}m
                    </span>
                  </div>
                </div>

                {/* Alternative Route Corridors */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mono-telemetry block mb-1">
                    Predicted Alternative Corridors
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {(simulationResult?.alternativeRoutes || [
                      {
                        name: "Road R14 Northern Bypass via Bridge B01",
                        etaMins: 7.1,
                        distanceKm: 4.8,
                        surfaceCondition: "DRY_OPERATIONAL",
                        throughputCapacityPct: 82,
                        recommended: true,
                      },
                      {
                        name: "West Arterial Ring Expressway (Exit 9)",
                        etaMins: 9.4,
                        distanceKm: 7.2,
                        surfaceCondition: "OPEN_CONGESTED",
                        throughputCapacityPct: 54,
                        recommended: false,
                      }
                    ]).map((route: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded glass-panel border-l-2 ${
                          route.recommended ? "border-l-emerald-500 bg-emerald-950/20" : "border-l-slate-600"
                        } space-y-1`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-100 text-[11px]">{route.name}</span>
                          {route.recommended && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold font-mono">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mono-telemetry">
                          <span>ETA: <strong className="text-cyan-300">{route.etaMins} mins</strong> ({route.distanceKm} km)</span>
                          <span>Capacity: <strong className="text-emerald-400">{route.throughputCapacityPct}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Interventions */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mono-telemetry block">
                    AI Intervention Directives
                  </span>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                    <li>Transmit R14 Northern Bypass vector to Ambulance MED-102 onboard terminal.</li>
                    <li>Activate variable message signs at R17 South junction diverting general traffic.</li>
                    <li>Alert Central Memorial Hospital triage desk to divert ambulances to North Gate 3.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 5: AI RESPONSE PLAN & AUTHORIZATION */}
            {incidentTab === "RESPONSE" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Plan Objective & Compliance */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mono-telemetry">
                      AI Response Plan
                    </span>
                    <Badge variant="critical" size="sm">{responsePlan?.priority || "CRITICAL"}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {responsePlan?.objective || "Mitigate Road R17 water severance, restore emergency hospital corridor, and protect citizen traffic."}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>RBAC Policy Compliance: Verified & Authorized</span>
                  </div>
                </div>

                {/* Action Items List */}
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mono-telemetry block">
                    Operational Tasks & Authorizations
                  </span>
                  {(responsePlan?.actions || [
                    {
                      actionId: "act-01",
                      actionType: "DISPATCH_ASSET",
                      title: "Dispatch High-Water Rescue & Pump Unit PU-04",
                      description: "Deploy heavy auxiliary submersible pump to R17 culvert junction.",
                      status: "APPROVED",
                      resourceAssigned: "Municipal Water Defense Unit 4",
                    },
                    {
                      actionId: "act-02",
                      actionType: "RESTRICT_TRAFFIC",
                      title: "Enforce R17 Corridor Closure & Deploy Dynamic Signage",
                      description: "Activate variable messaging signs at South Sector Junctions A-4 and B-2.",
                      status: "COMPLETED",
                      resourceAssigned: "Traffic Operations Center automated feed",
                    },
                    {
                      actionId: "act-03",
                      actionType: "FACILITY_ALERT",
                      title: "Reconfigure Central Memorial Hospital Trauma Ingress",
                      description: "Notify emergency department charge desk to divert inbound ambulances to North Boulevard Gate 3.",
                      status: "COMPLETED",
                      resourceAssigned: "Hospital ED Radio Gateway",
                    },
                    {
                      actionId: "act-04",
                      actionType: "PUBLIC_ALERT",
                      title: "Publish Citizen Advisory: Road R17 Inundation Warning",
                      description: "Broadcast public-safe geofenced push notification warning motorists.",
                      status: "COMPLETED",
                      resourceAssigned: "Civil Protection Broadcast Node",
                    },
                    {
                      actionId: "act-05",
                      actionType: "VERIFICATION_REQUEST",
                      title: "Dispatch Autonomous Drone 01 for Water Level Verification",
                      description: "Deploy drone survey to capture optical and thermal imagery of R17 culvert.",
                      status: "PENDING",
                      resourceAssigned: "Survey Drone Recon Wing Alpha",
                    }
                  ]).map((act) => (
                    <div key={act.actionId} className="p-2.5 rounded glass-panel space-y-1.5 border-l-2 border-l-cyan-500">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-slate-200 text-[11px] leading-tight">
                          {act.title}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                          act.status === "COMPLETED"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            : act.status === "APPROVED"
                            ? "bg-blue-950 text-blue-300 border border-blue-500/40"
                            : "bg-amber-950 text-amber-300 border border-amber-500/40"
                        }`}>
                          {act.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">{act.description}</p>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {act.status === "PENDING" && (
                          <button
                            onClick={() => approveResponseAction(act.actionId)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] font-semibold transition-colors"
                          >
                            Approve Action
                          </button>
                        )}
                        {act.status === "APPROVED" && (
                          <button
                            onClick={() => executeResponseAction(act.actionId)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-semibold transition-colors"
                          >
                            Execute Dispatch
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Closed-Loop Verification Section */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 tracking-wider mono-telemetry">
                      CLOSED-LOOP VERIFICATION
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Compare real-time post-mitigation sensor telemetry against initial conditions to verify road drainage and safely mark Incident #1047 RESOLVED.
                  </p>
                  
                  {selectedIncident.status === "RESOLVED" ? (
                    <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>INCIDENT VERIFIED & RESOLVED (Water: 4cm, Road Open)</span>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold"
                      onClick={async () => {
                        setIsVerifying(true);
                        try {
                          await verifyIncidentClosedLoop(selectedIncident.id);
                        } finally {
                          setIsVerifying(false);
                        }
                      }}
                      disabled={isVerifying}
                      icon={<Zap className={`w-3.5 h-3.5 text-yellow-300 ${isVerifying ? "animate-spin" : ""}`} />}
                    >
                      {isVerifying ? "Verifying Drone Telemetry..." : "⚡ Execute Closed-Loop Verification"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: TIMELINE */}
            {incidentTab === "TIMELINE" && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry block mb-1">
                  Sequential Event Chronology
                </span>
                <div className="space-y-2 text-xs relative pl-3 border-l border-surface-border">
                  {[
                    { time: "10:01:12", event: "Citizen report logged on R17", tag: "PHOTO", color: "text-blue-400" },
                    { time: "10:02:18", event: "Vision AI detected 38cm flooding", tag: "AI", color: "text-cyan-400" },
                    { time: "10:04:48", event: "Citizen video received", tag: "VIDEO", color: "text-indigo-400" },
                    { time: "10:05:05", event: "Voice report: 'Bridge ke paas road pura paani mein hai'", tag: "VOICE", color: "text-amber-400" },
                    { time: "10:06:09", event: "IoT culvert sensor flow degraded (78%)", tag: "SENSOR", color: "text-purple-400" },
                    { time: "10:07:11", event: "NEXUS Fusion Engine promoted to CONFIRMED (94%)", tag: "FUSION", color: "text-emerald-400" },
                    { time: "10:12:14", event: "What-If Simulation computed Corridor R14 bypass", tag: "SIMULATION", color: "text-purple-300" },
                    { time: "10:18:18", event: "Response Plan authorized; Pump Unit PU-04 dispatched", tag: "ACTION", color: "text-cyan-300" },
                    { time: "10:35:00", event: "Autonomous Drone 01 optical scan verified drainage (4cm)", tag: "VERIFICATION", color: "text-emerald-300" },
                    { time: "10:45:00", event: "Corridor R17 reopening verified; Incident marked RESOLVED", tag: "RESOLVED", color: "text-emerald-400" },
                  ].map((evt, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-surface-base" />
                      <div className="p-2 rounded glass-panel space-y-0.5">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>{evt.time}</span>
                          <span className={`px-1 py-0.2 rounded bg-surface-elevated font-bold ${evt.color}`}>
                            {evt.tag}
                          </span>
                        </div>
                        <p className="text-slate-200 text-[11px]">{evt.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => triggerFlyTo(selectedIncident.id, "incident")}
                icon={<Crosshair className="w-3.5 h-3.5" />}
              >
                Focus in 3D Viewport
              </Button>
            </div>
          </div>
        )}

        {/* CASE 2: ENTITY (HOSPITAL / BRIDGE / BUILDING / UTILITY / ROAD / STATION) SELECTED */}
        {!selectedIncident && selectedEntity && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <Badge
                  variant={
                    selectedEntity.status === "OPERATIONAL"
                      ? "nominal"
                      : selectedEntity.status === "AT_RISK"
                      ? "critical"
                      : "warning"
                  }
                  size="sm"
                  dot
                >
                  {selectedEntity.status}
                </Badge>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-300">
                  {selectedEntity.entityType}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedEntity.id}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{selectedEntity.name}</h3>
            </div>

            {/* STRUCTURED HOSPITAL STATE */}
            {selectedEntity.entityType === "HOSPITAL" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs mono-telemetry">
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Occupancy</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.beds_occupied || 468} /{" "}
                      {selectedEntity.attributes?.beds_total || selectedEntity.attributes?.bedCapacity || 650} Beds
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">ICU Occupancy</span>
                    <span className="text-amber-400 font-bold">
                      {((selectedEntity.attributes?.icu_occupancy || 0.84) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Ambulances Ready</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedEntity.attributes?.ambulances_available || 3} Units
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Access Status</span>
                    <span
                      className={`font-bold ${
                        selectedEntity.attributes?.access_status === "COMPROMISED"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedEntity.attributes?.access_status || "COMPROMISED"}
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-2.5 rounded text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Trauma Rating:</span>
                    <span className="text-slate-200 font-semibold mono-telemetry">
                      Level {selectedEntity.attributes?.traumaLevel || 1} Primary Hub
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Power Status:</span>
                    <span className="text-emerald-400 font-semibold mono-telemetry">
                      {selectedEntity.attributes?.power_status || "STABLE (GRID)"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Primary Route:</span>
                    <span className="text-amber-400 font-medium">Road R17 Corridor</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">District:</span>
                    <span className="text-slate-200 mono-telemetry">
                      {selectedEntity.attributes?.district || "Sector West (dst-west)"}
                    </span>
                  </div>
                </div>

                {/* Related Incident Impact */}
                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mono-telemetry block">
                    Active Incident Severance
                  </span>
                  <p className="text-slate-200 text-[11px] leading-snug">
                    Road R17 flooding directly cuts primary ambulance approach corridor (+9m delay).
                  </p>
                </div>
              </div>
            )}

            {/* STRUCTURED BRIDGE STATE */}
            {selectedEntity.entityType === "BRIDGE" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs mono-telemetry">
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Span Length</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.lengthMeters || 420} m
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Lanes</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.lanes || 4} Lanes
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Structural Integrity</span>
                    <span className="text-emerald-400 font-bold">
                      {Math.round((selectedEntity.attributes?.structuralIntegrity || 0.89) * 100)}%
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Water Clearance</span>
                    <span className="text-amber-400 font-bold">
                      {selectedEntity.attributes?.waterClearanceMeters || 1.2} m (Hazard)
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Connected Corridor:</span>
                    <span className="text-slate-200 font-medium">Road R17 Riverfront</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Hydrological Status:</span>
                    <span className="text-red-400 font-semibold mono-telemetry">
                      Overtopping Risk Detected
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STRUCTURED BUILDING STATE */}
            {selectedEntity.entityType === "BUILDING" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs mono-telemetry">
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Building Height</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.height_meters || 110} m
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Stories / Floors</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.floors || 31} Levels
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Occupancy Type:</span>
                    <span className="text-slate-200 font-medium">
                      {selectedEntity.attributes?.building_type || "CIVIC_COMMERCIAL"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Structural Status:</span>
                    <span className="text-emerald-400 font-semibold mono-telemetry">
                      {selectedEntity.attributes?.structural_status || "NOMINAL"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">District:</span>
                    <span className="text-slate-200 mono-telemetry">
                      {selectedEntity.attributes?.district || "Sector West (dst-west)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STRUCTURED UTILITY NODE / SUBSTATION STATE */}
            {(selectedEntity.entityType === "UTILITY_NODE" || selectedEntity.entityType === "FACILITY") && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs mono-telemetry">
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Grid Capacity</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.capacityMva || 50} MVA
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Flood Risk Zone</span>
                    <span
                      className={`font-bold ${
                        selectedEntity.attributes?.waterRiskZone ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {selectedEntity.attributes?.waterRiskZone ? "ELEVATED (BASIN)" : "NOMINAL"}
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Feeders Active:</span>
                    <span className="text-emerald-400 font-semibold mono-telemetry">
                      4 of 4 Online (Grid Synchronized)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Backup Generation:</span>
                    <span className="text-slate-200 font-medium">Diesel Gen-Set 2.4 MW Ready</span>
                  </div>
                </div>
              </div>
            )}

            {/* STRUCTURED ROAD STATE */}
            {selectedEntity.entityType === "ROAD" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs mono-telemetry">
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Capacity</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.capacity_vph || 3800} vph
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Speed Limit</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.speed_limit || selectedEntity.attributes?.speedLimitKmh || 50} km/h
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Lanes</span>
                    <span className="text-slate-100 font-bold">
                      {selectedEntity.attributes?.lanes || 4} Lanes
                    </span>
                  </div>
                  <div className="glass-panel p-2 rounded">
                    <span className="text-slate-400 text-[10px] block">Current Flow Speed</span>
                    <span
                      className={`font-bold ${
                        (selectedEntity.attributes?.currentSpeedKmh || 12) < 25 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {selectedEntity.attributes?.currentSpeedKmh || 12} km/h
                    </span>
                  </div>
                </div>

                {selectedEntity.attributes?.waterLevelCm && (
                  <div className="glass-panel p-2.5 rounded bg-amber-500/10 border-amber-500/30 text-xs">
                    <span className="text-amber-400 font-bold mono-telemetry block">
                      ⚠️ Hazard Detected: Water Depth {selectedEntity.attributes.waterLevelCm} cm
                    </span>
                    <span className="text-slate-300 text-[11px]">
                      Traffic moving under 12 km/h. Emergency routing diverted to Central Bypass.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* STRUCTURED EMERGENCY STATION STATE */}
            {selectedEntity.entityType === "EMERGENCY_STATION" && (
              <div className="space-y-2 glass-panel p-2.5 rounded text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Station Type:</span>
                  <span className="text-slate-200 font-bold mono-telemetry">
                    {selectedEntity.attributes?.stationType || "FIRE_RESCUE"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Active Teams:</span>
                  <span className="text-emerald-400 font-bold mono-telemetry">
                    {selectedEntity.attributes?.teams_available || 4} Deployed
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Vehicles Ready:</span>
                  <span className="text-slate-200 font-bold mono-telemetry">
                    {selectedEntity.attributes?.vehicles_ready || selectedEntity.attributes?.activeEngines || 6} Units
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Readiness:</span>
                  <span className="text-emerald-400 font-bold mono-telemetry">
                    {selectedEntity.attributes?.operational_readiness || "100% (READY)"}
                  </span>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => triggerFlyTo(selectedEntity.id, "entity")}
              icon={<Crosshair className="w-3.5 h-3.5" />}
            >
              Center on Map
            </Button>
          </div>
        )}

        {/* CASE 3: ASSET (AMBULANCE / VEHICLE) SELECTED */}
        {!selectedIncident && !selectedEntity && selectedAsset && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <Badge
                  variant={
                    selectedAsset.availability === "AVAILABLE"
                      ? "nominal"
                      : selectedAsset.availability === "ENGAGED"
                      ? "warning"
                      : "info"
                  }
                  size="sm"
                  dot
                >
                  {selectedAsset.availability}
                </Badge>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-300">
                  {selectedAsset.assetType}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedAsset.id}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{selectedAsset.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mono-telemetry">
              <div className="glass-panel p-2 rounded">
                <span className="text-slate-400 text-[10px] block">Speed</span>
                <span className="text-slate-100 font-bold">
                  {selectedAsset.state?.speedKmh ?? 0} km/h
                </span>
              </div>
              <div className="glass-panel p-2 rounded">
                <span className="text-slate-400 text-[10px] block">Fuel Level</span>
                <span className="text-emerald-400 font-bold">
                  {selectedAsset.state?.fuelLevelPct ?? 92}%
                </span>
              </div>
              <div className="glass-panel p-2 rounded">
                <span className="text-slate-400 text-[10px] block">Crew Personnel</span>
                <span className="text-slate-100 font-bold">
                  {selectedAsset.state?.crewCount ?? 3} Active
                </span>
              </div>
              <div className="glass-panel p-2 rounded">
                <span className="text-slate-400 text-[10px] block">Coordinates</span>
                <span className="text-cyan-300 font-bold text-[10px]">
                  {selectedAsset.geometry?.latitude?.toFixed(4)}, {selectedAsset.geometry?.longitude?.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="glass-panel p-2.5 rounded text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Assigned Incident:</span>
                <span className="text-slate-200 font-medium">
                  {selectedAsset.state?.assignedIncidentId || "None (On Standby / Patrol)"}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Destination:</span>
                <span className="text-blue-400 font-medium">
                  {selectedAsset.state?.destinationName || "Central Memorial Hospital Trauma Bay"}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Routing Corridor:</span>
                <span className="text-amber-400 font-medium">
                  {(selectedAsset.state as any)?.route || "Road R17 Corridor (Reroute in progress)"}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Telemetry Feed:</span>
                <span className="text-emerald-400 mono-telemetry font-bold">
                  LIVE (IoT 5G Gateway)
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => triggerFlyTo(selectedAsset.id, "asset")}
              icon={<Crosshair className="w-3.5 h-3.5" />}
            >
              Track Vehicle
            </Button>
          </div>
        )}

        {/* CASE 4: DISTRICT SELECTED */}
        {!selectedIncident && !selectedEntity && !selectedAsset && selectedDistrict && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Badge
                  variant={
                    selectedDistrict.status === "STABLE"
                      ? "nominal"
                      : selectedDistrict.status === "ELEVATED_RISK"
                      ? "warning"
                      : "critical"
                  }
                  size="sm"
                >
                  {selectedDistrict.status}
                </Badge>
                <span className="text-[10px] text-slate-400 uppercase mono-telemetry">
                  SECTOR REGION
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{selectedDistrict.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mono-telemetry">
              <div className="glass-panel p-2 rounded">
                <span className="text-slate-400 text-[10px] block">Operational Health</span>
                <span className="text-emerald-400 font-bold text-base">
                  {(selectedDistrict.operationalScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="glass-panel p-2 rounded">
                <span className="text-slate-400 text-[10px] block">Population</span>
                <span className="text-slate-100 font-bold text-base">
                  {(selectedDistrict.populationEstimate / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="glass-panel p-2 rounded">
                <span className="text-slate-400 text-[10px] block">Active Facilities</span>
                <span className="text-slate-100 font-bold">
                  {selectedDistrict.facilityCount} Facilities
                </span>
              </div>
              <div className="glass-panel p-2 rounded">
                <span className="text-slate-400 text-[10px] block">Assigned Assets</span>
                <span className="text-blue-400 font-bold">
                  {selectedDistrict.assetCount} Units
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => triggerFlyTo(selectedDistrict.id, "district")}
              icon={<Crosshair className="w-3.5 h-3.5" />}
            >
              Zoom to District
            </Button>
          </div>
        )}

        {/* DEFAULT EMPTY STATE */}
        {!hasSelection && (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-medium">No Spatial Entity Selected</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Click any road, hospital, emergency station, ambulance, or incident on the 3D map to inspect live state.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
