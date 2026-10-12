"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Building2,
  Sparkles,
  Layers,
  Network,
  ChevronDown,
  ChevronUp,
  Zap,
  Link2,
} from "lucide-react";

const HARYANA_DEPARTMENTS_LIST = [
  { id: "ALL", name: "All Departments (सभी विभाग — Consolidated View)" },
  { id: "DEPT-PWD", name: "Public Works Department (B&R)" },
  { id: "DEPT-POWER", name: "Haryana Power Utilities (HVPNL / DHBVN / UHBVN)" },
  { id: "DEPT-HEALTH", name: "Department of Health & Family Welfare" },
  { id: "DEPT-DISASTER", name: "Revenue & Disaster Management" },
  { id: "DEPT-POLICE", name: "Haryana Police & Traffic Enforcement" },
  { id: "DEPT-MUNICIPAL", name: "Urban Local Bodies (ULB) & Municipal Corp" },
];

function DepartmentPortalContent() {
  const searchParams = useSearchParams();
  const urlDept = searchParams?.get("department_id");
  const urlTrackingId = searchParams?.get("tracking_id");

  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>(urlDept || "ALL");
  const [highlightTrackingId, setHighlightTrackingId] = useState<string | null>(urlTrackingId || null);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // AI Deduplication & Clustering Mode
  const [viewMode, setViewMode] = useState<"AI_CLUSTERED" | "INDIVIDUAL">("AI_CLUSTERED");
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});

  // Assign Modal (Individual or Cluster)
  const [assigningComplaint, setAssigningComplaint] = useState<any>(null);
  const [assigningCluster, setAssigningCluster] = useState<any>(null);
  const [assignUnitId, setAssignUnitId] = useState("UNIT-AMB-01");
  const [assignOfficerName, setAssignOfficerName] = useState("Officer Vikram Singh");

  // Rework Modal
  const [reworkComplaint, setReworkComplaint] = useState<any>(null);
  const [reworkReason, setReworkReason] = useState("");

  // Escalation Modal
  const [escalatingTarget, setEscalatingTarget] = useState<any>(null);
  const [escalateReason, setEscalateReason] = useState("");

  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trinetra_user");
      const storedToken = localStorage.getItem("trinetra_token") || localStorage.getItem("token");
      if (stored) {
        const u = JSON.parse(stored);
        setAuthUser(u);
        if (u.role === "DEPARTMENT" && u.department_id && !urlDept) {
          setSelectedDept(u.department_id);
        }
      }
      if (storedToken) setToken(storedToken);
    } catch (e) {
      // ignore
    }
  }, [urlDept]);

  useEffect(() => {
    if (urlTrackingId) {
      setHighlightTrackingId(urlTrackingId);
      setFilterTab("ALL");
    }
  }, [urlTrackingId]);

  useEffect(() => {
    if (highlightTrackingId && complaints.length > 0) {
      const match = complaints.find((c) => c.tracking_id === highlightTrackingId);
      if (match) {
        const clusterBaseId = match.incident_id || `INC-${match.district_id}-${match.category.replace('_', '').slice(0, 4)}`;
        setExpandedClusters((prev) => ({ ...prev, [clusterBaseId]: true }));
      }
    }
  }, [highlightTrackingId, complaints]);

  const loadData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const deptQuery = selectedDept === "ALL" ? "?department_id=ALL" : `?department_id=${selectedDept}`;
      const sumDept = selectedDept === "ALL" ? "DEPT-PWD" : selectedDept;

      const [sumRes, compRes] = await Promise.all([
        fetch(`/api/v1/governance/department-summary?department_id=${sumDept}`, { headers }).catch(() => null),
        fetch(`/api/v1/complaints${deptQuery}`, { headers }).catch(() => null),
      ]);

      if (sumRes && sumRes.ok) {
        setSummaryData(await sumRes.json());
      }
      if (compRes && compRes.ok) {
        const data = await compRes.json();
        setComplaints(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Real-time auto-poll every 4 seconds so newly reported citizen cases appear instantly
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedDept, token]);

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

  const handleAssignCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCluster) return;
    setSubmittingAction(true);
    try {
      const items = assigningCluster.complaints;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await Promise.all(
        items.map((c: any) =>
          fetch(`/api/v1/complaints/${c.id}/assign`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              assigned_unit_id: assignUnitId,
              assigned_officer_name: assignOfficerName,
              priority: c.priority,
            }),
          }).catch(() => null)
        )
      );
      setActionSuccess(
        `AI Master Incident [${assigningCluster.clusterId}] and all ${items.length} citizen reports successfully assigned to ${assignUnitId} (${assignOfficerName})!`
      );
      setAssigningCluster(null);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleValidateCluster = async (cluster: any, decision: "APPROVE" | "REJECT_REWORK") => {
    setSubmittingAction(true);
    try {
      const items = cluster.complaints;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await Promise.all(
        items.map((c: any) =>
          fetch(`/api/v1/complaints/${c.id}/validate-resolution`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              decision,
              rejection_reason: decision === "REJECT_REWORK" ? reworkReason : undefined,
            }),
          }).catch(() => null)
        )
      );
      setActionSuccess(
        decision === "APPROVE"
          ? `All ${items.length} citizen reports in Master Incident [${cluster.clusterId}] verified & officially RESOLVED!`
          : `Rework requested for all ${items.length} linked reports in [${cluster.clusterId}].`
      );
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalatingTarget) return;
    setSubmittingAction(true);
    try {
      const isCluster = Boolean(escalatingTarget.complaints);
      const targets = isCluster ? escalatingTarget.complaints : [escalatingTarget];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await Promise.all(
        targets.map((c: any) =>
          fetch(`/api/v1/complaints/${c.id}/escalate`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              reason: escalateReason.trim() || "High-severity civic hazard requiring direct District Magistrate intervention.",
              target_level: "DISTRICT_HQ",
              elevate_priority: true,
            }),
          }).catch(() => null)
        )
      );
      setActionSuccess(
        `Case escalated to District HQ / Deputy Commissioner. Priority upgraded to CRITICAL.`
      );
      setEscalatingTarget(null);
      setEscalateReason("");
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredComplaints = complaints
    .filter((c) => {
      if (filterTab === "ALL") return true;
      if (filterTab === "AWAITING_VALIDATION") return c.status === "AWAITING_VALIDATION";
      if (filterTab === "ACTIVE") return c.status === "ASSIGNED" || c.status === "IN_PROGRESS";
      if (filterTab === "SUBMITTED") return c.status === "SUBMITTED" || c.status === "ACKNOWLEDGED";
      if (filterTab === "RESOLVED") return c.status === "RESOLVED";
      return true;
    })
    .sort((a, b) => {
      if (highlightTrackingId) {
        if (a.tracking_id === highlightTrackingId) return -1;
        if (b.tracking_id === highlightTrackingId) return 1;
      }
      return 0;
    });

  // Group Complaints into AI Clusters by Category & District
  const clusters = React.useMemo(() => {
    const map: Record<string, any> = {};
    filteredComplaints.forEach((c) => {
      const clusterBaseId = c.incident_id || `INC-${c.district_id}-${c.category.replace('_', '').slice(0, 4)}`;
      const key = `${clusterBaseId}_${c.district_id}_${(c.locality || "zone").slice(0, 10)}`;
      if (!map[key]) {
        map[key] = {
          clusterId: clusterBaseId,
          uniqueKey: key,
          category: c.category,
          districtId: c.district_id,
          districtName: c.district_name,
          departmentId: c.department_id,
          departmentName: c.department_name,
          representativeTitle: c.title,
          status: c.status,
          priority: c.priority,
          reportsCount: 0,
          assignedUnitId: c.assigned_unit_id,
          assignedOfficerName: c.assigned_officer_name,
          sop_checklist: c.sop_checklist,
          complaints: [],
        };
      }
      map[key].reportsCount += 1;
      map[key].complaints.push(c);
      if (c.status === "AWAITING_VALIDATION") map[key].status = "AWAITING_VALIDATION";
      else if (c.status === "IN_PROGRESS" && map[key].status !== "AWAITING_VALIDATION") map[key].status = "IN_PROGRESS";
    });
    return Object.values(map);
  }, [filteredComplaints]);

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Department Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DEPARTMENTAL OPERATIONAL COMMAND • HARYANA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{HARYANA_DEPARTMENTS_LIST.find((d) => d.id === selectedDept)?.name.split("(")[0] || "Department"}</span>
              <span className="text-sm font-normal text-slate-400 font-mono">({selectedDept})</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Active Jurisdiction: <strong className="text-purple-300 font-mono">{selectedDept}</strong> | Supervisor: <span className="text-slate-200">{authUser?.display_name || "Department Lead"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1.5 shadow-sm">
              <Building2 className="w-4 h-4 text-purple-400 ml-1" />
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setHighlightTrackingId(null);
                }}
                className="bg-transparent text-white text-xs font-semibold outline-none py-1 px-1 cursor-pointer"
              >
                {HARYANA_DEPARTMENTS_LIST.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadData}
              className="p-2.5 rounded-lg bg-surface-elevated border border-surface-border text-slate-300 hover:text-white transition-colors"
              title="Refresh Department Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Highlight Alert for newly reported citizen grievance */}
        {highlightTrackingId && (
          <div className="p-4 rounded-xl bg-purple-950/50 border border-purple-500/50 text-purple-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
              <span>
                Citizen Report Received: Complaint <strong className="font-mono text-white text-xs">{highlightTrackingId}</strong> is directly routed & ready in this department&apos;s queue below!
              </span>
            </div>
            <button
              onClick={() => setHighlightTrackingId(null)}
              className="text-purple-400 hover:text-white px-2 py-0.5 rounded bg-purple-900/40 text-[11px]"
            >
              ✕ Dismiss
            </button>
          </div>
        )}

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

        {/* View Mode Architecture: AI Clustered vs Individual */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-elevated/40 p-2.5 rounded-xl border border-surface-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono tracking-wider ml-1">
              View Mode:
            </span>
            <button
              onClick={() => setViewMode("AI_CLUSTERED")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "AI_CLUSTERED"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]"
                  : "bg-surface-base text-slate-400 hover:text-white"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>🎯 AI Deduplicated Clusters ({clusters.length} Master Missions)</span>
            </button>
            <button
              onClick={() => setViewMode("INDIVIDUAL")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "INDIVIDUAL"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]"
                  : "bg-surface-base text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📋 Individual Reports ({filteredComplaints.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-purple-300 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>AI Deduplication: Multiple reports on same issue unified into 1 ticket</span>
          </div>
        </div>

        {/* AI Clustered & Deduplicated View */}
        {viewMode === "AI_CLUSTERED" ? (
          <div className="space-y-3">
            {clusters.map((cluster, idx) => {
              const isExpanded = Boolean(expandedClusters[cluster.clusterId]);
              return (
                <div
                  key={cluster.uniqueKey || `${cluster.clusterId}-${idx}`}
                  className="p-4 sm:p-5 rounded-xl bg-surface-base border border-purple-500/30 hover:border-purple-500/50 transition-all space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {cluster.clusterId}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {cluster.category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono">
                          {cluster.districtName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            cluster.status === "RESOLVED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : cluster.status === "AWAITING_VALIDATION"
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              : cluster.status === "IN_PROGRESS"
                              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {cluster.status}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {cluster.representativeTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]">
                          <Users className="w-3 h-3" />
                          <span>👥 {cluster.reportsCount} Citizens Reported (AI Clustered)</span>
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          Assigned: <strong className="text-cyan-300">{cluster.assignedUnitId || "Unassigned"}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {cluster.status === "AWAITING_VALIDATION" ? (
                        <button
                          onClick={() => handleValidateCluster(cluster, "APPROVE")}
                          disabled={submittingAction}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold shadow"
                        >
                          Approve All ({cluster.reportsCount})
                        </button>
                      ) : cluster.status === "SUBMITTED" || cluster.status === "ACKNOWLEDGED" ? (
                        <button
                          onClick={() => {
                            setAssigningCluster(cluster);
                            setAssigningComplaint(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
                        >
                          Assign Unit ({cluster.reportsCount})
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setAssigningCluster(cluster);
                            setAssigningComplaint(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Reassign
                        </button>
                      )}

                      <button
                        onClick={() => setEscalatingTarget(cluster)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1"
                        title="Escalate to District Magistrate"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Escalate</span>
                      </button>

                      <button
                        onClick={() =>
                          setExpandedClusters((prev) => ({
                            ...prev,
                            [cluster.clusterId]: !prev[cluster.clusterId],
                          }))
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
                      >
                        <span>{isExpanded ? "Hide Reports" : `View ${cluster.reportsCount} Reports`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Citizen Reports Breakdown */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-surface-border/40 space-y-2 animate-in fade-in">
                      <p className="text-[11px] text-purple-300 font-mono">
                        ⚡ TRINETRA AI Deduplicated these {cluster.reportsCount} citizen submissions into this master operational mission:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {cluster.complaints.map((c: any) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-lg bg-slate-900/80 border border-surface-border text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-mono">
                              <span className="font-bold text-emerald-400 text-[11px]">{c.tracking_id}</span>
                              <span className="text-[10px] text-slate-400">{c.district_name}</span>
                            </div>
                            <p className="text-[11px] text-white truncate font-medium">{c.title}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-surface-border/40">
                              <span>Citizen: {c.citizen_name || "Public"}</span>
                              <span className="text-amber-400 font-mono">{c.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Individual Complaints Table */
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
                  {filteredComplaints.map((c) => {
                    const isHighlighted = c.tracking_id === highlightTrackingId;
                    return (
                      <tr
                        key={c.id}
                        className={`transition-colors ${
                          isHighlighted
                            ? "bg-purple-950/70 border-l-4 border-l-purple-400 ring-1 ring-purple-500/50"
                            : "hover:bg-surface-elevated/30"
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-emerald-400 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{c.tracking_id}</span>
                            {isHighlighted && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500 text-white animate-pulse">
                                NEW REPORT
                              </span>
                            )}
                          </div>
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
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status === "AWAITING_VALIDATION" ? (
                              <>
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
                              </>
                            ) : c.status === "SUBMITTED" || c.status === "ACKNOWLEDGED" ? (
                              <button
                                onClick={() => {
                                  setAssigningComplaint(c);
                                  setAssigningCluster(null);
                                }}
                                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
                              >
                                Assign Unit
                              </button>
                            ) : null}

                            <button
                              onClick={() => setEscalatingTarget(c)}
                              className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-semibold"
                              title="Escalate Case"
                            >
                              ⚡
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assign Unit Modal (Single Complaint or Cluster) */}
        {(assigningComplaint || assigningCluster) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface-base border border-purple-500/40 rounded-xl p-5 max-w-md w-full space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-400" />
                <span>
                  {assigningCluster
                    ? `Assign Field Unit to Entire AI Cluster (${assigningCluster.reportsCount} Reports)`
                    : "Assign Field Unit to Grievance"}
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                {assigningCluster
                  ? `${assigningCluster.clusterId} — ${assigningCluster.representativeTitle}`
                  : `${assigningComplaint.tracking_id} — ${assigningComplaint.title}`}
              </p>

              <form onSubmit={assigningCluster ? handleAssignCluster : handleAssign} className="space-y-3">
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
                    onClick={() => {
                      setAssigningComplaint(null);
                      setAssigningCluster(null);
                    }}
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

        {/* Escalate to DC Modal */}
        {escalatingTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface-base border border-amber-500/50 rounded-xl p-5 max-w-md w-full space-y-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Escalate Incident to District Magistrate (HQ)</span>
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                {escalatingTarget.clusterId || escalatingTarget.tracking_id} — {escalatingTarget.representativeTitle || escalatingTarget.title}
              </p>

              <form onSubmit={handleEscalate} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Escalation Justification</label>
                  <textarea
                    rows={3}
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    placeholder="e.g. Critical life-safety hazard or repeated delays requiring direct DC administrative intervention."
                    className="w-full mt-1 p-2 rounded bg-slate-900 border border-surface-border text-xs text-white"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEscalatingTarget(null);
                      setEscalateReason("");
                    }}
                    className="px-3 py-1.5 rounded bg-surface-elevated text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold"
                  >
                    {submittingAction ? "Escalating..." : "Confirm Escalation to DC"}
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

export default function DepartmentPortal() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-space-950 text-slate-100 flex items-center justify-center font-mono text-sm">
          Loading Department Command Center...
        </div>
      }
    >
      <DepartmentPortalContent />
    </Suspense>
  );
}
