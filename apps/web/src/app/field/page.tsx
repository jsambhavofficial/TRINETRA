"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  Flame,
  Globe2,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Radio,
  RefreshCw,
  RotateCcw,
  Scale,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  User,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { AegisLogo } from "@/components/ui/AegisLogo";

interface SOPItem {
  id: string;
  label: string;
  mandatory: boolean;
  completed: boolean;
  completed_at?: string;
}

interface ResponseUnit {
  unit_id: string;
  name: string;
  department: string;
  capability: string;
  status: string;
  distance_km: number;
  eta_minutes: number;
  latitude: number;
  longitude: number;
}

export default function FieldOperationsPage() {
  const router = useRouter();

  // Navigation tab: ASSIGNMENTS | ACTIVE_RESPONSE | UNITS | SOP | PROOF | HISTORY
  const [activeTab, setActiveTab] = useState<
    "ASSIGNMENTS" | "ACTIVE_RESPONSE" | "UNITS" | "SOP" | "PROOF" | "HISTORY"
  >("ACTIVE_RESPONSE");

  // Assignment data from backend
  const [assignment, setAssignment] = useState<any>(null);
  const [availableUnits, setAvailableUnits] = useState<ResponseUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dispatch Confirmation Modal State
  const [selectedUnitForDispatch, setSelectedUnitForDispatch] = useState<ResponseUnit | null>(null);

  // Field Notes State
  const [newNoteText, setNewNoteText] = useState("");

  // Proof of Work Form
  const [beforePhoto, setBeforePhoto] = useState<string>(
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' style='background:%23111;'><text x='20' y='50' fill='%23f87171' font-size='14' font-family='monospace'>BEFORE: SEVERE FEEDER SHORT</text><rect x='20' y='70' width='260' height='100' fill='%23331111' stroke='%23f87171'/></svg>"
  );
  const [afterPhoto, setAfterPhoto] = useState<string>(
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' style='background:%23111;'><text x='20' y='50' fill='%2334d399' font-size='14' font-family='monospace'>AFTER: 400A BUS REPAIRED</text><rect x='20' y='70' width='260' height='100' fill='%23113322' stroke='%2334d399'/></svg>"
  );
  const [proofNote, setProofNote] = useState("Visible fault corrected. Phase balance nominal at 230V.");
  const [proofSubmittedSuccess, setProofSubmittedSuccess] = useState(false);

  // Authority Rework Modal State
  const [reworkReason, setReworkReason] = useState("");
  const [showReworkModal, setShowReworkModal] = useState(false);

  // Feedback Notification
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "info" | "error" } | null>(null);

  const fetchAssignmentData = async () => {
    try {
      const res = await fetch("/api/v1/field/assignments/asg-r17-grid-01");
      if (res.ok) {
        const data = await res.json();
        setAssignment(data);
        if (data.available_units) setAvailableUnits(data.available_units);
      }
    } catch (err) {
      console.error("Failed to load field assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
    const interval = setInterval(fetchAssignmentData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dispatch Handler
  const handleConfirmDispatch = async () => {
    if (!selectedUnitForDispatch) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/field/assignments/asg-r17-grid-01/dispatch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit_id: selectedUnitForDispatch.unit_id,
            actor: "Field Officer Inspector Vikram",
          }),
        }
      );
      if (res.ok) {
        setNotification({
          msg: `${selectedUnitForDispatch.name} Dispatched. En route to Sector 17.`,
          type: "success",
        });
        setSelectedUnitForDispatch(null);
        await fetchAssignmentData();
      }
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Status Progression Handler
  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/field/assignments/asg-r17-grid-01/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            actor: "Field Officer Inspector Vikram",
          }),
        }
      );
      if (res.ok) {
        setNotification({ msg: `Status updated to ${newStatus}`, type: "info" });
        await fetchAssignmentData();
      }
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // SOP Item Toggle
  const handleToggleSOP = async (stepId: string, currentVal: boolean) => {
    try {
      const res = await fetch(
        `/api/v1/field/assignments/asg-r17-grid-01/sop`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step_id: stepId,
            completed: !currentVal,
            actor: "Field Officer",
          }),
        }
      );
      if (res.ok) {
        await fetchAssignmentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete All SOP Steps (Helper)
  const handleCompleteAllSOP = async () => {
    if (!assignment?.sop_checklist) return;
    for (const step of assignment.sop_checklist) {
      if (!step.completed) {
        await handleToggleSOP(step.id, false);
      }
    }
  };

  // Submit Proof of Work
  const handleSubmitProof = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/field/assignments/asg-r17-grid-01/proof`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            before_photo: beforePhoto,
            after_photo: afterPhoto,
            field_note: proofNote,
            location_confirmed: true,
            actor: assignment?.assigned_unit?.name || "Grid Response Team 04",
          }),
        }
      );
      if (res.ok) {
        setProofSubmittedSuccess(true);
        setNotification({
          msg: "Proof of Work submitted. Awaiting Authority Validation.",
          type: "success",
        });
        await fetchAssignmentData();
      } else {
        const errData = await res.json();
        setNotification({
          msg: errData?.detail || "Submission blocked: Mandatory SOP incomplete",
          type: "error",
        });
      }
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Authority Validate Handler
  const handleAuthorityValidate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/field/assignments/asg-r17-grid-01/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: "VALIDATE",
            actor: "Commander Vikram Malhotra",
          }),
        }
      );
      if (res.ok) {
        setNotification({ msg: "Validation passed. Ready for final resolution.", type: "success" });
        await fetchAssignmentData();
      }
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Authority Request Rework Handler
  const handleRequestRework = async () => {
    if (!reworkReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/field/assignments/asg-r17-grid-01/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: "REQUEST_REWORK",
            rework_reason: reworkReason,
            actor: "Commander Vikram Malhotra",
          }),
        }
      );
      if (res.ok) {
        setShowReworkModal(false);
        setReworkReason("");
        setNotification({ msg: "Rework requested and recorded in audit trail.", type: "info" });
        await fetchAssignmentData();
      }
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Authority Confirm Resolution
  const handleConfirmResolution = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/field/assignments/asg-r17-grid-01/confirm`,
        {
          method: "POST",
        }
      );
      if (res.ok) {
        setNotification({
          msg: "Incident Resolved. Public safety update broadcast to citizens.",
          type: "success",
        });
        await fetchAssignmentData();
      }
    } catch (err: any) {
      setNotification({ msg: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Completed SOP count
  const sopList: SOPItem[] = assignment?.sop_checklist || [];
  const completedSOPCount = sopList.filter((s) => s.completed).length;
  const isSOPComplete = sopList.length > 0 && completedSOPCount === sopList.length;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="h-14 border-b border-surface-border bg-surface-base/95 backdrop-blur px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <AegisLogo />

          <div className="h-4 w-px bg-surface-border hidden md:block" />

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
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-bold">Field Operations</span>
          </nav>
        </div>

        {/* Operational Status Banner */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>OPERATIONAL SECTOR: NORTH-17</span>
          </div>

          <Link
            href="/world"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-semibold text-cyan-300 transition-colors shadow-sm"
          >
            <span>←</span> Command Center
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-36 space-y-6">
        {/* Top Summary Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              ACTIVE ASSIGNMENTS
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">3</div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">Assigned to Sector 17</div>
          </div>
          <div className="p-3.5 rounded-xl border border-rose-900/60 bg-rose-950/20 backdrop-blur-sm">
            <div className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">
              CRITICAL PRIORITY
            </div>
            <div className="text-2xl font-extrabold text-rose-300 mt-1">1</div>
            <div className="text-[10px] text-rose-400 font-mono mt-0.5">High-voltage failure</div>
          </div>
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              IN PROGRESS
            </div>
            <div className="text-2xl font-extrabold text-cyan-300 mt-1">2</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Teams on site / working</div>
          </div>
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              AWAITING VALIDATION
            </div>
            <div className="text-2xl font-extrabold text-amber-300 mt-1">
              {assignment?.status === "VALIDATION_PENDING" ? 1 : 0}
            </div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Proof under review</div>
          </div>
        </div>

        {/* Temporary Notification Banner */}
        {notification && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono animate-in fade-in duration-200 ${
              notification.type === "success"
                ? "bg-emerald-950/40 border-emerald-600 text-emerald-300"
                : notification.type === "error"
                ? "bg-rose-950/40 border-rose-600 text-rose-300"
                : "bg-cyan-950/40 border-cyan-600 text-cyan-300"
            }`}
          >
            <span>{notification.msg}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-surface-border pb-2 overflow-x-auto text-xs">
          {[
            { id: "ACTIVE_RESPONSE", label: "ACTIVE RESPONSE", icon: Zap },
            { id: "ASSIGNMENTS", label: "MY ASSIGNMENTS (3)", icon: Layers },
            { id: "UNITS", label: "RESPONSE UNITS", icon: Truck },
            { id: "SOP", label: `SOP CHECKLIST (${completedSOPCount}/${sopList.length})`, icon: FileCheck },
            { id: "PROOF", label: "PROOF OF WORK", icon: ShieldCheck },
            { id: "HISTORY", label: "AUDIT TRAIL", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ACTIVE RESPONSE (CORE OPERATIONAL WORKSPACE) */}
        {activeTab === "ACTIVE_RESPONSE" && (
          <div className="space-y-6">
            {/* Incident Header Card */}
            <div className="p-6 rounded-xl border border-surface-border bg-gradient-to-br from-surface-card to-cyan-950/20 backdrop-blur-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700/60 text-rose-300">
                      INC-7712
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
                      HIGH PRIORITY
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-surface-border">
                      DEPARTMENT: ELECTRICITY
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    POWER GRID DISRUPTION — SECTOR 17
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Affected Area: Public-safe operational region (Sector 17 distribution quadrant, 420m radius)
                  </p>
                </div>

                <div className="flex flex-col sm:items-end">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    CURRENT STATE
                  </span>
                  <span className="inline-block mt-1 text-xs font-bold font-mono px-3 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-600 animate-pulse">
                    {assignment?.status || "AWAITING RESPONSE"}
                  </span>
                </div>
              </div>

              {/* Progress Flow Tracker (Section 17) */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Response Flow Progress Lifecycle:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono">
                  {[
                    { id: "REVIEW", label: "REVIEW", done: true },
                    { id: "ACCEPTED", label: "ACCEPT", done: assignment?.status !== "NEW" },
                    { id: "DISPATCHED", label: "DISPATCH", done: ["DISPATCHED", "EN_ROUTE", "ON_SITE", "WORKING", "PROOF_PENDING", "VALIDATION_PENDING", "COMPLETED"].includes(assignment?.status) },
                    { id: "ON_SITE", label: "ARRIVE", done: ["ON_SITE", "WORKING", "PROOF_PENDING", "VALIDATION_PENDING", "COMPLETED"].includes(assignment?.status) },
                    { id: "SOP", label: "SOP", done: isSOPComplete },
                    { id: "WORK", label: "WORK", done: ["WORKING", "PROOF_PENDING", "VALIDATION_PENDING", "COMPLETED"].includes(assignment?.status) },
                    { id: "PROOF", label: "PROOF", done: Boolean(assignment?.proof_data) },
                    { id: "COMPLETE", label: "COMPLETE", done: assignment?.status === "COMPLETED" },
                  ].map((st, i) => (
                    <div
                      key={st.id}
                      className={`p-2 rounded-lg border transition-all ${
                        st.done
                          ? "bg-emerald-950/40 border-emerald-600/80 text-emerald-300"
                          : "bg-surface-elevated/40 border-surface-border text-slate-500 opacity-60"
                      }`}
                    >
                      <div className="text-[10px]">{st.done ? "✓" : i + 1}</div>
                      <div className="font-bold text-[11px] mt-0.5">{st.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Operational Controls Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-surface-border">
                <span className="text-xs font-mono text-slate-400 mr-2">Officer Action:</span>

                {assignment?.status === "NEW" && (
                  <button
                    onClick={() => handleUpdateStatus("ACCEPTED")}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-md"
                  >
                    Accept Assignment
                  </button>
                )}

                {assignment?.status === "ACCEPTED" && (
                  <button
                    onClick={() => {
                      const u4 = availableUnits.find((u) => u.unit_id === "UNIT-04") || availableUnits[0];
                      if (u4) setSelectedUnitForDispatch(u4);
                    }}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch Response Unit</span>
                  </button>
                )}

                {assignment?.status === "DISPATCHED" && (
                  <button
                    onClick={() => handleUpdateStatus("EN_ROUTE")}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Confirm Unit En Route</span>
                  </button>
                )}

                {assignment?.status === "EN_ROUTE" && (
                  <button
                    onClick={() => handleUpdateStatus("ON_SITE")}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Mark Unit On Site</span>
                  </button>
                )}

                {assignment?.status === "ON_SITE" && (
                  <button
                    onClick={() => handleUpdateStatus("WORKING")}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Begin SOP Repair Procedure</span>
                  </button>
                )}

                {/* Authority Controls (Review & Confirm) */}
                {assignment?.status === "VALIDATION_PENDING" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAuthorityValidate}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Validate Proof</span>
                    </button>
                    <button
                      onClick={() => setShowReworkModal(true)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600/30 border border-rose-500/60 hover:bg-rose-600/40 text-rose-300 text-xs font-bold transition-all"
                    >
                      Request Rework
                    </button>
                  </div>
                )}

                {assignment?.validation_status === "VALIDATED" && assignment?.status !== "COMPLETED" && (
                  <button
                    onClick={handleConfirmResolution}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Resolution & Push Update</span>
                  </button>
                )}
              </div>
            </div>

            {/* Two-Column Layout: Evidence & Map on Left, SOP & Proof on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: Map & Aggregated Evidence (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                {/* Evidence Summary Card */}
                <div className="p-5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Aggregated Incident Evidence</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Updated 10:22 AM</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                    <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border">
                      <span className="text-slate-400 text-[10px] block">CITIZEN REPORTS</span>
                      <strong className="text-lg font-bold text-white block mt-0.5">13</strong>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border">
                      <span className="text-slate-400 text-[10px] block">MULTIMODAL MEDIA</span>
                      <strong className="text-lg font-bold text-cyan-300 block mt-0.5">
                        8P / 2V / 3A
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-elevated/40 border border-surface-border">
                      <span className="text-slate-400 text-[10px] block">SCADA SIGNALS</span>
                      <strong className="text-lg font-bold text-purple-300 block mt-0.5">2 DROPS</strong>
                    </div>
                  </div>

                  {/* Evidence Preview Visuals */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Operational Evidence Previews:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg border border-slate-700 bg-slate-950/70 space-y-1.5">
                        <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                          <span>📷</span> Citizen Observation
                        </div>
                        <div className="h-20 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono text-center p-2">
                          [Visual Photo: Transformer terminal box showing scorch marks]
                        </div>
                        <span className="text-[10px] text-slate-400 block">Sector 17 Feeder</span>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-700 bg-slate-950/70 space-y-1.5">
                        <div className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                          <span>⚡</span> SCADA Telemetry Drop
                        </div>
                        <div className="h-20 rounded bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-[10px] text-purple-300 font-mono p-2">
                          <span>Phase C: 190V (Nom: 230V)</span>
                          <span className="text-rose-400 mt-1">Bus Fault Detected</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">Substation Monitor</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Incident Mini-Map Card */}
                <div className="p-5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span>Operational Tactical Map</span>
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live GPS Telemetry
                    </span>
                  </div>

                  {/* Visual Vector Grid Map Container */}
                  <div className="relative h-64 rounded-xl border border-cyan-900/60 bg-[#06101e] overflow-hidden flex items-center justify-center">
                    {/* Grid Background */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)`,
                        backgroundSize: "24px 24px",
                      }}
                    />

                    {/* Sector 17 Affected Zone Halo */}
                    <div className="absolute w-36 h-36 rounded-full bg-rose-500/10 border border-rose-500/40 animate-pulse flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/60 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      </div>
                    </div>

                    {/* Incident Marker */}
                    <div className="absolute flex flex-col items-center text-center">
                      <div className="w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-[0_0_15px_rgba(244,63,94,0.6)]">
                        ⚡
                      </div>
                      <span className="mt-1 text-[10px] font-mono font-bold bg-slate-900/90 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800">
                        INC-7712 (Sector 17)
                      </span>
                    </div>

                    {/* Unit 04 Marker */}
                    <div className="absolute top-8 left-12 flex flex-col items-center">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 border border-cyan-400 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        🚒
                      </div>
                      <span className="mt-1 text-[9px] font-mono bg-slate-900/90 text-cyan-300 px-1 py-0.5 rounded border border-cyan-800">
                        UNIT-04 (2.4km)
                      </span>
                    </div>

                    {/* Dispatch Route Polyline */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line
                        x1="80"
                        y1="60"
                        x2="320"
                        y2="130"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    </svg>

                    {/* Bottom Map Info Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span>Coordinates: 26.9180°N, 75.7920°E</span>
                      <span className="text-cyan-400 font-bold">Corridor: R17 Bypass</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Interactive SOP Checklist & Proof Submission (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                {/* SOP Checklist Card */}
                <div className="p-5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-cyan-400" />
                        <span>Field SOP Checklist (Power Grid)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mandatory protocol validation required before work completion
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                        {completedSOPCount} / {sopList.length} Complete
                      </span>
                      <button
                        onClick={handleCompleteAllSOP}
                        className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 underline"
                      >
                        Check All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sopList.map((step, idx) => (
                      <div
                        key={step.id}
                        onClick={() => handleToggleSOP(step.id, step.completed)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                          step.completed
                            ? "bg-emerald-950/30 border-emerald-600/60 text-slate-200"
                            : "bg-surface-elevated/40 border-surface-border text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs mt-0.5 shrink-0 ${
                            step.completed
                              ? "bg-emerald-500 text-slate-950 font-black shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                              : "border border-slate-600 bg-slate-900"
                          }`}
                        >
                          {step.completed && "✓"}
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className={step.completed ? "line-through text-slate-400" : "font-medium"}>
                              {idx + 1}. {step.label}
                            </span>
                            {step.mandatory && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-rose-950/70 border border-rose-800 text-rose-300 shrink-0">
                                REQUIRED
                              </span>
                            )}
                          </div>
                          {step.completed_at && (
                            <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                              Completed at {step.completed_at}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dedicated Proof of Work & Validation Submission */}
                <div className="p-5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Proof of Work Submission</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-surface-border">
                      Required for Closure
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        Before Photo (Fault state)
                      </span>
                      <div className="h-24 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center p-2 text-center text-[10px] text-rose-300 font-mono">
                        ✓ Before image attached (Feeder burnout)
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        After Photo (Restored state)
                      </span>
                      <div className="h-24 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center p-2 text-center text-[10px] text-emerald-300 font-mono">
                        ✓ After image attached (400A bus replaced)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block">
                      Field Officer Observation & Handover Note:
                    </label>
                    <textarea
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg bg-slate-950/80 border border-slate-800 p-2.5 text-xs text-slate-200 font-sans outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>GPS Coordinates Verified at Incident Perimeter</span>
                    <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                  </div>

                  <button
                    onClick={handleSubmitProof}
                    disabled={actionLoading || !isSOPComplete}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                      !isSOPComplete
                        ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    }`}
                  >
                    {!isSOPComplete ? (
                      <span>Complete all {sopList.length} SOP steps before submitting proof</span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>SUBMIT PROOF FOR AUTHORITY VALIDATION</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY ASSIGNMENTS */}
        {activeTab === "ASSIGNMENTS" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300">
              Department Assigned Incidents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "INC-7712",
                  title: "POWER GRID DISRUPTION",
                  sector: "Sector 17",
                  priority: "HIGH",
                  dept: "Electricity",
                  reports: 13,
                  signals: 2,
                  status: assignment?.status || "AWAITING RESPONSE",
                },
                {
                  id: "INC-7709",
                  title: "SIGNAL CONTROLLER SYNCHRONIZATION FAULT",
                  sector: "Sector 14 — East Bypass Corridor",
                  priority: "MEDIUM",
                  dept: "Traffic Infrastructure",
                  reports: 6,
                  signals: 1,
                  status: "WORKING",
                },
                {
                  id: "INC-7698",
                  title: "CULVERT PUMP MOTOR TRIP",
                  sector: "Road R17 Embankment",
                  priority: "CRITICAL",
                  dept: "Water & Drainage",
                  reports: 9,
                  signals: 3,
                  status: "ACCEPTED",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface-elevated text-cyan-300 border border-cyan-800">
                      {item.id}
                    </span>
                    <span className="text-xs font-mono text-amber-300">{item.priority}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <div className="text-xs text-slate-400 font-mono">{item.sector}</div>
                  <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">{item.reports} citizen reports</span>
                    <button
                      onClick={() => setActiveTab("ACTIVE_RESPONSE")}
                      className="px-3 py-1 rounded bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 font-bold transition-colors"
                    >
                      Open Incident →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: UNITS */}
        {activeTab === "UNITS" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300">
              Department Fleet & Response Units
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableUnits.map((unit) => (
                <div
                  key={unit.unit_id}
                  className="p-5 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-300">{unit.unit_id}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {unit.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{unit.name}</h3>
                  <p className="text-xs text-slate-400">{unit.capability}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-surface-border text-slate-300">
                    <div>Distance: {unit.distance_km} km</div>
                    <div>ETA: {unit.eta_minutes} min</div>
                  </div>
                  <button
                    onClick={() => setSelectedUnitForDispatch(unit)}
                    className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Select & Dispatch Unit</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SOP CHECKLIST */}
        {activeTab === "SOP" && (
          <div className="p-6 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-mono">
                Standard Operating Procedure: Power Grid Disruption
              </h2>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                {completedSOPCount} / {sopList.length} Done
              </span>
            </div>
            <div className="space-y-2">
              {sopList.map((step, idx) => (
                <div
                  key={step.id}
                  onClick={() => handleToggleSOP(step.id, step.completed)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    step.completed
                      ? "bg-emerald-950/30 border-emerald-600 text-slate-200"
                      : "bg-surface-elevated/40 border-surface-border text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{step.completed ? "✓" : idx + 1}.</span>
                    <span className={step.completed ? "line-through text-slate-400" : ""}>{step.label}</span>
                  </div>
                  {step.mandatory && (
                    <span className="text-[10px] font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                      MANDATORY
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: PROOF OF WORK */}
        {activeTab === "PROOF" && (
          <div className="p-6 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-6 max-w-3xl mx-auto">
            <h2 className="text-base font-bold text-white font-mono">
              Proof of Work & Field Completion Packet
            </h2>
            {assignment?.proof_data ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-600 text-emerald-300 text-xs font-mono flex items-center justify-between">
                  <span>Proof submitted by: {assignment.proof_data.submitted_by}</span>
                  <span>Time: {assignment.proof_data.timestamp}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-mono">BEFORE REPAIR</span>
                    <div className="h-32 rounded bg-slate-900 border border-slate-700 flex items-center justify-center p-3 text-xs text-rose-300 font-mono">
                      [Before Photo Verified]
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-mono">AFTER REPAIR</span>
                    <div className="h-32 rounded bg-slate-900 border border-slate-700 flex items-center justify-center p-3 text-xs text-emerald-300 font-mono">
                      [After Photo Verified]
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <strong>Field Note: </strong>
                  {assignment.proof_data.field_note}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No proof has been submitted yet. Complete the SOP checklist and upload on-site evidence in Active Response.
              </p>
            )}
          </div>
        )}

        {/* TAB 6: AUDIT TRAIL */}
        {activeTab === "HISTORY" && (
          <div className="p-6 rounded-xl border border-surface-border bg-surface-card/60 backdrop-blur-sm space-y-4 max-w-3xl mx-auto">
            <h2 className="text-base font-bold text-white font-mono">Immutable Operational Audit Trail</h2>
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
              {(assignment?.audit_trail || []).map((entry: any, i: number) => (
                <div key={i} className="relative flex items-start gap-4 pl-1">
                  <div className="w-5 h-5 rounded-full bg-cyan-600 border border-cyan-400 flex items-center justify-center text-[10px] text-slate-950 font-bold z-10 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-surface-elevated/40 border border-surface-border text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{entry.time}</span>
                      <span className="text-cyan-400">{entry.actor}</span>
                    </div>
                    <div className="text-slate-100 font-bold mt-1">{entry.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* DISPATCH CONFIRMATION MODAL */}
      {selectedUnitForDispatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl border border-cyan-500/50 bg-slate-950 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-400 text-xl font-bold">
                🚒
              </div>
              <div>
                <h3 className="text-base font-black text-white">DISPATCH RESPONSE UNIT?</h3>
                <span className="text-xs text-slate-400 font-mono">Assignment: INC-7712 (Sector 17)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Unit:</span>
                <span className="text-white font-bold">{selectedUnitForDispatch.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capability:</span>
                <span className="text-cyan-300">{selectedUnitForDispatch.capability}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance & ETA:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedUnitForDispatch.distance_km} km (approx {selectedUnitForDispatch.eta_minutes} min)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUnitForDispatch(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-black transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                CONFIRM DISPATCH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTHORITY REQUEST REWORK MODAL */}
      {showReworkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl border border-rose-500/50 bg-slate-950 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-rose-300 font-mono">REQUEST FIELD REWORK</h3>
            <p className="text-xs text-slate-400">
              Provide mandatory operational reason. This becomes part of the permanent audit trail.
            </p>
            <textarea
              value={reworkReason}
              onChange={(e) => setReworkReason(e.target.value)}
              placeholder="e.g. After-state evidence does not sufficiently demonstrate restoration..."
              rows={3}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-xs text-slate-200 font-sans outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReworkModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRework}
                disabled={!reworkReason.trim() || actionLoading}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Submit Rework Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
