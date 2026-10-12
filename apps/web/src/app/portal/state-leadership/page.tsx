"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/command-center/Header";
import {
  Award,
  Activity,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BarChart3,
  Globe2,
  Layers,
  ChevronRight,
  ExternalLink,
  Flame,
  RotateCcw,
  RefreshCw,
  Search,
} from "lucide-react";
import { HaryanaGovernanceMap } from "@/components/map/HaryanaGovernanceMap";

export default function StateLeadershipPortal() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stateSummary, setStateSummary] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchDistrict, setSearchDistrict] = useState<string>("");

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

  const loadStateData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Fetch State Leadership Summary
      const sumRes = await fetch("/api/v1/governance/state-summary", { headers });
      if (sumRes.ok) {
        setStateSummary(await sumRes.json());
      }

      // 2. Fetch Statewide complaints
      const compRes = await fetch("/api/v1/complaints?limit=100", { headers });
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
    loadStateData();
  }, [token]);

  const summary = stateSummary?.summary || {
    totalComplaints: complaints.length,
    activeComplaints: complaints.filter((c) => c.status !== "RESOLVED").length,
    awaitingValidation: complaints.filter((c) => c.status === "AWAITING_VALIDATION").length,
    resolvedComplaints: complaints.filter((c) => c.status === "RESOLVED").length,
    reopenedComplaints: complaints.filter((c) => c.status === "REOPENED").length,
    resolutionRatePct: complaints.length > 0 ? ((complaints.filter((c) => c.status === "RESOLVED").length / complaints.length) * 100).toFixed(1) : 0,
  };

  const districtList = (stateSummary?.districtPerformance || []).filter((d: any) =>
    searchDistrict ? d.name.toLowerCase().includes(searchDistrict.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award className="w-3.5 h-3.5" />
              <span>APEX STATE COMMAND • CMO & CHIEF SECRETARY DASHBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              State Governance Intelligence & Oversight
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Statewide Command Terminal | Cross-District Telemetry for 22 Districts of Haryana | Sector 17, Chandigarh
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadStateData}
              className="p-2 rounded-lg bg-surface-elevated border border-surface-border text-slate-300 hover:text-white"
              title="Refresh State Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STATE NODE: ONLINE (99.99%)</span>
            </div>
          </div>
        </div>

        {/* Macro KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Total Grievances</p>
            <p className="text-2xl font-black text-white font-mono">{summary.totalComplaints}</p>
            <span className="text-[10px] text-slate-500 font-mono">Across 22 Districts</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Active In Field</p>
            <p className="text-2xl font-black text-cyan-400 font-mono">{summary.activeComplaints}</p>
            <span className="text-[10px] text-slate-500 font-mono">Operational units</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Awaiting Validation</p>
            <p className="text-2xl font-black text-purple-400 font-mono">{summary.awaitingValidation}</p>
            <span className="text-[10px] text-slate-500 font-mono">Proof submitted</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Resolved & Closed</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">{summary.resolvedComplaints}</p>
            <span className="text-[10px] text-slate-500 font-mono">Verified signoff</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Reopened Issues</p>
            <p className="text-2xl font-black text-amber-400 font-mono">{summary.reopenedComplaints}</p>
            <span className="text-[10px] text-slate-500 font-mono">Citizen review</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-base border border-surface-border space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-mono">State Resolution %</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">{summary.resolutionRatePct}%</p>
            <span className="text-[10px] text-slate-500 font-mono">State SLA Target &gt; 90%</span>
          </div>
        </div>

        {/* Haryana Spatial Intelligence & GIS Map */}
        <div className="space-y-2">
          <HaryanaGovernanceMap userRole="STATE_LEADERSHIP" />
        </div>

        {/* 22 Districts Performance & Escalations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: 22 Districts Performance Matrix */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-surface-base border border-surface-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>22 Districts Operational Performance Matrix</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time grievance load and resolution speed comparison across Haryana
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  placeholder="Filter district..."
                  className="p-1.5 rounded bg-slate-900 border border-surface-border text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 border-b border-surface-border font-mono uppercase sticky top-0 bg-surface-base">
                  <tr>
                    <th className="py-2 px-3">District</th>
                    <th className="py-2 px-3">Total Cases</th>
                    <th className="py-2 px-3">Active</th>
                    <th className="py-2 px-3">Resolved</th>
                    <th className="py-2 px-3">Resolution Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60">
                  {districtList.map((d: any) => {
                    const pct = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
                    return (
                      <tr key={d.name} className="hover:bg-surface-elevated/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {d.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{d.total}</td>
                        <td className="py-2.5 px-3 font-mono text-cyan-400">{d.active}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{d.resolved}</td>
                        <td className="py-2.5 px-3 w-40">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface-elevated h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.max(5, pct)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 w-8">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Col: Critical Escalations Queue */}
          <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>State Escalation Queue</span>
                </h3>
                <p className="text-[11px] text-slate-400">Critical priority & reopened cases</p>
              </div>
              <span className="text-xs font-mono text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-950 border border-rose-500/40">
                {stateSummary?.escalations?.length ?? complaints.filter((c) => c.priority === "CRITICAL" || c.status === "REOPENED").length}
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto">
              {(stateSummary?.escalations || complaints.filter((c) => c.priority === "CRITICAL" || c.status === "REOPENED")).map((esc: any) => (
                <div key={esc.id} className="p-3 rounded-lg bg-surface-elevated/40 border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-rose-300">{esc.trackingId || esc.tracking_id}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-600/40 font-bold">
                      {esc.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-snug">{esc.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-surface-border/40 font-mono">
                    <span>{esc.district || esc.district_name}</span>
                    <span>{esc.department || esc.department_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* State Audit Trail Feed */}
        <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Statewide Audit & Accountability Activity Feed</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Immutable chronological log of all state transitions, officer dispatches, and supervisor signoffs
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Realtime Event Bus</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
            {(stateSummary?.recentActivity || []).map((act: any) => (
              <div key={act.id} className="p-3 rounded-lg bg-surface-elevated/30 border border-surface-border text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono font-bold text-cyan-400">{act.eventType}</span>
                  <span className="font-mono text-slate-500">
                    {new Date(act.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Actor: <strong className="text-white">{act.actorType}</strong> ({act.actorId})
                </p>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Record: #{act.entityId} {act.details?.tracking_id ? `(${act.details.tracking_id})` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
