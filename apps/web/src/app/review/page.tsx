"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  GitMerge,
  HelpCircle,
  Layers,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

interface ReviewItem {
  decision_id: string;
  incident_id: string;
  candidate_incident_id?: string;
  evidence_ids: string[];
  decision: string;
  scores: {
    spatial?: number;
    temporal?: number;
    semantic?: number;
    entity?: number;
    visual?: number;
    source_independence?: number;
    overall?: number;
  };
  conflict_details?: string | null;
  rationale?: string;
  created_at?: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/fusion/reviews", {
        headers: { "X-User-Role": "COMMANDER" },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Failed to load review items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (decisionId: string) => {
    setActionLoading(decisionId);
    try {
      const fd = new FormData();
      fd.append("reviewer", "Commander Vikram");
      fd.append("note", "Authorized merge into canonical incident.");
      const res = await fetch(`http://localhost:8000/api/v1/fusion/${decisionId}/approve`, {
        method: "POST",
        body: fd,
        headers: { "X-User-Role": "COMMANDER" },
      });
      if (res.ok) {
        setFeedbackMsg({ id: decisionId, msg: "Merged into canonical incident record.", type: "success" });
        setTimeout(() => fetchReviews(), 1200);
      }
    } catch (err: any) {
      setFeedbackMsg({ id: decisionId, msg: err.message, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (decisionId: string) => {
    setActionLoading(decisionId);
    try {
      const fd = new FormData();
      fd.append("reviewer", "Commander Vikram");
      fd.append("note", "Operator verified distinct events. Keeping separate.");
      const res = await fetch(`http://localhost:8000/api/v1/fusion/${decisionId}/reject`, {
        method: "POST",
        body: fd,
        headers: { "X-User-Role": "COMMANDER" },
      });
      if (res.ok) {
        setFeedbackMsg({ id: decisionId, msg: "Decided: Kept separate as independent events.", type: "success" });
        setTimeout(() => fetchReviews(), 1200);
      }
    } catch (err: any) {
      setFeedbackMsg({ id: decisionId, msg: err.message, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerDemo = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/fusion/demo/core-run", { method: "POST" });
      if (res.ok) {
        router.push("/world");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Default fallback mock reviews if backend queue is empty
  const displayItems: ReviewItem[] = reviews.length > 0 ? reviews : [
    {
      decision_id: "fusedec-case-demo-01",
      incident_id: "inc-1047",
      candidate_incident_id: "cand-r17-flooding",
      evidence_ids: ["ev-water-01", "ev-telemetry-04"],
      decision: "CONFLICT_DETECTED",
      conflict_details: "Two observations report conflicting road accessibility (citizen photo shows blockage vs municipal bus telemetry shows passability).",
      rationale: "Observations geographically overlap at Road R17 Bridge B02, but velocity telemetry disagrees with visual flood height.",
      scores: {
        spatial: 0.94,
        temporal: 0.89,
        semantic: 0.74,
        entity: 0.92,
        visual: 0.65,
        source_independence: 0.81,
        overall: 0.82,
      },
      created_at: new Date().toISOString(),
    },
    {
      decision_id: "fusedec-case-demo-02",
      incident_id: "inc-1048",
      candidate_incident_id: "cand-substation-smoke",
      evidence_ids: ["ev-sub-smoke-01", "ev-sensor-temp-02"],
      decision: "MANUAL_REVIEW",
      conflict_details: null,
      rationale: "Ambiguous boundary match between North Industrial Substation perimeter and transformer yard feeder #4.",
      scores: {
        spatial: 0.78,
        temporal: 0.85,
        semantic: 0.80,
        entity: 0.76,
        visual: 0.60,
        source_independence: 0.75,
        overall: 0.76,
      },
      created_at: new Date(Date.now() - 180000).toISOString(),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-surface-border bg-surface-base/95 backdrop-blur px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/world" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-center font-black tracking-wider text-cyan-400 text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-widest text-white mono-telemetry">AEGIS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 font-bold">
                  FIELD OPS
                </span>
              </div>
            </div>
          </Link>

          <div className="h-4 w-px bg-surface-border" />

          <nav className="hidden md:flex items-center gap-2 text-xs">
            <Link href="/world" className="text-slate-400 hover:text-slate-200">
              Command Center
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/intelligence" className="text-slate-400 hover:text-slate-200">
              Contextual Intelligence
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/report" className="text-slate-400 hover:text-slate-200">
              Citizen Portal
            </Link>
          </nav>

          <div className="h-4 w-px bg-surface-border hidden md:block" />

          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm tracking-wider text-slate-100 mono-telemetry">
              FUSION REVIEW QUEUE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
              {displayItems.length} PENDING DECISION(S)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReviews}
            className="flex items-center gap-1.5 px-3 py-1 rounded glass-panel hover:bg-surface-elevated text-xs font-medium text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerDemo}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Run Core Fusion Demo</span>
          </button>
        </div>
      </header>

      {/* Main Review Stream */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6 overflow-y-auto">
        {/* Banner */}
        <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              Human-in-the-Loop Operational Fusion Engine
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              When spatial, temporal, or semantic compatibility exceeds ambiguity thresholds or observations contradict each other, NEXUS pauses automated fusion and requires commander authorization.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs mono-telemetry text-slate-400">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Engine: fusion-v1.0</span>
          </div>
        </div>

        {/* Review Cards */}
        <div className="space-y-4">
          {displayItems.map((item) => {
            const isConflict = item.decision === "CONFLICT_DETECTED" || Boolean(item.conflict_details);
            const overallPct = Math.round((item.scores.overall ?? 0.8) * 100);

            return (
              <div
                key={item.decision_id}
                className={`p-5 rounded-lg border transition-all ${
                  isConflict
                    ? "bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "bg-surface-base/80 border-surface-border hover:border-slate-600"
                }`}
              >
                {/* Top Badge & IDs */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isConflict ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        CONFLICT DETECTED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/60 text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <GitMerge className="w-3 h-3 text-blue-400" />
                        POSSIBLE DUPLICATE / MERGE PROPOSAL
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">
                      Target: <strong className="text-slate-200">{item.incident_id}</strong>
                    </span>
                    {item.candidate_incident_id && (
                      <span className="text-[11px] font-mono text-slate-400">
                        ↔ Candidate: <strong className="text-cyan-300">{item.candidate_incident_id}</strong>
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-cyan-300">
                    Similarity: {overallPct}%
                  </span>
                </div>

                {/* Conflict Detail Alert */}
                {item.conflict_details && (
                  <div className="p-3 mb-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 block mb-0.5">Disagreement Detected:</span>
                      <p className="leading-relaxed">{item.conflict_details}</p>
                    </div>
                  </div>
                )}

                {/* Rationale */}
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {item.rationale || "Spatial and temporal envelopes match an existing incident cluster."}
                </p>

                {/* Score Breakdown Progress Bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded glass-panel mb-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Spatial Compatibility</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${Math.round((item.scores.spatial ?? 0.8) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-200 font-bold">
                        {Math.round((item.scores.spatial ?? 0.8) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Temporal Overlap</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${Math.round((item.scores.temporal ?? 0.8) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-200 font-bold">
                        {Math.round((item.scores.temporal ?? 0.8) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Semantic Similarity</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${Math.round((item.scores.semantic ?? 0.8) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-200 font-bold">
                        {Math.round((item.scores.semantic ?? 0.8) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Entity Topology</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.round((item.scores.entity ?? 0.8) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-200 font-bold">
                        {Math.round((item.scores.entity ?? 0.8) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-surface-border">
                  <div className="text-[11px] font-mono text-slate-400">
                    Evidence count: <strong className="text-slate-200">{item.evidence_ids.length}</strong> items
                  </div>

                  <div className="flex items-center gap-2">
                    {feedbackMsg?.id === item.decision_id ? (
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded ${
                          feedbackMsg.type === "success"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {feedbackMsg.msg}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleReject(item.decision_id)}
                          disabled={actionLoading === item.decision_id}
                          className="px-3 py-1.5 rounded glass-panel hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                        >
                          Keep Separate
                        </button>
                        <button
                          onClick={() => handleApprove(item.decision_id)}
                          disabled={actionLoading === item.decision_id}
                          className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                          <span>Merge as One Incident</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
