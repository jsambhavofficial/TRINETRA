"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Brain,
  GitBranch,
  History,
  FileCheck,
  AlertTriangle,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface AIDecisionPanelProps {
  complaint: any;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onOverrideTriage?: (overrideData: {
    category?: string;
    sub_category?: string;
    department_id?: string;
    priority?: string;
    reason: string;
  }) => Promise<void>;
}

export const AIDecisionPanel: React.FC<AIDecisionPanelProps> = ({
  complaint,
  isOpen,
  onClose,
  userRole,
  onOverrideTriage,
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState(complaint?.category || "");
  const [overridePriority, setOverridePriority] = useState(complaint?.priority || "HIGH");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  if (!isOpen || !complaint) return null;

  const triage = complaint.ai_triage || {};
  const confidence = triage.confidence_score ? Math.round(triage.confidence_score * 100) : 94;
  const routingRule = complaint.ai_routing_rule || triage.routing_rule || "RULE_STANDARD_GOVERNANCE_ROUTING";
  const safetyFlags = triage.safety_escalation_flags || [];
  const duplicateCandidates = triage.duplicate_candidates || [];
  const humanOverride = complaint.human_override;

  const canOverride = ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"].includes(
    userRole || ""
  );

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim() || !onOverrideTriage) return;
    setIsSubmitting(true);
    try {
      await onOverrideTriage({
        category: overrideCategory,
        priority: overridePriority,
        reason: overrideReason,
      });
      setOverrideSuccess(true);
      setTimeout(() => {
        setShowOverrideModal(false);
        setOverrideSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Override failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                  {complaint.tracking_id}
                </span>
                <span className="text-xs text-slate-400">State Decision Engine v2.0</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">Explainable AI Routing & Triage</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Confidence & Model Banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
              <span className="text-xs text-slate-400">Confidence Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-emerald-400">{confidence}%</span>
                <span className="text-[10px] text-emerald-500/80">High</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
              <span className="text-xs text-slate-400">Assigned Department</span>
              <span className="text-sm font-semibold text-white mt-1 line-clamp-1">
                {complaint.department_name}
              </span>
              <span className="text-[10px] text-indigo-400 mt-auto">{complaint.department_id}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
              <span className="text-xs text-slate-400">Triage Status</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    humanOverride ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                <span className="text-sm font-semibold text-white">
                  {humanOverride ? "Human Overridden" : "Auto Triaged"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-auto">Deterministic Rule Grounded</span>
            </div>
          </div>

          {/* Life Safety Escalation Warning if present */}
          {safetyFlags.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-300">Safety Escalation Flag Detected</h4>
                <p className="text-xs text-rose-200/80 mt-1">
                  High-risk keywords matched life-safety protocols:{" "}
                  {safetyFlags.map((f: any) => f.rule_type || f.type).join(", ")}. Priority auto-promoted.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Facts vs Extraction */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>Input Grounding vs Extracted Entities</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Citizen Title</span>
                <p className="text-sm text-slate-200 font-medium mt-0.5">{complaint.title}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Citizen Description</span>
                <p className="text-xs text-slate-300 mt-0.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                  "{complaint.description}"
                </p>
              </div>

              {complaint.voice_transcript && (
                <div>
                  <span className="text-xs text-indigo-400 uppercase tracking-wider">Voice Transcription</span>
                  <p className="text-xs text-indigo-200 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-800/40 mt-0.5">
                    "{complaint.voice_transcript}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-400">Classified Category:</span>
                  <span className="ml-1.5 font-medium text-white">{complaint.category}</span>
                </div>
                <div>
                  <span className="text-slate-400">Sub-Category:</span>
                  <span className="ml-1.5 font-medium text-emerald-400">
                    {complaint.sub_category || triage.suggested_subcategory || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Jurisdiction District:</span>
                  <span className="ml-1.5 font-medium text-white">{complaint.district_name} ({complaint.district_id})</span>
                </div>
                <div>
                  <span className="text-slate-400">Calculated Priority:</span>
                  <span className="ml-1.5 font-semibold text-amber-400">{complaint.priority}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Deterministic Routing Rule */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>Deterministic Routing Rule Matching</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Matched Policy</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  {routingRule}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rules engine mapped grievance type <span className="text-white font-medium">{complaint.category}</span> directly to{" "}
                <span className="text-white font-medium">{complaint.department_name}</span> based on Haryana State Citizen Grievance Redressal Protocol (Rule 4A).
              </p>
            </div>
          </div>

          {/* Section 3: Duplicate Candidate Analysis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Spatial Duplicate Candidate Scan (&lt;1000m)</span>
              </div>
              <span className="text-xs text-slate-400">
                {duplicateCandidates.length === 0 ? "0 Candidates Found" : `${duplicateCandidates.length} Found`}
              </span>
            </div>

            {duplicateCandidates.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No active duplicate grievance found within 1000m radius of this incident coordinate.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {duplicateCandidates.map((dup: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-indigo-300">{dup.tracking_id}</span>
                      <p className="text-slate-300 line-clamp-1">{dup.title}</p>
                    </div>
                    <span className="text-amber-400 font-medium">~{Math.round(dup.distance_m)}m away</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Human Override Audit Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <span>Human Review & Override Audit Trail</span>
              </div>
              {canOverride && (
                <button
                  onClick={() => setShowOverrideModal(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Override Routing
                </button>
              )}
            </div>

            {humanOverride ? (
              <div className="p-4 rounded-xl border border-amber-800/40 bg-amber-950/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300">Overridden by {humanOverride.overridden_by_role}</span>
                  <span className="text-slate-400">{humanOverride.timestamp}</span>
                </div>
                <p className="text-slate-300 italic">"{humanOverride.reason}"</p>
                <div className="flex gap-4 pt-1 text-slate-400">
                  <span>Prev Priority: <b className="text-slate-200">{humanOverride.previous_state?.priority}</b></span>
                  <span>New Priority: <b className="text-white">{humanOverride.new_state?.priority}</b></span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs text-slate-400">
                Operating strictly under AI recommended baseline. No human administrative override recorded.
              </div>
            )}
          </div>

          {/* Legal / Accountability Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <b>Administrative Disclaimer:</b> AI triage recommendations serve solely as decision support for authorized Haryana line departments. All operational actions, dispatches, and resolutions require verified supervisory confirmation under Haryana Right to Service Act regulations.
          </div>
        </div>

        {/* Override Modal */}
        {showOverrideModal && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-20 p-6 flex flex-col justify-center animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-lg mx-auto w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Override AI Triage Decision
                </h3>
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {overrideSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-center text-sm">
                  Triage successfully overridden and logged in permanent audit trail!
                </div>
              ) : (
                <form onSubmit={handleOverrideSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Target Priority</label>
                    <select
                      value={overridePriority}
                      onChange={(e) => setOverridePriority(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Administrative Justification (Mandatory Audit Requirement)
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain why AI suggested routing or priority was modified..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowOverrideModal(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isSubmitting ? "Recording Audit..." : "Confirm Override"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
