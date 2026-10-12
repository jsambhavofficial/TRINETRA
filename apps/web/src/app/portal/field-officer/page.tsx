"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/command-center/Header";
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Upload,
  CheckSquare,
  AlertTriangle,
  Send,
  Navigation,
  FileText,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Camera,
} from "lucide-react";

export default function FieldOfficerPortal() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Field updates state
  const [fieldNote, setFieldNote] = useState("");
  const [beforePhoto, setBeforePhoto] = useState("https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800");
  const [afterPhoto, setAfterPhoto] = useState("https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800");
  const [proofNote, setProofNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trinetra_user");
      const storedToken = localStorage.getItem("trinetra_token");
      if (stored) setAuthUser(JSON.parse(stored));
      if (storedToken) setToken(storedToken);
    } catch (e) {
      // ignore
    }
  }, []);

  const unitId = authUser?.unit_id || "UNIT-AMB-01";

  const loadTasks = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/complaints", { headers });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        if (data.length > 0 && !activeTask) {
          setActiveTask(data[0]);
        } else if (activeTask) {
          const fresh = data.find((t: any) => t.id === activeTask.id);
          if (fresh) setActiveTask(fresh);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  const handleStatusChange = async (newStatus: string) => {
    if (!activeTask || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/complaints/${activeTask.id}/field-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTask(updated);
        setSuccessBanner(`Operational status updated to ${newStatus}`);
        loadTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSop = async (stepId: string, currentStatus: boolean) => {
    if (!activeTask || !token) return;
    try {
      const res = await fetch(`/api/v1/complaints/${activeTask.id}/field-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sop_step_id: stepId,
          sop_completed: !currentStatus,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTask(updated);
        loadTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !token || !fieldNote.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/complaints/${activeTask.id}/field-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: fieldNote.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTask(updated);
        setFieldNote("");
        setSuccessBanner("Field observation note recorded in operational log.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/complaints/${activeTask.id}/submit-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          before_photo: beforePhoto,
          after_photo: afterPhoto,
          field_note: proofNote || "All SOP steps completed. Physical clearance validated.",
          location_confirmed: true,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTask(updated);
        setSuccessBanner("Resolution proof submitted! Status is now AWAITING_VALIDATION pending supervisor signoff.");
        loadTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Truck className="w-3.5 h-3.5" />
              <span>FIELD OFFICER MOBILE RESPONSE TERMINAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Tactical Mission & Task Execution
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Assigned Unit: <strong className="text-cyan-300 font-mono">{unitId}</strong> | Officer: <span className="text-slate-200">{authUser?.display_name || "Field Responder"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTasks}
              className="p-2 rounded-lg bg-surface-elevated border border-surface-border text-slate-300 hover:text-white"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {activeTask && (
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono ${
                  activeTask.status === "RESOLVED"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : activeTask.status === "AWAITING_VALIDATION"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : activeTask.status === "IN_PROGRESS"
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                STATUS: {activeTask.status}
              </span>
            )}
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span>{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Task Selection Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTask(t)}
              className={`px-3.5 py-2 rounded-lg border text-xs font-semibold shrink-0 transition-all text-left ${
                activeTask?.id === t.id
                  ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-md"
                  : "bg-surface-base border-surface-border text-slate-400 hover:text-white"
              }`}
            >
              <div className="font-mono text-[10px] text-slate-500">{t.tracking_id}</div>
              <div className="truncate max-w-[200px]">{t.title}</div>
            </button>
          ))}
        </div>

        {activeTask ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Mission Details & SOP Checklist */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mission Details Card */}
              <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-cyan-300">
                      {activeTask.category} • {activeTask.district_name}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-2">{activeTask.title}</h2>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeTask.description}</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-600/40 shrink-0">
                    {activeTask.priority}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border text-xs text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{activeTask.address || "Sector Location, Gurugram"}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    GPS: {activeTask.latitude?.toFixed(4)}, {activeTask.longitude?.toFixed(4)}
                  </span>
                </div>

                {/* Supervisor Rejection Notice if Rework Requested */}
                {activeTask.validation_status === "REWORK_REQUESTED" && activeTask.rejection_reason && (
                  <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Supervisor Rejection & Rework Instructions:</span>
                    </div>
                    <p className="leading-relaxed">{activeTask.rejection_reason}</p>
                  </div>
                )}

                {/* Tactical Status Switcher */}
                <div className="space-y-1.5 pt-2 border-t border-surface-border/60">
                  <span className="text-xs font-semibold text-slate-300">Set Tactical Execution Status:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleStatusChange("EN_ROUTE")}
                      className="py-2 px-3 rounded-lg text-xs font-bold bg-surface-elevated border border-surface-border hover:border-cyan-500 text-slate-300 hover:text-white"
                    >
                      En Route
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleStatusChange("ON_SCENE")}
                      className="py-2 px-3 rounded-lg text-xs font-bold bg-surface-elevated border border-surface-border hover:border-cyan-500 text-slate-300 hover:text-white"
                    >
                      On Scene
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleStatusChange("IN_PROGRESS")}
                      className="py-2 px-3 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold"
                    >
                      Executing Work
                    </button>
                  </div>
                </div>
              </div>

              {/* SOP Checklist Card */}
              <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span>Standard Operating Procedure (SOP) Checklist</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Check each mandatory protocol step as on-ground operations progress
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    {activeTask.sop_checklist?.filter((s: any) => s.completed).length} / {activeTask.sop_checklist?.length} Done
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeTask.sop_checklist?.map((step: any) => (
                    <div
                      key={step.id}
                      onClick={() => handleToggleSop(step.id, step.completed)}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        step.completed
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                          : "bg-surface-elevated border-surface-border text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={step.completed}
                          readOnly
                          className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-surface-border"
                        />
                        <span className={step.completed ? "line-through text-slate-400" : "font-medium"}>
                          {step.title}
                        </span>
                      </div>
                      {step.completed && (
                        <span className="text-[10px] font-mono text-emerald-400">Verified</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Observation Notes */}
              <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Real-time Field Observation Log</span>
                </h3>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={fieldNote}
                    onChange={(e) => setFieldNote(e.target.value)}
                    placeholder="Log operational update (e.g. Pump speed at 1200 RPM, water receding)..."
                    className="flex-1 p-2.5 rounded-lg bg-slate-900 border border-surface-border text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !fieldNote.trim()}
                    className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </form>

                {activeTask.field_notes?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {activeTask.field_notes.map((n: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-surface-elevated border border-surface-border text-xs flex justify-between gap-2">
                        <div>
                          <p className="text-slate-200">{n.text}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{n.author} ({n.unit_id})</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Proof Submission & Supervisor Validation Notice */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Completion Proof Submission</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Submit photographic verification of completed work to transition task to <strong>AWAITING_VALIDATION</strong>.
                </p>

                <form onSubmit={handleSubmitProof} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300">Geotagged Completion Photo URL</label>
                    <input
                      type="text"
                      value={afterPhoto}
                      onChange={(e) => setAfterPhoto(e.target.value)}
                      placeholder="https://... photo url"
                      className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-surface-border text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300">Final Clearance Note</label>
                    <textarea
                      rows={3}
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      placeholder="e.g. Flood water evacuated; drainage grate unblocked; traffic restored."
                      className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-surface-border text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || activeTask.status === "RESOLVED"}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition-all shadow disabled:opacity-50"
                  >
                    {submitting ? "Submitting Proof..." : "Submit for Supervisor Validation"}
                  </button>
                </form>

                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed">
                  <strong>Validation Protocol:</strong> Submitting proof transitions state to <em>AWAITING_VALIDATION</em>. The complaint cannot be marked <em>RESOLVED</em> until authorized department supervisor validates clearance proof.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-surface-base rounded-xl border border-surface-border text-xs text-slate-400 font-mono">
            No active field tasks assigned to unit {unitId}.
          </div>
        )}
      </main>
    </div>
  );
}
