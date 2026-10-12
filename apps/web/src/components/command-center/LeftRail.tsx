"use client";

import React, { useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  CheckSquare,
  Crosshair,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Layers,
  Map,
  MapPin,
  Radio,
  Route,
  Shield,
  Truck,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";

export const LeftRail: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"layers" | "districts" | "filters" | "candidates">("layers");
  const [candidateFilter, setCandidateFilter] = useState<"ALL" | "PENDING_REVIEW" | "CONFIRMED">("ALL");

  const {
    snapshot,
    operationalRole,
    layers,
    toggleLayer,
    filters,
    setFilter,
    selectedDistrict,
    selectDistrict,
    triggerFlyTo,
    candidates,
    selectedCandidate,
    selectCandidate,
    confirmCandidate,
    rejectCandidate,
  } = useWorldStore();

  const districts = snapshot?.districts || [];
  const pendingCandidates = candidates.filter((c) => c.status === "PENDING_REVIEW");

  return (
    <aside className="w-80 border-r border-surface-border bg-surface-base/80 backdrop-blur flex flex-col shrink-0 overflow-hidden select-none z-20">
      {/* Role Notice Banner */}
      {operationalRole === "CITIZEN" && (
        <div className="bg-cyan-950/40 border-b border-cyan-800/40 p-2.5 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">PUBLIC CITIZEN VIEW</span>
          </div>
          <Link
            href="/track?id=REP-R17-001"
            className="text-[10px] text-cyan-400 hover:text-cyan-200 underline font-semibold"
          >
            Track Reports
          </Link>
        </div>
      )}

      {operationalRole === "RESPONDER" && (
        <div className="bg-amber-950/40 border-b border-amber-800/40 p-2.5 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">TACTICAL RESPONDER VIEW</span>
          </div>
          <span className="text-[10px] text-amber-400">UNIT 4-BRAVO</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-surface-border bg-surface-elevated/40 p-1 gap-1">
        <button
          onClick={() => setActiveTab("layers")}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${
            activeTab === "layers"
              ? "bg-surface-elevated text-slate-100 shadow-sm border border-surface-borderHover"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-3 h-3 text-blue-400" />
          Layers
        </button>
        <button
          onClick={() => setActiveTab("districts")}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${
            activeTab === "districts"
              ? "bg-surface-elevated text-slate-100 shadow-sm border border-surface-borderHover"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MapPin className="w-3 h-3 text-emerald-400" />
          Districts
        </button>
        {operationalRole !== "CITIZEN" && (
          <button
            onClick={() => setActiveTab("candidates")}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded flex items-center justify-center gap-1 transition-colors relative ${
              activeTab === "candidates"
                ? "bg-surface-elevated text-slate-100 shadow-sm border border-surface-borderHover"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            Evidence
            {pendingCandidates.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab("filters")}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${
            activeTab === "filters"
              ? "bg-surface-elevated text-slate-100 shadow-sm border border-surface-borderHover"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Filter className="w-3 h-3 text-amber-400" />
          Filters
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition ml-0.5"
            title="Collapse Sidebar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* TAB 1: LAYERS */}
        {activeTab === "layers" && (
          <div className="space-y-4">
            {/* Base Geographic Layers */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry mb-1.5">
                Base Spatial Layers
              </div>
              <div className="space-y-1">
                <LayerToggleItem
                  icon={<Map className="w-3.5 h-3.5 text-slate-400" />}
                  label="Terrain & Globe Surface"
                  checked={layers.terrain}
                  onChange={() => toggleLayer("terrain")}
                />
                <LayerToggleItem
                  icon={<Building className="w-3.5 h-3.5 text-slate-400" />}
                  label="3D Buildings (25 Extruded)"
                  checked={layers.buildings}
                  onChange={() => toggleLayer("buildings")}
                  badge="3D"
                />
                <LayerToggleItem
                  icon={<Route className="w-3.5 h-3.5 text-emerald-400" />}
                  label="Roads & Bridges (20+ Segments)"
                  checked={layers.roads}
                  onChange={() => toggleLayer("roads")}
                  badge="NET"
                />
                <LayerToggleItem
                  icon={<MapPin className="w-3.5 h-3.5 text-blue-400" />}
                  label="District Boundaries"
                  checked={layers.districts}
                  onChange={() => toggleLayer("districts")}
                />
              </div>
            </div>

            {/* Operational Entity Layers */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry mb-1.5">
                Operational Twin Layers
              </div>
              <div className="space-y-1">
                <LayerToggleItem
                  icon={<Building className="w-3.5 h-3.5 text-red-400" />}
                  label="Hospitals & Trauma Centers"
                  checked={layers.hospitals}
                  onChange={() => toggleLayer("hospitals")}
                  badge="4"
                />
                <LayerToggleItem
                  icon={<Shield className="w-3.5 h-3.5 text-amber-400" />}
                  label="Emergency & Fire Stations"
                  checked={layers.emergencyStations}
                  onChange={() => toggleLayer("emergencyStations")}
                  badge="3"
                />
                {operationalRole !== "CITIZEN" ? (
                  <>
                    <LayerToggleItem
                      icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}
                      label="Power & Water Utilities"
                      checked={layers.utilities}
                      onChange={() => toggleLayer("utilities")}
                      badge="5"
                    />
                    <LayerToggleItem
                      icon={<Truck className="w-3.5 h-3.5 text-blue-400" />}
                      label="Operational Assets (Ambulances)"
                      checked={layers.assets}
                      onChange={() => toggleLayer("assets")}
                      badge="12"
                    />
                  </>
                ) : (
                  <div className="p-2 rounded bg-surface-card/40 border border-surface-border text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-slate-600" />
                    <span>Confidential utilities & assets hidden</span>
                  </div>
                )}
                <LayerToggleItem
                  icon={<AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  label="Active Incidents (Alert Halo)"
                  checked={layers.incidents}
                  onChange={() => toggleLayer("incidents")}
                  badge="3"
                />
                {operationalRole !== "CITIZEN" && (
                  <LayerToggleItem
                    icon={<Radio className="w-3.5 h-3.5 text-cyan-400" />}
                    label="Candidate Incidents (Field Ingest)"
                    checked={layers.candidates}
                    onChange={() => toggleLayer("candidates")}
                    badge={candidates.length.toString()}
                  />
                )}
              </div>
            </div>

            {/* Analytical Overlays */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry mb-1.5">
                Analytical / Risk Layers
              </div>
              <div className="space-y-1">
                <LayerToggleItem
                  icon={<Flame className="w-3.5 h-3.5 text-purple-400" />}
                  label="Incident Density & Risk Heatmap"
                  checked={layers.riskHeatmap}
                  onChange={() => toggleLayer("riskHeatmap")}
                  badge="H3"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DISTRICTS OVERVIEW */}
        {activeTab === "districts" && (
          <div className="space-y-2.5">
            <p className="text-[11px] text-slate-400">
              Select a district to view operational health, incident load, and zoom the 3D viewport.
            </p>
            {districts.map((d) => {
              const isSelected = selectedDistrict?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    selectDistrict(d);
                    triggerFlyTo(d.id, "district");
                  }}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-surface-elevated border-blue-500/60 shadow-md"
                      : "glass-panel hover:border-surface-borderHover"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-200 uppercase mono-telemetry">
                      {d.name}
                    </span>
                    <Badge
                      variant={
                        d.status === "STABLE"
                          ? "nominal"
                          : d.status === "ELEVATED_RISK"
                          ? "warning"
                          : "critical"
                      }
                      size="sm"
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-surface-border text-[11px] mono-telemetry">
                    <div>
                      <div className="text-slate-400 text-[10px]">Score</div>
                      <div className="font-bold text-slate-200">
                        {(d.operationalScore * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Incidents</div>
                      <div
                        className={`font-bold ${
                          d.incidentCount > 0 ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {d.incidentCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Pop.</div>
                      <div className="font-bold text-slate-300">
                        {(d.populationEstimate / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: FILTERS */}
        {activeTab === "filters" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mono-telemetry block mb-1">
                Incident Severity
              </label>
              <select
                value={filters.incidentSeverity}
                onChange={(e) => setFilter("incidentSeverity", e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mono-telemetry block mb-1">
                Asset Availability
              </label>
              <select
                value={filters.assetAvailability}
                onChange={(e) => setFilter("assetAvailability", e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Assets</option>
                <option value="AVAILABLE">Available Only</option>
                <option value="ENGAGED">Engaged / En Route</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mono-telemetry block mb-1">
                Facility Type
              </label>
              <select
                value={filters.facilityType}
                onChange={(e) => setFilter("facilityType", e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Facilities</option>
                <option value="HOSPITAL">Hospitals Only</option>
                <option value="EMERGENCY_STATION">Emergency Stations</option>
                <option value="FACILITY">Civic / Infrastructure</option>
                <option value="UTILITY_NODE">Utilities</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setFilter("incidentSeverity", "ALL");
                  setFilter("assetAvailability", "ALL");
                  setFilter("facilityType", "ALL");
                }}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded bg-surface-elevated/40"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: CANDIDATE INCIDENTS (PHASE 3) */}
        {activeTab === "candidates" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-surface-border">
              <div>
                <span className="text-xs font-bold text-slate-200">Field Candidates</span>
                <span className="text-[10px] text-cyan-400 font-mono ml-2">({candidates.length})</span>
              </div>
              <Link
                href="/report"
                className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 hover:border-cyan-400 transition-colors flex items-center gap-1 font-mono"
              >
                <span>+ Report</span>
              </Link>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-0.5 rounded bg-surface-elevated/50 border border-surface-border text-[10px] font-mono">
              {(["ALL", "PENDING_REVIEW", "CONFIRMED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCandidateFilter(filter)}
                  className={`flex-1 py-1 rounded transition-colors ${
                    candidateFilter === filter
                      ? "bg-surface-elevated text-cyan-300 font-bold border border-cyan-800/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {filter === "ALL" ? "All" : filter === "PENDING_REVIEW" ? "Pending" : "Confirmed"}
                </button>
              ))}
            </div>

            {/* Candidates List */}
            {candidates.filter(
              (c) => candidateFilter === "ALL" || c.status === candidateFilter
            ).length === 0 ? (
              <div className="p-4 rounded-lg bg-surface-card/60 border border-surface-border text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-sm text-slate-400">
                  📡
                </div>
                <p className="text-xs text-slate-300 font-medium">No candidates in this view</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Field observations submitted via the evidence portal are automatically ingested and placed here as AI candidates.
                </p>
                <Link
                  href="/report"
                  className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono hover:bg-cyan-500/30 transition-colors"
                >
                  + Submit Field Observation
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {candidates
                  .filter((c) => candidateFilter === "ALL" || c.status === candidateFilter)
                  .map((cand) => {
                    const isSelected = selectedCandidate?.id === cand.id;
                    const isPending = cand.status === "PENDING_REVIEW";
                    return (
                      <div
                        key={cand.id}
                        onClick={() => {
                          selectCandidate(cand);
                          if (cand.geometry) {
                            triggerFlyTo(cand.id, "candidate");
                          }
                        }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-cyan-950/40 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                            : "bg-surface-card/70 border-surface-border hover:border-surface-borderHover hover:bg-surface-elevated/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              cand.severityHint === "CRITICAL"
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : cand.severityHint === "HIGH"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-blue-950 text-blue-300 border border-blue-800"
                            }`}
                          >
                            {cand.severityHint || "HIGH"}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              cand.status === "CONFIRMED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : cand.status === "REJECTED"
                                ? "bg-slate-900 text-slate-400 border border-slate-700"
                                : "bg-amber-950 text-amber-300 border border-amber-800/80 animate-pulse"
                            }`}
                          >
                            {cand.status === "PENDING_REVIEW" ? "PENDING REVIEW" : cand.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{cand.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                          {cand.summary}
                        </p>

                        <div className="mt-2 pt-2 border-t border-surface-border/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Confidence: {Math.round(cand.confidence * 100)}%</span>
                          <span>{cand.resolvedEntityId || "Corridor Match"}</span>
                        </div>

                        {/* Quick Operator Actions */}
                        {isPending && (
                          <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-surface-border/60">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmCandidate(cand.id);
                              }}
                              className="flex-1 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Authorize
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectCandidate(cand.id);
                              }}
                              className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-mono transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

interface LayerToggleItemProps {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
  badge?: string;
}

const LayerToggleItem: React.FC<LayerToggleItemProps> = ({
  icon,
  label,
  checked,
  onChange,
  badge,
}) => {
  return (
    <div
      onClick={onChange}
      className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-surface-elevated/70 cursor-pointer text-xs transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0">{icon}</span>
        <span
          className={`truncate font-medium ${
            checked ? "text-slate-200" : "text-slate-500 line-through opacity-70"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-[10px] text-slate-400 mono-telemetry bg-surface-card px-1.5 py-0.2 rounded">
            {badge}
          </span>
        )}
        {checked ? (
          <Eye className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <EyeOff className="w-3.5 h-3.5 text-slate-600" />
        )}
      </div>
    </div>
  );
};
