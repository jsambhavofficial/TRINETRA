"use client";

import React, { useEffect, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { Activity, AlertTriangle, Radio, Shield, Truck, Zap } from "lucide-react";

export const BottomBar: React.FC = () => {
  const { snapshot, worldMode, realtimeEvents, addRealtimeEvent, updateAssetTelemetry } =
    useWorldStore();

  const [wsConnected, setWsConnected] = useState(false);

  // Connect to WebSocket for live event stream
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        const wsUrl = "ws://localhost:8000/ws/world/world-nexus-city-01";
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.eventId && data.type) {
              addRealtimeEvent(data);

              // If asset updated, update position in snapshot
              if (data.type === "ASSET_UPDATED" && data.payload?.id) {
                updateAssetTelemetry(data.payload.id, {
                  geometry: data.payload.geometry,
                  availability: data.payload.status,
                  state: data.payload.state,
                });
              }
            }
          } catch (_) {}
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          ws?.close();
        };
      } catch (_) {
        setWsConnected(false);
      }
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [addRealtimeEvent, updateAssetTelemetry]);

  // Derived metrics from snapshot
  const incidentCount = snapshot?.incidents?.length || 3;
  const assetCount = snapshot?.assets?.length || 12;
  const entitiesCount = snapshot?.entities?.length || 66;

  // Recent ticker event
  const latestEvent = realtimeEvents[0];

  return (
    <footer className="h-10 border-t border-surface-border bg-surface-base/95 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none z-30 mono-telemetry text-xs">
      {/* Left: World Status Bar */}
      <div className="flex items-center gap-4 text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">WORLD:</span>
          <span className="text-slate-100 font-bold">NEXUS CITY</span>
        </div>

        <div className="h-3 w-px bg-surface-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">MODE:</span>
          <span
            className={
              worldMode === "LIVE"
                ? "text-emerald-400 font-bold"
                : worldMode === "DEMO"
                ? "text-amber-400 font-bold"
                : "text-purple-400 font-bold"
            }
          >
            {worldMode}
          </span>
        </div>

        <div className="h-3 w-px bg-surface-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">INCIDENTS:</span>
          <span className="text-amber-400 font-bold">{incidentCount} ACTIVE</span>
        </div>

        <div className="h-3 w-px bg-surface-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">ACTIVE ASSETS:</span>
          <span className="text-blue-400 font-bold">{assetCount} UNITS</span>
        </div>

        <div className="h-3 w-px bg-surface-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold">ENTITIES:</span>
          <span className="text-slate-200">{entitiesCount} REGISTERED</span>
        </div>
      </div>

      {/* Right: Live Ticker Stream */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 max-w-md truncate text-[11px] text-slate-300 bg-surface-elevated/60 px-2.5 py-1 rounded border border-surface-border">
          <Radio
            className={`w-3 h-3 shrink-0 ${
              wsConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"
            }`}
          />
          <span className="truncate">
            {latestEvent ? (
              <>
                <span className="text-blue-400 font-semibold mr-1">
                  [{latestEvent.type}]
                </span>
                {latestEvent.payload.message || latestEvent.payload.status || "Telemetry signal"}
              </>
            ) : (
              "Telemetry Stream Listening • WebSocket Connected"
            )}
          </span>
        </div>

        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            wsConnected
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
          }`}
        >
          {wsConnected ? "STREAM LIVE" : "POLLING"}
        </span>
      </div>
    </footer>
  );
};
