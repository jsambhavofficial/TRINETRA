"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/command-center/Header";
import {
  Truck,
  CheckSquare,
  Camera,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  RefreshCw,
  Send,
  Navigation,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Check,
  Building2,
  AlertTriangle,
} from "lucide-react";

const HARYANA_UNITS = [
  { id: "UNIT-AMB-01", name: "Ambala Emergency Dewatering Unit 1" },
  { id: "UNIT-HLTH-02", name: "Gurugram Civil Hospital Mobile Triage 2" },
  { id: "UNIT-PWR-01", name: "Faridabad DHBVN Line Restoration 1" },
  { id: "UNIT-ROH-03", name: "Rohtak Traffic & Hazard Clearing 3" },
  { id: "UNIT-DIS-01", name: "State Civil Defence Flying Squad 1" },
];

function FieldOfficerPortalContent() {
  const searchParams = useSearchParams();
  const urlUnit = searchParams?.get("unit_id");
  const urlTrackingId = searchParams?.get("tracking_id");

  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>(urlUnit || "UNIT-AMB-01");
  const [highlightTrackingId, setHighlightTrackingId] = useState<string | null>(urlTrackingId || null);

  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Field Note
  const [fieldNote, setFieldNote] = useState("");

  // Photographic Proof State
  const [beforePhoto, setBeforePhoto] = useState<string>(
    "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800"
  );
  const [afterPhoto, setAfterPhoto] = useState<string>(
    "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800"
  );
  const [proofNote, setProofNote] = useState(
    "Dewatering pump operated at 1400 RPM. Stormwater drained from road carriageway, traffic reopened."
  );
  const [locationConfirmed, setLocationConfirmed] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trinetra_user");
      const storedToken = localStorage.getItem("trinetra_token");
      if (stored) {
        const u = JSON.parse(stored);
        setAuthUser(u);
        if (u.unit_id && !urlUnit) setSelectedUnit(u.unit_id);
      }
      if (storedToken) setToken(storedToken);
    } catch (e) {
      // ignore
    }
  }, [urlUnit]);

  useEffect(() => {
    if (urlTrackingId) setHighlightTrackingId(urlTrackingId);
  }, [urlTrackingId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const unitQuery = selectedUnit ? `?assigned_unit_id=${selectedUnit}` : "";
      const res = await fetch(`/api/v1/complaints${unitQuery}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);

        if (highlightTrackingId) {
          const match = data.find((t: any) => t.tracking_id === highlightTrackingId);
          if (match) {
            setActiveTask(match);
            return;
          }
        }

        if (data.length > 0 && !activeTask) {
          setActiveTask(data[0]);
        } else if (activeTask) {
          const updatedActive = data.find((t: any) => t.id === activeTask.id);
          if (updatedActive) setActiveTask(updatedActive);
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
  }, [selectedUnit, token]);

  const handleToggleSop = async (stepId: string, currentStatus: boolean) => {
    if (!activeTask) return;
    const newStatus = !currentStatus;

    // 1. Instant Optimistic State Update
    const currentSteps = activeTask.sop_checklist?.length
      ? activeTask.sop_checklist
      : [
          { id: "sop-1", title: "Site safety perimeter secured and traffic diversion signboards established", completed: false },
          { id: "sop-2", title: "Physical remediation and defect clearance executed by assigned technicians", completed: false },
          { id: "sop-3", title: "Secondary line testing and civic safety parameters certified clean", completed: false },
          { id: "sop-4", title: "Final geotagged photographic verification captured for supervisor approval", completed: false },
        ];

    const updatedSop = currentSteps.map((s: any) =>
      s.id === stepId ? { ...s, completed: newStatus } : s
    );
    setActiveTask({ ...activeTask, sop_checklist: updatedSop });

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/complaints/${activeTask.id}/field-progress`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sop_step_id: stepId,
          sop_completed: newStatus,
          completed: newStatus,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTask(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !fieldNote.trim()) return;
    const noteText = fieldNote.trim();
    setFieldNote("");

    // Optimistic append
    const existingNotes = activeTask.field_notes || [];
    const newNoteObj = {
      author: authUser?.name || "Field Officer",
      text: noteText,
      created_at: new Date().toISOString(),
      unit_id: selectedUnit,
    };
    setActiveTask({ ...activeTask, field_notes: [...existingNotes, newNoteObj] });

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/complaints/${activeTask.id}/field-progress`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          note: noteText,
          field_note: noteText,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTask(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (newStatus: "EN_ROUTE" | "ON_SCENE" | "IN_PROGRESS") => {
    if (!activeTask) return;
    setActiveTask({ ...activeTask, tactical_status: newStatus, status: "IN_PROGRESS" });
    setSuccessBanner(`Operational status updated to ${newStatus.replace("_", " ")}`);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/complaints/${activeTask.id}/field-progress`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          status: newStatus,
          status_override: newStatus,
          note: `Unit status updated to: ${newStatus.replace("_", " ")}`,
          field_note: `Unit status updated to: ${newStatus.replace("_", " ")}`,
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

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/complaints/${activeTask.id}/submit-proof`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          before_photo: beforePhoto,
          after_photo: afterPhoto,
          field_note: proofNote,
          location_confirmed: locationConfirmed,
        }),
      });
      if (res.ok) {
        setSuccessBanner(
          `Resolution Proof for [${activeTask.tracking_id}] submitted! Task transferred to Supervisor Queue for Signoff.`
        );
        loadTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900 pb-12">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Field Officer Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-blue-50/40 border border-blue-100 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Background watermark */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/haryana_heritage_banner.jpg"
            alt="Haryana Heritage"
            className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 opacity-25 lg:opacity-30 object-cover pointer-events-none mix-blend-multiply [mask-image:linear-gradient(to_left,black_60%,transparent_100%)]"
          />

          {/* Slogan Graphic on Top Right */}
          <div className="hidden md:flex flex-col items-center gap-1 absolute right-8 top-6 pointer-events-none z-10">
            <div className="text-base font-black text-[#1E3A8A] tracking-tight">स्वच्छ हरियाणा</div>
            <div className="text-base font-black text-[#16A34A] tracking-tight">सशक्त हरियाणा</div>
            <svg className="w-24 h-2.5" viewBox="0 0 100 10" fill="none">
              <path d="M0 5C25 1 35 9 60 5C85 1 95 9 100 5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="space-y-1.5 z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
              <Truck className="w-3.5 h-3.5 text-cyan-600" />
              <span>FIELD RESPONSE TERMINAL • HARYANA GROUND SQUAD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Field Unit Operational Execution
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Ground Protocol Checklist, Geotagged Proof Capture & Supervisor Submission
            </p>
          </div>

          <div className="flex items-center gap-2 z-10 flex-wrap">
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setHighlightTrackingId(null);
                }}
                className="bg-white border border-slate-200 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl shadow-2xs outline-none cursor-pointer"
              >
                {HARYANA_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadTasks}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Highlight Alert */}
        {highlightTrackingId && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
              <span>
                Department Assigned Mission: Task <strong className="font-mono text-blue-700">{highlightTrackingId}</strong> is selected and ready for field response execution below!
              </span>
            </div>
            <button
              onClick={() => setHighlightTrackingId(null)}
              className="text-blue-600 hover:text-blue-900 px-2 py-0.5 rounded bg-blue-100 text-[11px] font-bold"
            >
              ✕ Dismiss
            </button>
          </div>
        )}

        {/* Success Banner */}
        {successBanner && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successBanner}</span>
            </div>
            <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 font-bold hover:text-emerald-950">✕</button>
          </div>
        )}

        {/* Task Selection Horizontal Bar */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
            <span>Active Field Missions ({tasks.length}):</span>
            <span className="text-[11px] text-blue-600">Click a card to execute mission SOP & proof</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2">
            {tasks.map((t) => {
              const isMatch = activeTask?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTask(t)}
                  className={`p-3.5 rounded-2xl border text-xs text-left transition-all min-w-[230px] shrink-0 shadow-2xs ${
                    isMatch
                      ? "bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-500/30"
                      : "bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 font-mono text-[10px]">
                    <span className="font-bold text-blue-700">{t.tracking_id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                      {t.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>{t.department_id}</span>
                    <span className="text-blue-600 font-semibold">{t.assigned_unit_id || "Unassigned"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {activeTask ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Mission Details & SOP Checklist */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mission Details Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {activeTask.category} • {activeTask.district_name || activeTask.district_id} • {activeTask.department_name || activeTask.department_id}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2">{activeTask.title}</h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activeTask.description}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                    {activeTask.priority}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{activeTask.address || "Sector Location, Gurugram"}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    GPS: {activeTask.latitude ? activeTask.latitude.toFixed(4) : "28.4595"}, {activeTask.longitude ? activeTask.longitude.toFixed(4) : "77.0266"}
                  </span>
                </div>

                {/* Supervisor Rejection Notice */}
                {activeTask.validation_status === "REWORK_REQUESTED" && activeTask.rejection_reason && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-700">
                      <AlertCircle className="w-4 h-4" />
                      <span>Supervisor Rejection & Rework Instructions:</span>
                    </div>
                    <p className="leading-relaxed">{activeTask.rejection_reason}</p>
                  </div>
                )}

                {/* Tactical Status Switcher */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Set Tactical Execution Status:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleStatusChange("EN_ROUTE")}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      En Route
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleStatusChange("ON_SCENE")}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      On Scene
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleStatusChange("IN_PROGRESS")}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                    >
                      Executing Work
                    </button>
                  </div>
                </div>
              </div>

              {/* SOP Checklist Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      <span>Standard Operating Procedure (SOP) Checklist</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Check each mandatory protocol step as on-ground operations progress
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {activeTask.sop_checklist?.filter((s: any) => s.completed).length || 0} / {activeTask.sop_checklist?.length || 0} Done
                  </span>
                </div>

                <div className="space-y-2">
                  {(activeTask.sop_checklist?.length ? activeTask.sop_checklist : [
                    { id: "sop-1", title: "Site safety perimeter secured and traffic diversion signboards established", completed: false },
                    { id: "sop-2", title: "Physical remediation and defect clearance executed by assigned technicians", completed: false },
                    { id: "sop-3", title: "Secondary line testing and civic safety parameters certified clean", completed: false },
                    { id: "sop-4", title: "Final geotagged photographic verification captured for supervisor approval", completed: false },
                  ]).map((step: any) => (
                    <div
                      key={step.id}
                      onClick={() => handleToggleSop(step.id, step.completed)}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        step.completed
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(step.completed)}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 pointer-events-none"
                        />
                        <span className={step.completed ? "line-through text-slate-400" : "font-semibold"}>
                          {step.title}
                        </span>
                      </div>
                      {step.completed && (
                        <span className="text-[10px] text-emerald-700 font-bold">✓ Verified</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Observation Notes */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Real-time Field Observation Log</span>
                </h3>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={fieldNote}
                    onChange={(e) => setFieldNote(e.target.value)}
                    placeholder="Log operational update (e.g. Pump speed at 1200 RPM, water receding)..."
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !fieldNote.trim()}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </form>

                {activeTask.field_notes?.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {activeTask.field_notes.map((n: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between gap-2">
                        <div>
                          <p className="text-slate-800 font-medium">{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.author} ({n.unit_id})</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Photographic Proof & Supervisor Signoff Submission */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Resolution Proof Submission</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Before & after geotagged photographic verification for supervisor audit
                  </p>
                </div>

                <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      1. Before Work Photo URL:
                    </label>
                    <input
                      type="text"
                      value={beforePhoto}
                      onChange={(e) => setBeforePhoto(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={beforePhoto}
                      alt="Before Work Preview"
                      className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      2. After Remediation Proof Photo URL:
                    </label>
                    <input
                      type="text"
                      value={afterPhoto}
                      onChange={(e) => setAfterPhoto(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={afterPhoto}
                      alt="After Remediation Preview"
                      className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Final Officer Remediation Note:
                    </label>
                    <textarea
                      rows={3}
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none leading-relaxed"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={locationConfirmed}
                      onChange={(e) => setLocationConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>GPS On-Scene Location Match Verified</span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Proof for Supervisor Validation</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
            <p className="font-bold text-slate-800">No Active Tasks Assigned</p>
            <p className="text-xs">Select another unit or wait for department dispatch assignment.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function FieldOfficerPortal() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 font-mono text-xs">
          Loading Field Response Terminal...
        </div>
      }
    >
      <FieldOfficerPortalContent />
    </Suspense>
  );
}
