"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/command-center/Header";
import {
  Building2,
  ShieldAlert,
  Clock,
  AlertCircle,
  CheckCircle2,
  Activity,
  Filter,
  MapPin,
  ChevronRight,
  UserCheck,
  Send,
  Layers,
  FileText,
  RefreshCw,
  Award,
  Link2,
  Brain,
  Sparkles,
} from "lucide-react";
import { AIDecisionPanel } from "@/components/complaints/AIDecisionPanel";
import { HaryanaGovernanceMap } from "@/components/map/HaryanaGovernanceMap";

export default function DistrictAdminPortal() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [districtInfo, setDistrictInfo] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDept, setFilterDept] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Correlation Modal
  const [correlatingComplaint, setCorrelatingComplaint] = useState<any>(null);
  const [incidentTargetId, setIncidentTargetId] = useState("inc-1047");
  const [viewingAIComplaint, setViewingAIComplaint] = useState<any | null>(null);

  const districtId = authUser?.district_id || "HR-GU";

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

  const loadDistrictData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. District Profile
      const distRes = await fetch(`/api/v1/governance/districts/${districtId}`);
      if (distRes.ok) {
        setDistrictInfo(await distRes.json());
      }

      // 2. District Summary KPIs
      const sumRes = await fetch(`/api/v1/governance/district-summary?district_id=${districtId}`, { headers });
      if (sumRes.ok) {
        setSummaryData(await sumRes.json());
      }

      // 3. District Complaints
      const compRes = await fetch(`/api/v1/complaints?district_id=${districtId}`, { headers });
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
    loadDistrictData();
  }, [districtId, token]);

  const handleAcknowledge = async (complaintId: string) => {
    if (!token) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/complaints/${complaintId}/transition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_status: "ACKNOWLEDGED",
          reason: "District Administration logged and verified grievance coordinates.",
        }),
      });
      if (res.ok) {
        setActionSuccess("Grievance officially ACKNOWLEDGED by District Administration.");
        loadDistrictData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCorrelate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correlatingComplaint || !token) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/complaints/${correlatingComplaint.id}/correlate-incident`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          incident_id: incidentTargetId,
          action: "LINK_EXISTING",
          rationale: "Corroborated by spatial proximity and matching flood domain.",
        }),
      });
      if (res.ok) {
        setActionSuccess(`Complaint successfully linked to GIS Incident #${incidentTargetId}.`);
        setCorrelatingComplaint(null);
        loadDistrictData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (filterDept !== "ALL" && c.department_id !== filterDept) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* District Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>DISTRICT ADMINISTRATION & COLLECTORATE COMMAND</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {districtInfo?.name || "Gurugram"} District Command Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Collectorate Scope: <strong className="text-blue-300 font-mono">{districtId}</strong> | Deputy Commissioner Office | Division: {districtInfo?.division || "Gurugram"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDistrictData}
              className="p-2 rounded-lg bg-surface-elevated border border-surface-border text-slate-300 hover:text-white"
              title="Refresh District Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DISTRICT SLA: 94.2%</span>
            </div>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-mono">Total District Cases</p>
            <p className="text-2xl font-black text-white font-mono">{summaryData?.totalCases ?? complaints.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-mono">Incoming / Unacknowledged</p>
            <p className="text-2xl font-black text-amber-400 font-mono">
              {summaryData?.byStatus?.SUBMITTED ?? complaints.filter((c) => c.status === "SUBMITTED").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-mono">In Field Resolution</p>
            <p className="text-2xl font-black text-sky-400 font-mono">
              {(summaryData?.byStatus?.IN_PROGRESS || 0) + (summaryData?.byStatus?.ASSIGNED || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[11px] text-slate-400 uppercase font-mono">Verified Closed</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              {summaryData?.byStatus?.RESOLVED ?? complaints.filter((c) => c.status === "RESOLVED").length}
            </p>
          </div>
        </div>

        {/* District Spatial Overview */}
        <div className="space-y-2">
          <HaryanaGovernanceMap userRole="DISTRICT_ADMIN" />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-base border border-surface-border text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-white">Status:</span>
            {["ALL", "SUBMITTED", "IN_PROGRESS", "AWAITING_VALIDATION", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded transition-colors font-mono ${
                  filterStatus === st ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white hover:bg-surface-elevated"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Department:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="p-1 rounded bg-slate-900 border border-surface-border text-xs text-white"
            >
              <option value="ALL">All Departments</option>
              <option value="DEPT-PWD">PWD</option>
              <option value="DEPT-HEALTH">Health</option>
              <option value="DEPT-POLICE">Police</option>
              <option value="DEPT-POWER">Power</option>
              <option value="DEPT-DISASTER">Disaster Mgmt</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 border-b border-surface-border font-mono uppercase">
                <tr>
                  <th className="py-2.5 px-3">Tracking ID</th>
                  <th className="py-2.5 px-3">Title & Category</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">GIS Link</th>
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
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-xs">{c.address || c.district_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-300">
                      {c.department_name}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        c.priority === "CRITICAL" ? "bg-rose-950 text-rose-400 border border-rose-600/40" : "bg-surface-elevated text-slate-300"
                      }`}>
                        {c.priority}
                      </span>
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
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      {c.incident_id ? (
                        <span className="text-cyan-400 font-bold">Linked: #{c.incident_id}</span>
                      ) : (
                        <button
                          onClick={() => setCorrelatingComplaint(c)}
                          className="text-slate-500 hover:text-cyan-400 inline-flex items-center gap-1"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Link Incident</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingAIComplaint(c)}
                          className="p-1 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 hover:text-white"
                          title="Explain AI Triage & Routing Decision"
                        >
                          <Brain className="w-3.5 h-3.5" />
                        </button>
                        {c.status === "SUBMITTED" ? (
                          <button
                            onClick={() => handleAcknowledge(c.id)}
                            disabled={submittingAction}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Tracked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correlate Incident Modal */}
        {correlatingComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface-base border border-cyan-500/40 rounded-xl p-5 max-w-md w-full space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Link Complaint to Spatial Twin Incident</span>
              </h3>
              <p className="text-xs text-slate-300 font-mono">{correlatingComplaint.tracking_id} — {correlatingComplaint.title}</p>

              <form onSubmit={handleCorrelate} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Target Incident ID</label>
                  <input
                    type="text"
                    value={incidentTargetId}
                    onChange={(e) => setIncidentTargetId(e.target.value)}
                    className="w-full mt-1 p-2 rounded bg-slate-900 border border-surface-border text-xs text-white font-mono"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setCorrelatingComplaint(null)}
                    className="px-3 py-1.5 rounded bg-surface-elevated text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold"
                  >
                    {submittingAction ? "Linking..." : "Confirm Correlation Link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Explainable AI Decision Drawer */}
        <AIDecisionPanel
          complaint={viewingAIComplaint}
          isOpen={!!viewingAIComplaint}
          onClose={() => setViewingAIComplaint(null)}
          userRole="DISTRICT_ADMIN"
          onOverrideTriage={async (payload) => {
            try {
              await fetch(`http://localhost:8000/api/v1/complaints/${viewingAIComplaint?.id}/override-triage`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
              });
              loadDistrictData();
            } catch (e) {
              console.error(e);
            }
          }}
        />
      </main>
    </div>
  );
}
