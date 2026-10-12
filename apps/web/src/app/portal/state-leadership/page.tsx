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
  TrendingUp,
  MapPin,
  CheckCircle,
  AlertCircle,
  FileText,
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900 pb-12">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-blue-50/40 border border-blue-100 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Background watermark */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/haryana_secretariat.jpg"
            alt="Haryana Secretariat"
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
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>APEX STATE COMMAND • CMO & CHIEF SECRETARY DASHBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              State Governance Intelligence & Oversight
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Statewide Telemetry for 22 Districts of Haryana | Civil Secretariat, Chandigarh
            </p>
          </div>

          <div className="flex items-center gap-2 z-10">
            <button
              onClick={loadStateData}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
              title="Refresh State Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>STATE NODE: ONLINE (99.99%)</span>
            </div>
          </div>
        </div>

        {/* Macro KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Grievances</p>
            <p className="text-2xl font-black text-slate-900">{summary.totalComplaints}</p>
            <span className="text-[10px] text-slate-400 font-medium">Across 22 Districts</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Active In Field</p>
            <p className="text-2xl font-black text-blue-600">{summary.activeComplaints}</p>
            <span className="text-[10px] text-slate-400 font-medium">Operational units</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Awaiting Validation</p>
            <p className="text-2xl font-black text-amber-600">{summary.awaitingValidation}</p>
            <span className="text-[10px] text-slate-400 font-medium">Proof submitted</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Resolved & Closed</p>
            <p className="text-2xl font-black text-emerald-600">{summary.resolvedComplaints}</p>
            <span className="text-[10px] text-slate-400 font-medium">Verified signoff</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">Reopened Issues</p>
            <p className="text-2xl font-black text-rose-600">{summary.reopenedComplaints}</p>
            <span className="text-[10px] text-slate-400 font-medium">Citizen review</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <p className="text-[11px] text-slate-500 uppercase font-semibold">State Resolution %</p>
            <p className="text-2xl font-black text-emerald-600">{summary.resolutionRatePct}%</p>
            <span className="text-[10px] text-slate-400 font-medium">State Target &gt; 90%</span>
          </div>
        </div>

        {/* Haryana Spatial Intelligence & GIS Map */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <HaryanaGovernanceMap userRole="STATE_LEADERSHIP" />
        </div>

        {/* 22 Districts Performance & Escalations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: 22 Districts Operational Performance Matrix */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>22 Districts Operational Performance Matrix</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Real-time grievance load and resolution speed comparison across Haryana
                </p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  placeholder="Filter district..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-500 border-b border-slate-200 uppercase font-bold sticky top-0 bg-white">
                  <tr>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Total Cases</th>
                    <th className="py-2.5 px-3">Active</th>
                    <th className="py-2.5 px-3">Resolved</th>
                    <th className="py-2.5 px-3">Resolution Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {districtList.map((d: any) => {
                    const pct = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
                    return (
                      <tr key={d.name} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {d.name}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-600">{d.total}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-600">{d.active}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">{d.resolved}</td>
                        <td className="py-2.5 px-3 w-44">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.max(5, pct)}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-slate-700 w-8">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Col: High-Priority Statewide Alerts */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Apex Governance Alerts</span>
                </h3>
                <p className="text-[11px] text-slate-500">Critical incidents requiring CMO review</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                LIVE
              </span>
            </div>

            <div className="space-y-3">
              {(stateSummary?.criticalAlerts || []).slice(0, 5).map((alt: any) => (
                <div
                  key={alt.id}
                  className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-xs font-bold text-rose-700">{alt.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {alt.severity || "CRITICAL"}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug">{alt.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{alt.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-rose-200/60">
                    <span>District: <strong className="text-slate-800">{alt.district_id}</strong></span>
                    <span className="text-rose-700 font-semibold">{alt.status}</span>
                  </div>
                </div>
              ))}
              {(!stateSummary?.criticalAlerts || stateSummary.criticalAlerts.length === 0) && (
                <div className="p-6 text-center text-xs text-slate-500 space-y-1 bg-slate-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-bold text-slate-700">All Statewide SLAs Within Normal Parameters</p>
                  <p className="text-[11px]">No critical apex escalations pending.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
