"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/command-center/Header";
import {
  Activity,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Users,
  ChevronRight,
  Filter,
  ArrowRight,
  CheckSquare,
  RefreshCw,
  UserCheck,
  XCircle,
  Eye,
} from "lucide-react";

export default function DepartmentPortal() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Assign Modal
  const [assigningComplaint, setAssigningComplaint] = useState<any>(null);
  const [assignUnitId, setAssignUnitId] = useState("UNIT-AMB-01");
  const [assignOfficerName, setAssignOfficerName] = useState("Officer Vikram Singh");

  // Rework Modal
  const [reworkComplaint, setReworkComplaint] = useState<any>(null);
  const [reworkReason, setReworkReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const deptCode = authUser?.department_id || "DEPT-PWD";

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

  const loadData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Department summary
      const sumRes = await fetch(`/api/v1/governance/department-summary?department_id=${deptCode}`, { headers });
      if (sumRes.ok) {
        setSummaryData(await sumRes.json());
      }

      // 2. Department complaints
      const compRes = await fetch(`/api/v1/complaints?department_id=${deptCode}`, { headers });
      if (compRes.ok) {
        setComplaints(await compRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deptCode, token]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint || !token) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/complaints/${assigningComplaint.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assigned_unit_id: assignUnitId,
          assigned_officer_name: assignOfficerName,
          priority: assigningComplaint.priority,
        }),
      });
      if (res.ok) {
        setActionSuccess(`Task successfully assigned to ${assignUnitId} (${assignOfficerName}).`);
        setAssigningComplaint(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleValidate = async (complaintId: string, decision: "APPROVE" | "REJECT_REWORK") => {
    if (!token) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/complaints/${complaintId}/validate-resolution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          rejection_reason: decision === "REJECT_REWORK" ? reworkReason : undefined,
        }),
      });
      if (res.ok) {
        setActionSuccess(
          decision === "APPROVE"
            ? "Resolution approved! Complaint officially marked RESOLVED."
            : "Rework requested! Task reverted to IN_PROGRESS with feedback sent to field officer."
        );
        setReworkComplaint(null);
        setReworkReason("");
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filterTab === "ALL") return true;
    if (filterTab === "AWAITING_VALIDATION") return c.status === "AWAITING_VALIDATION";
    if (filterTab === "ACTIVE") return c.status === "ASSIGNED" || c.status === "IN_PROGRESS";
    if (filterTab === "SUBMITTED") return c.status === "SUBMITTED" || c.status === "ACKNOWLEDGED";
    if (filterTab === "RESOLVED") return c.status === "RESOLVED";
    return true;
  });

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Department Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DEPARTMENTAL OPERATIONAL COMMAND</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {complaints[0]?.department_name || "Line Department"} Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Assigned Department: <strong className="text-purple-300 font-mono">{deptCode}</strong> | Supervisor: <span className="text-slate-200">{authUser?.display_name || "Department Lead"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-surface-elevated border border-surface-border text-slate-300 hover:text-white"
              title="Refresh Department Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>UNITS DEPLOYED: 4 ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-mono">Department Cases</p>
            <p className="text-2xl font-black text-white font-mono">{summaryData?.totalCases ?? complaints.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-mono">Active Field Missions</p>
            <p className="text-2xl font-black text-cyan-400 font-mono">
              {(summaryData?.byStatus?.IN_PROGRESS || 0) + (summaryData?.byStatus?.ASSIGNED || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-mono">Awaiting Supervisor Signoff</p>
            <p className="text-2xl font-black text-purple-400 font-mono">
              {summaryData?.awaitingValidationCount ?? complaints.filter((c) => c.status === "AWAITING_VALIDATION").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-mono">Verified Resolved</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              {summaryData?.byStatus?.RESOLVED || 0}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-surface-border pb-2 text-xs font-semibold">
          {[
            { id: "ALL", label: `All (${complaints.length})` },
            { id: "AWAITING_VALIDATION", label: `Awaiting Signoff (${complaints.filter((c) => c.status === "AWAITING_VALIDATION").length})` },
            { id: "ACTIVE", label: `In Field (${complaints.filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS").length})` },
            { id: "SUBMITTED", label: `Incoming Queue (${complaints.filter((c) => c.status === "SUBMITTED" || c.status === "ACKNOWLEDGED").length})` },
            { id: "RESOLVED", label: `Resolved (${complaints.filter((c) => c.status === "RESOLVED").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterTab === tab.id
                  ? "bg-purple-600 text-white font-bold"
                  : "text-slate-400 hover:text-white hover:bg-surface-elevated"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Complaints Table */}
        <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 border-b border-surface-border font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3">Tracking ID</th>
                  <th className="py-2.5 px-3">Title & Category</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Assigned Unit</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">SOP Progress</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold whitespace-nowrap">
                      {c.tracking_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white truncate max-w-xs">{c.title}</div>
                      <div className="text-[11px] text-slate-400">{c.category}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {c.district_name}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-cyan-300">
                      {c.assigned_unit_id || <span className="text-slate-600">Unassigned</span>}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          c.status === "RESOLVED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : c.status === "AWAITING_VALIDATION"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : c.status === "IN_PROGRESS"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {c.sop_checklist?.length > 0 ? (
                        `${c.sop_checklist.filter((s: any) => s.completed).length} / ${c.sop_checklist.length}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {c.status === "AWAITING_VALIDATION" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleValidate(c.id, "APPROVE")}
                            disabled={submittingAction}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-black text-[11px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setReworkComplaint(c)}
                            disabled={submittingAction}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                          >
                            Rework
                          </button>
                        </div>
                      ) : c.status === "SUBMITTED" || c.status === "ACKNOWLEDGED" ? (
                        <button
                          onClick={() => setAssigningComplaint(c)}
                          className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
                        >
                          Assign Unit
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">In Workflow</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assign Unit Modal */}
        {assigningComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface-base border border-purple-500/40 rounded-xl p-5 max-w-md w-full space-y-4">
              <h3 className="text-sm font-bold text-white">Assign Field Unit to Grievance</h3>
              <p className="text-xs text-slate-300 font-mono">{assigningComplaint.tracking_id} — {assigningComplaint.title}</p>

              <form onSubmit={handleAssign} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Response Unit ID</label>
                  <input
                    type="text"
                    value={assignUnitId}
                    onChange={(e) => setAssignUnitId(e.target.value)}
                    className="w-full mt-1 p-2 rounded bg-slate-900 border border-surface-border text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Assigned Officer Name</label>
                  <input
                    type="text"
                    value={assignOfficerName}
                    onChange={(e) => setAssignOfficerName(e.target.value)}
                    className="w-full mt-1 p-2 rounded bg-slate-900 border border-surface-border text-xs text-white"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setAssigningComplaint(null)}
                    className="px-3 py-1.5 rounded bg-surface-elevated text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    {submittingAction ? "Assigning..." : "Confirm Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rework Modal */}
        {reworkComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface-base border border-rose-500/40 rounded-xl p-5 max-w-md w-full space-y-4">
              <h3 className="text-sm font-bold text-rose-400">Reject Proof & Demand Field Rework</h3>
              <p className="text-xs text-slate-300 font-mono">{reworkComplaint.tracking_id} — {reworkComplaint.title}</p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Mandatory Rejection / Rework Reason</label>
                  <textarea
                    rows={3}
                    value={reworkReason}
                    onChange={(e) => setReworkReason(e.target.value)}
                    placeholder="e.g. Clearance photo unclear; secondary valve was not tested in SOP."
                    className="w-full mt-1 p-2 rounded bg-slate-900 border border-surface-border text-xs text-white"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setReworkComplaint(null)}
                    className="px-3 py-1.5 rounded bg-surface-elevated text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleValidate(reworkComplaint.id, "REJECT_REWORK")}
                    disabled={submittingAction || !reworkReason.trim()}
                    className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {submittingAction ? "Submitting..." : "Send Back for Rework"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
