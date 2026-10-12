"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { cameraController, CAMERA_PRESETS } from "./CameraController";
import { DistrictLayer } from "./DistrictLayer";
import { RouteLayer } from "./RouteLayer";
import { BuildingLayer } from "./BuildingLayer";
import { FacilityLayer } from "./FacilityLayer";
import { AssetLayer } from "./AssetLayer";
import { IncidentLayer } from "./IncidentLayer";
import { CandidateLayer } from "./CandidateLayer";
import { interactionController } from "./InteractionController";
import {
  Compass,
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  MapPin,
  AlertTriangle,
  Building,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MapboxView } from "./MapboxView";

export const NexusViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCesiumReady, setIsCesiumReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const viewerRef = useRef<any>(null);

  // Store state
  const {
    snapshot,
    layers,
    filters,
    flyToTarget,
    worldMode,
    simulationResult,
    selectedDistrict,
    selectedEntity,
    selectedAsset,
    selectedIncident,
    selectedCandidate,
    candidates,
    mapDisplayMode,
    setMapDisplayMode,
    selectDistrict,
    selectEntity,
    selectAsset,
    selectIncident,
    selectCandidate,
  } = useWorldStore();

  // Coordinates telemetry
  const [telemetry, setTelemetry] = useState({
    lat: 26.9124,
    lon: 75.7873,
    alt: 12000,
    heading: 0,
    pitch: -45,
  });

  // 1. Initialize Cesium or Tactical Fallback
  useEffect(() => {
    let isMounted = true;

    async function initCesium() {
      if (typeof window === "undefined" || !containerRef.current) return;

      try {
        // Check if Cesium global already exists or import from npm
        let Cesium = (window as any).Cesium;
        if (!Cesium) {
          Cesium = await import("cesium");
          (window as any).Cesium = Cesium;
        }

        if (!isMounted || !containerRef.current) return;

        // Configure Cesium base URL for assets
        (window as any).CESIUM_BASE_URL =
          (window as any).CESIUM_BASE_URL ||
          "https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/";

        // Create Viewer with minimal clean mission-control settings
        const viewer = new Cesium.Viewer(containerRef.current, {
          baseLayerPicker: false,
          geocoder: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          homeButton: false,
          infoBox: false,
          selectionIndicator: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          scene3DOnly: true,
          shouldAnimate: true,
        });

        // Configure dark mission-control lighting and atmosphere
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0A0D14");
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#06080E");
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = true;
        }

        viewerRef.current = viewer;
        cameraController.setViewer(viewer);
        interactionController.attach(viewer);

        // Initial camera position
        cameraController.flyToPreset("OVERVIEW", 0);

        setIsCesiumReady(true);
      } catch (err: any) {
        console.warn("Cesium initialization fallback to Tactical Spatial Canvas:", err.message);
        setLoadError(err.message);
      }
    }

    initCesium();

    return () => {
      isMounted = false;
      interactionController.detach();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        try {
          viewerRef.current.destroy();
        } catch (_) {}
      }
    };
  }, []);

  // 2. Synchronize Layers when Snapshot or Layer Visibility changes
  useEffect(() => {
    if (!isCesiumReady || !viewerRef.current || !snapshot) return;

    const viewer = viewerRef.current;

    // Filtered lists
    let filteredEntities = snapshot.entities;
    if (filters.facilityType !== "ALL") {
      filteredEntities = filteredEntities.filter(
        (e) => e.entityType === filters.facilityType
      );
    }

    let filteredAssets = snapshot.assets;
    if (filters.assetAvailability !== "ALL") {
      filteredAssets = filteredAssets.filter(
        (a) => a.availability === filters.assetAvailability
      );
    }

    let filteredIncidents = snapshot.incidents;
    if (filters.incidentSeverity !== "ALL") {
      filteredIncidents = filteredIncidents.filter(
        (i) => i.severity === filters.incidentSeverity
      );
    }

    // Render layers
    DistrictLayer.render(viewer, snapshot.districts, layers.districts);
    RouteLayer.render(viewer, filteredEntities, layers.roads);
    BuildingLayer.render(viewer, filteredEntities, layers.buildings);
    FacilityLayer.render(viewer, filteredEntities, {
      hospitals: layers.hospitals,
      emergencyStations: layers.emergencyStations,
      utilities: layers.utilities,
    });
    AssetLayer.render(viewer, filteredAssets, layers.assets);
    IncidentLayer.render(viewer, filteredIncidents, layers.incidents);
    CandidateLayer.render(viewer, candidates, layers.candidates);
  }, [isCesiumReady, snapshot, candidates, layers, filters]);

  // 3. Listen to camera fly-to triggers from store
  useEffect(() => {
    if (!flyToTarget || !snapshot) return;

    if (flyToTarget.type === "district") {
      const dist = snapshot.districts.find((d) => d.id === flyToTarget.targetId);
      if (dist && dist.geometry?.coordinates?.[0]) {
        const ring = dist.geometry.coordinates[0];
        const lats = ring.map((pt) => pt[1]);
        const lngs = ring.map((pt) => pt[0]);
        cameraController.zoomToDistrict({
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lngs),
          west: Math.min(...lngs),
        });
      }
    } else if (flyToTarget.type === "incident") {
      const inc = snapshot.incidents.find((i) => i.id === flyToTarget.targetId);
      if (inc) {
        cameraController.flyToLocation(
          inc.geometry.latitude,
          inc.geometry.longitude,
          1500,
          1.5
        );
      }
    } else if (flyToTarget.type === "entity") {
      const ent = snapshot.entities.find((e) => e.id === flyToTarget.targetId);
      if (ent && ent.geometry?.coordinates) {
        let lat = 26.9180;
        let lng = 75.7920;
        if (ent.geometry.type === "Point") {
          [lng, lat] = ent.geometry.coordinates;
        } else if (ent.geometry.type === "LineString") {
          const coords = ent.geometry.coordinates;
          const mid = Math.floor(coords.length / 2);
          [lng, lat] = coords[mid] || coords[0] || [lng, lat];
        } else if (ent.geometry.type === "Polygon") {
          const ring = ent.geometry.coordinates[0] || [];
          if (ring.length > 0) {
            const avgLng = ring.reduce((sum: number, pt: number[]) => sum + pt[0], 0) / ring.length;
            const avgLat = ring.reduce((sum: number, pt: number[]) => sum + pt[1], 0) / ring.length;
            lng = avgLng;
            lat = avgLat;
          }
        }
        cameraController.flyToLocation(lat, lng, 1200, 1.5);
      }
    } else if (flyToTarget.type === "asset") {
      const ast = snapshot.assets.find((a) => a.id === flyToTarget.targetId);
      if (ast) {
        cameraController.flyToLocation(
          ast.geometry.latitude,
          ast.geometry.longitude,
          1000,
          1.5
        );
      }
    } else if (flyToTarget.type === "candidate") {
      const cand = candidates?.find((c) => c.id === flyToTarget.targetId);
      if (cand && cand.geometry) {
        cameraController.flyToLocation(
          cand.geometry.latitude,
          cand.geometry.longitude,
          1000,
          1.5
        );
      }
    } else if (flyToTarget.type === "overview") {
      cameraController.resetCamera();
    }
  }, [flyToTarget, snapshot, candidates]);

  // If in 2D Map, Satellite, or Heatmap mode, render the high-res Mapbox operational view
  if (mapDisplayMode !== "3D_CESIUM") {
    return <MapboxView />;
  }

  return (
    <div className="relative w-full h-full bg-space-950 overflow-hidden select-none">
      {/* Primary Cesium Mount Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* High-Precision Tactical Spatial Canvas (Active when Cesium is loading or as resilient fallback) */}
      {(!isCesiumReady || loadError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-space-950">
          <Tactical2DSpatialCanvas
            snapshot={snapshot}
            layers={layers}
            filters={filters}
            candidates={candidates}
            worldMode={worldMode}
            simulationResult={simulationResult}
            selectedEntity={selectedEntity}
            selectedDistrict={selectedDistrict}
            selectedAsset={selectedAsset}
            selectedIncident={selectedIncident}
            selectedCandidate={selectedCandidate}
            onSelectEntity={selectEntity}
            onSelectDistrict={selectDistrict}
            onSelectAsset={selectAsset}
            onSelectIncident={selectIncident}
            onSelectCandidate={selectCandidate}
          />
        </div>
      )}

      {/* Tactical HUD Header Bar Overlay with Mode Switcher */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="flex items-center p-0.5 rounded-lg bg-surface-base/90 border border-surface-border backdrop-blur-md shadow-lg text-xs font-mono">
          <button
            onClick={() => setMapDisplayMode("3D_MAPBOX")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              (mapDisplayMode as string) === "3D_MAPBOX" || (mapDisplayMode as string) === "2D_DARK"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            3D Base Map
          </button>
          <button
            onClick={() => setMapDisplayMode("SATELLITE")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              (mapDisplayMode as string) === "SATELLITE"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            3D Satellite
          </button>
          <button
            onClick={() => setMapDisplayMode("3D_CESIUM")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              (mapDisplayMode as string) === "3D_CESIUM"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Cesium Globe
          </button>
          <button
            onClick={() => setMapDisplayMode("HEATMAP")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              (mapDisplayMode as string) === "HEATMAP"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Heatmap
          </button>
        </div>

        {worldMode === "SIMULATION" ? (
          <span className="text-[11px] font-bold font-mono px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-600 animate-pulse">
            WHAT-IF SIMULATION MODE (NON-MUTATING)
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 glass-panel px-2.5 py-1 rounded mono-telemetry">
            NEXUS CITY (JAIPUR TWIN)
          </span>
        )}
      </div>

      {/* Camera Preset Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 glass-panel p-1 rounded-md">
        <button
          onClick={() => cameraController.flyToPreset("OVERVIEW")}
          className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-surface-elevated rounded transition-colors mono-telemetry"
        >
          Overview
        </button>
        <button
          onClick={() => cameraController.flyToPreset("CORRIDOR_R17")}
          className="px-2 py-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 hover:bg-surface-elevated rounded transition-colors mono-telemetry flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          R17 Flood
        </button>
        <button
          onClick={() => cameraController.flyToPreset("MEMORIAL_HOSPITAL")}
          className="px-2 py-1 text-[11px] font-medium text-blue-300 hover:text-blue-200 hover:bg-surface-elevated rounded transition-colors mono-telemetry flex items-center gap-1"
        >
          <Building className="w-3 h-3 text-blue-400" />
          Hospital A
        </button>
        <button
          onClick={() => cameraController.flyToPreset("NORTH_SECTOR")}
          className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-surface-elevated rounded transition-colors mono-telemetry"
        >
          North Sector
        </button>
      </div>

      {/* Floating Tactical Compass & Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => cameraController.resetCamera()}
          title="Reset Camera Orientation"
          className="p-2 rounded glass-panel hover:bg-surface-elevated text-slate-300 hover:text-white transition-colors"
        >
          <Compass className="w-4 h-4 text-blue-400" />
        </button>
        <button
          onClick={() => {
            const Cesium = (window as any).Cesium;
            if (viewerRef.current && Cesium) {
              viewerRef.current.camera.zoomIn(1500);
            }
          }}
          title="Zoom In"
          className="p-2 rounded glass-panel hover:bg-surface-elevated text-slate-300 hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const Cesium = (window as any).Cesium;
            if (viewerRef.current && Cesium) {
              viewerRef.current.camera.zoomOut(1500);
            }
          }}
          title="Zoom Out"
          className="p-2 rounded glass-panel hover:bg-surface-elevated text-slate-300 hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Coordinates & Scale HUD */}
      <div className="absolute bottom-6 left-3 z-20 glass-panel px-3 py-1.5 rounded text-[11px] text-slate-400 mono-telemetry flex items-center gap-4">
        <span>LAT: {telemetry.lat.toFixed(4)}°N</span>
        <span>LON: {telemetry.lon.toFixed(4)}°E</span>
        <span>ALT: {(telemetry.alt / 1000).toFixed(1)} km</span>
        <span>STATUS: {isCesiumReady ? "CESIUM 3D ACTIVE" : "TACTICAL CANVAS"}</span>
      </div>
    </div>
  );
};

/**
 * Resilient Tactical 2D/3D Spatial Canvas
 * High-performance vector rendering that mirrors districts, roads, 3D extruded buildings,
 * facilities, ambulances, and incidents with zero external asset dependencies.
 */
const Tactical2DSpatialCanvas: React.FC<{
  snapshot: any;
  layers: any;
  filters: any;
  selectedEntity: any;
  selectedDistrict: any;
  selectedAsset: any;
  selectedIncident: any;
  selectedCandidate?: any;
  candidates?: any[];
  worldMode?: string;
  simulationResult?: any;
  onSelectEntity: (e: any) => void;
  onSelectDistrict: (d: any) => void;
  onSelectAsset: (a: any) => void;
  onSelectIncident: (i: any) => void;
  onSelectCandidate?: (c: any) => void;
}> = ({
  snapshot,
  layers,
  filters,
  candidates,
  worldMode,
  simulationResult,
  selectedEntity,
  selectedDistrict,
  selectedAsset,
  selectedIncident,
  selectedCandidate,
  onSelectEntity,
  onSelectDistrict,
  onSelectAsset,
  onSelectIncident,
  onSelectCandidate,
}) => {
  if (!snapshot) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="mono-telemetry">INITIALIZING NEXUS WORLD TWIN...</span>
      </div>
    );
  }

  // Projection scaling from geographic bounds to SVG viewport (800 x 600)
  const west = 75.74;
  const east = 75.89;
  const north = 26.99;
  const south = 26.84;

  const project = (lng: number, lat: number) => {
    const x = ((lng - west) / (east - west)) * 900;
    const y = ((north - lat) / (north - south)) * 650;
    return [x, y];
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox="0 0 900 650"
        className="w-full h-full max-h-[85vh] object-contain rounded-lg border border-surface-border bg-[#070A10]"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
          <linearGradient id="floodGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Tactical Grid Background */}
        <rect width="900" height="650" fill="url(#grid)" />

        {/* 1. Districts */}
        {layers.districts &&
          snapshot.districts?.map((d: any) => {
            const points = d.geometry.coordinates[0]
              .map(([lng, lat]: [number, number]) => project(lng, lat).join(","))
              .join(" ");
            const isSelected = selectedDistrict?.id === d.id;
            return (
              <g key={d.id} className="cursor-pointer" onClick={() => onSelectDistrict(d)}>
                <polygon
                  points={points}
                  fill={d.color || "#3B82F6"}
                  fillOpacity={isSelected ? 0.25 : 0.08}
                  stroke={d.color || "#3B82F6"}
                  strokeWidth={isSelected ? 2.5 : 1}
                  strokeDasharray={isSelected ? "none" : "4,4"}
                />
                <text
                  x={project(d.geometry.coordinates[0][0][0] + 0.03, d.geometry.coordinates[0][0][1] - 0.02)[0]}
                  y={project(d.geometry.coordinates[0][0][0] + 0.03, d.geometry.coordinates[0][0][1] - 0.02)[1]}
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  opacity="0.8"
                >
                  {d.name.toUpperCase()} [SCORE: {(d.operationalScore * 100).toFixed(0)}%]
                </text>
              </g>
            );
          })}

        {/* 2. Roads and Bridges */}
        {layers.roads &&
          snapshot.entities
            ?.filter((e: any) => e.entityType === "ROAD" || e.entityType === "BRIDGE")
            .map((e: any) => {
              if (e.geometry.type !== "LineString") return null;
              const points = e.geometry.coordinates
                .map(([lng, lat]: [number, number]) => project(lng, lat).join(","))
                .join(" ");

              const isBlocked = e.status === "BLOCKED";
              const isDegraded = e.status === "DEGRADED" || e.status === "CONSTRAINED";
              const isSelected = selectedEntity?.id === e.id;

              let strokeColor = "#10B981"; // Open
              let width = 2.5;

              if (isBlocked) {
                strokeColor = "#EF4444";
                width = 4;
              } else if (isDegraded) {
                strokeColor = "#F59E0B";
                width = 3.5;
              }

              if (e.entityType === "BRIDGE") {
                width = 5;
              }

              return (
                <polyline
                  key={e.id}
                  points={points}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isSelected ? width + 2 : width}
                  strokeOpacity={isSelected ? 1.0 : 0.85}
                  className="cursor-pointer hover:stroke-white transition-colors"
                  onClick={() => onSelectEntity(e)}
                />
              );
            })}

        {/* 3. 3D Buildings (Extruded footprints with isometric offset) */}
        {layers.buildings &&
          snapshot.entities
            ?.filter((e: any) => e.entityType === "BUILDING")
            .map((b: any) => {
              if (b.geometry.type !== "Polygon") return null;
              const ring = b.geometry.coordinates[0];
              const basePoints = ring.map(([lng, lat]: [number, number]) => project(lng, lat));
              const height = (b.attributes?.height_meters || 40) * 0.25;

              // Extruded roof points with simulated isometric shift
              const roofPoints = basePoints.map(([x, y]: [number, number]) => `${x - height * 0.4},${y - height * 0.6}`).join(" ");
              const groundPoints = basePoints.map(([x, y]: [number, number]) => `${x},${y}`).join(" ");

              const isSelected = selectedEntity?.id === b.id;

              return (
                <g key={b.id} className="cursor-pointer" onClick={() => onSelectEntity(b)}>
                  {/* Ground base shadow */}
                  <polygon points={groundPoints} fill="#0F172A" fillOpacity="0.8" />
                  {/* Extruded rooftop */}
                  <polygon
                    points={roofPoints}
                    fill={isSelected ? "#38BDF8" : "#1E293B"}
                    stroke={isSelected ? "#FFFFFF" : "#334155"}
                    strokeWidth="1"
                    className="hover:fill-blue-500 transition-colors"
                  />
                </g>
              );
            })}

        {/* 4. Facilities (Hospitals, Emergency Stations, Utilities) */}
        {snapshot.entities
          ?.filter(
            (e: any) =>
              (e.entityType === "HOSPITAL" && layers.hospitals) ||
              (e.entityType === "EMERGENCY_STATION" && layers.emergencyStations) ||
              ((e.entityType === "UTILITY_NODE" || e.entityType === "FACILITY") && layers.utilities)
          )
          .map((fac: any) => {
            if (fac.geometry.type !== "Point") return null;
            const [x, y] = project(fac.geometry.coordinates[0], fac.geometry.coordinates[1]);
            const isHosp = fac.entityType === "HOSPITAL";
            const isStation = fac.entityType === "EMERGENCY_STATION";
            const isSelected = selectedEntity?.id === fac.id;

            let color = isHosp ? (fac.status === "AT_RISK" ? "#EF4444" : "#10B981") : isStation ? "#F59E0B" : "#06B6D4";

            return (
              <g
                key={fac.id}
                className="cursor-pointer"
                onClick={() => onSelectEntity(fac)}
                transform={`translate(${x}, ${y})`}
              >
                {isSelected && <circle r="14" fill={color} fillOpacity="0.25" className="animate-ping" />}
                <circle r={isHosp ? "7" : "5.5"} fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
                <text
                  x="9"
                  y="3"
                  fill="#E2E8F0"
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                  className="pointer-events-none drop-shadow"
                >
                  {fac.name}
                </text>
              </g>
            );
          })}

        {/* 5. Operational Assets (Ambulances, Vehicles, Drones) */}
        {layers.assets &&
          snapshot.assets?.map((ast: any) => {
            const [x, y] = project(ast.geometry.longitude, ast.geometry.latitude);
            const isSelected = selectedAsset?.id === ast.id;
            const isEngaged = ast.availability === "ENGAGED" || ast.availability === "DISPATCHED";
            const color = isEngaged ? "#F59E0B" : "#38BDF8";

            return (
              <g
                key={ast.id}
                className="cursor-pointer"
                onClick={() => onSelectAsset(ast)}
                transform={`translate(${x}, ${y})`}
              >
                <circle r="6" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
                <text
                  x="8"
                  y="12"
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  className="pointer-events-none drop-shadow"
                >
                  {ast.name} [{ast.availability}]
                </text>
              </g>
            );
          })}

        {/* 6. Incidents (Alert halos, affected radius, warning beacon) */}
        {layers.incidents &&
          snapshot.incidents?.map((inc: any) => {
            const [x, y] = project(inc.geometry.longitude, inc.geometry.latitude);
            const isCritical = inc.severity === "CRITICAL" || inc.severity === "HIGH";
            const color = isCritical ? "#EF4444" : "#F59E0B";
            const radius = Math.max(25, inc.affectedRadiusMeters * 0.12);
            const isSelected = selectedIncident?.id === inc.id;

            return (
              <g key={inc.id} className="cursor-pointer" onClick={() => onSelectIncident(inc)}>
                {/* Affected radius polygon */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill="url(#floodGrad)"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="4,2"
                />
                {/* Pulsing center ping */}
                <circle cx={x} cy={y} r="18" fill={color} fillOpacity="0.3" className="animate-ping" />
                <circle cx={x} cy={y} r="8" fill={color} stroke="#FFFFFF" strokeWidth="2" />
                <text
                  x={x + 12}
                  y={y - 8}
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="Inter, sans-serif"
                  className="pointer-events-none drop-shadow"
                >
                  ⚠️ #{inc.incidentNumber} {inc.title}
                </text>
              </g>
            );
          })}

        {/* 7. Incident Candidates (Phase 3 Multimodal Ingestion) */}
        {layers.candidates &&
          candidates?.map((cand: any) => {
            if (!cand.geometry) return null;
            const [x, y] = project(cand.geometry.longitude, cand.geometry.latitude);
            const isSelected = selectedCandidate?.id === cand.id;
            const isPending = cand.status === "PENDING_REVIEW";
            const color = isPending ? "#F59E0B" : "#10B981";

            return (
              <g
                key={cand.id}
                className="cursor-pointer"
                onClick={() => onSelectCandidate && onSelectCandidate(cand)}
                transform={`translate(${x}, ${y})`}
              >
                {/* Pulsing halo */}
                <circle r={isSelected ? "20" : "14"} fill={color} fillOpacity="0.25" className="animate-ping" />
                {/* Diamond icon shape for candidates */}
                <polygon
                  points="0,-9 9,0 0,9 -9,0"
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <text
                  x="12"
                  y="3"
                  fill={color}
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                  className="pointer-events-none drop-shadow"
                >
                  ⚡ CANDIDATE: {cand.incidentType} ({Math.round(cand.confidence * 100)}%)
                </text>
              </g>
            );
          })}

        {/* 8. Simulation Overlay (Phase 5 What-If Simulation Alternative Route) */}
        {worldMode === "SIMULATION" && simulationResult?.alternativeRoutes && (
          <g>
            {/* Draw glowing bypass corridor line */}
            <polyline
              points="300,280 430,310 570,350 670,410"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="5"
              strokeDasharray="8,4"
              className="animate-pulse"
            />
            {/* Simulation Route Badge */}
            <g transform="translate(420, 275)">
              <rect x="0" y="0" width="220" height="26" rx="4" fill="#083344" stroke="#06B6D4" strokeWidth="1.5" />
              <text x="12" y="17" fill="#67E8F9" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                BYPASS CORRIDOR R14 (ETA: 7.1m)
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
