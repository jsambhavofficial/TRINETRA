"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/command-center/Header";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Link2,
  Brain,
  Check,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import { HaryanaGovernanceMap } from "@/components/map/HaryanaGovernanceMap";
import { HARYANA_DISTRICTS } from "@/lib/haryana";
import { AIDecisionPanel } from "@/components/governance/AIDecisionPanel";

export default function DistrictAdminPortal() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string>("HR-GU");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDept, setFilterDept] = useState<string>("ALL");

  // Linking to Incident
  const [correlatingComplaint, setCorrelatingComplaint] = useState<any>(null);
  const [incidentTargetId, setIncidentTargetId] = useState("INC-1047");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Explainable AI Decision Drawer
  const [viewingAIComplaint, setViewingAIComplaint] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trinetra_user");
      const storedToken = localStorage.getItem("trinetra_token");
      if (stored) {
        const u = JSON.parse(stored);
        setAuthUser(u);
        if (u.district_id) setDistrictId(u.district_id);
      }
      if (storedToken) setToken(storedToken);
    } catch (e) {
      // ignore
    }
  }, []);

  const districtInfo = HARYANA_DISTRICTS.find((d) => d.id === districtId);

  const loadDistrictData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [sumRes, compRes] = await Promise.all([
        fetch(`/api/v1/governance/district-summary?district_id=${districtId}`, { headers }),
        fetch(`/api/v1/complaints?district_id=${districtId}`, { headers }),
      ]);

      if (sumRes.ok) setSummaryData(await sumRes.json());
      if (compRes.ok) setComplaints(await compRes.json());
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
    setSubmittingAction(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/complaints/${complaintId}/transition`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          status: "ACKNOWLEDGED",
          notes: "District Collectorate acknowledged complaint into active priority queue.",
        }),
      });
      if (res.ok) {
        setActionSuccess("Complaint successfully acknowledged by District Collectorate.");
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
    if (!correlatingComplaint) return;
    setSubmittingAction(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/complaints/${correlatingComplaint.id}/correlate-incident`, {
        method: "POST",
        headers,
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900 pb-12">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* District Admin Hero Banner */}
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
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>DISTRICT ADMINISTRATION & COLLECTORATE COMMAND</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {districtInfo?.name || "Gurugram"} District Command Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Collectorate Scope: <strong className="text-blue-700 font-mono">{districtId}</strong> | Deputy Commissioner Office | Division: {districtInfo?.division || "Gurugram"}
            </p>
          </div>

          <div className="flex items-center gap-2 z-10">
            <button
              onClick={loadDistrictData}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
              title="Refresh District Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>DISTRICT SLA: 94.2%</span>
            </div>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold hover:text-emerald-950">✕</button>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Total District Cases</p>
            <p className="text-2xl font-black text-slate-900 font-sans">{summaryData?.totalCases ?? complaints.length}</p>
          </div>
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Incoming / Unacknowledged</p>
            <p className="text-2xl font-black text-amber-600 font-sans">
              {summaryData?.byStatus?.SUBMITTED ?? complaints.filter((c) => c.status === "SUBMITTED").length}
            </p>
          </div>
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">In Field Resolution</p>
            <p className="text-2xl font-black text-blue-600 font-sans">
              {(summaryData?.byStatus?.IN_PROGRESS || 0) + (summaryData?.byStatus?.ASSIGNED || 0)}
            </p>
          </div>
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Verified Closed</p>
            <p className="text-2xl font-black text-emerald-600 font-sans">
              {summaryData?.byStatus?.RESOLVED ?? complaints.filter((c) => c.status === "RESOLVED").length}
            </p>
          </div>
        </div>

        {/* District Spatial Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <HaryanaGovernanceMap userRole="DISTRICT_ADMIN" />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <span className="font-bold text-slate-700">Status:</span>
            {["ALL", "SUBMITTED", "IN_PROGRESS", "AWAITING_VALIDATION", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  filterStatus === st
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Department:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold outline-none cursor-pointer"
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
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold tracking-wider text-[11px]">
                  <th className="py-3 px-3">Tracking ID</th>
                  <th className="py-3 px-3">Title & Category</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">GIS Link</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-blue-700 font-bold whitespace-nowrap">
                      {c.tracking_id}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 truncate max-w-xs">{c.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-xs">{c.address || c.district_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-700">
                      {c.department_name}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.priority === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : c.status === "AWAITING_VALIDATION"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : c.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px]">
                      {c.incident_id ? (
                        <span className="text-blue-700 font-bold">Linked: #{c.incident_id}</span>
                      ) : (
                        <button
                          onClick={() => setCorrelatingComplaint(c)}
                          className="text-slate-500 hover:text-blue-600 inline-flex items-center gap-1"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Link Incident</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingAIComplaint(c)}
                          className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                          title="Explain AI Triage & Routing Decision"
                        >
                          <Brain className="w-3.5 h-3.5" />
                        </button>
                        {c.status === "SUBMITTED" ? (
                          <button
                            onClick={() => handleAcknowledge(c.id)}
                            disabled={submittingAction}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Tracked</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-800">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-600" />
                <span>Link Complaint to Spatial Twin Incident</span>
              </h3>
              <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {correlatingComplaint.tracking_id} — {correlatingComplaint.title}
              </p>

              <form onSubmit={handleCorrelate} className="space-y-3 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-700">Target Incident ID</label>
                  <input
                    type="text"
                    value={incidentTargetId}
                    onChange={(e) => setIncidentTargetId(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono outline-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setCorrelatingComplaint(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
              await fetch(`/api/v1/complaints/${viewingAIComplaint?.id}/override-triage`, {
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
