"use client";

import React, { useEffect, useState } from "react";
import { Search, Mic, Command, X, MapPin, AlertTriangle, Building, Truck } from "lucide-react";
import { useWorldStore } from "@/store/useWorldStore";

export const CommandBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { snapshot, selectEntity, selectDistrict, selectIncident, triggerFlyTo } = useWorldStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  // Search through entities, districts, incidents
  const lower = query.toLowerCase();
  const filteredEntities = (snapshot?.entities || [])
    .filter((e) => e.name.toLowerCase().includes(lower) || e.entityType.toLowerCase().includes(lower))
    .slice(0, 5);

  const filteredDistricts = (snapshot?.districts || [])
    .filter((d) => d.name.toLowerCase().includes(lower))
    .slice(0, 3);

  const filteredIncidents = (snapshot?.incidents || [])
    .filter((i) => i.title.toLowerCase().includes(lower) || i.incidentType.toLowerCase().includes(lower))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl glass-panel-elevated rounded-lg shadow-2xl overflow-hidden border border-surface-borderHover">
        <div className="flex items-center px-4 py-3 border-b border-surface-border gap-3 bg-surface-elevated/60">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask TRINETRA anything, or search entities, districts, incidents... (⌘K)"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none mono-telemetry"
          />
          <button
            title="Voice Command (AI Tool Trigger - Phase 9)"
            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-surface-elevated transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {filteredDistricts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry">
                Districts
              </div>
              {filteredDistricts.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    selectDistrict(d);
                    triggerFlyTo(d.id, "district");
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded hover:bg-surface-elevated cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-slate-200 font-medium">{d.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mono-telemetry">
                    Score: {(d.operationalScore * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {filteredIncidents.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry">
                Active Incidents
              </div>
              {filteredIncidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => {
                    selectIncident(inc);
                    triggerFlyTo(inc.id, "incident");
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded hover:bg-surface-elevated cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-200 font-medium">#{inc.incidentNumber} - {inc.title}</span>
                  </div>
                  <span className="text-[11px] text-amber-400 mono-telemetry">{inc.severity}</span>
                </div>
              ))}
            </div>
          )}

          {filteredEntities.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mono-telemetry">
                Facilities & Infrastructure
              </div>
              {filteredEntities.map((ent) => (
                <div
                  key={ent.id}
                  onClick={() => {
                    selectEntity(ent);
                    triggerFlyTo(ent.id, "entity");
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded hover:bg-surface-elevated cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-200 font-medium">{ent.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase mono-telemetry">
                    {ent.entityType} ({ent.status})
                  </span>
                </div>
              ))}
            </div>
          )}

          {filteredDistricts.length === 0 && filteredIncidents.length === 0 && filteredEntities.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              No matching spatial entities found for &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="px-3 py-2 bg-surface-elevated/40 border-t border-surface-border text-[11px] text-slate-500 flex items-center justify-between mono-telemetry">
          <span>Navigation: <kbd className="px-1.5 py-0.5 rounded bg-surface-card text-slate-300">↑↓</kbd> Select: <kbd className="px-1.5 py-0.5 rounded bg-surface-card text-slate-300">↵</kbd></span>
          <span>Close: <kbd className="px-1.5 py-0.5 rounded bg-surface-card text-slate-300">ESC</kbd></span>
        </div>
      </div>
    </div>
  );
};
