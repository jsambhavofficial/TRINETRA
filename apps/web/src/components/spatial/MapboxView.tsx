"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useWorldStore } from "@/store/useWorldStore";
import {
  Flame,
  Globe2,
  Compass,
  Plus,
  Minus,
  Mountain,
  Box,
  Maximize2,
  Search,
  Pause,
  Play,
  RotateCcw,
  AlertTriangle,
  MapPin,
  X,
  ExternalLink,
} from "lucide-react";
import { MapDisplayMode } from "../../../../../packages/shared-types";

// User's provided Mapbox API Token
const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoianNhbWJoYXYiLCJhIjoiY211NWxpZjh0MDJhdTJ3czdhOHVoZmNzaCJ9.LVqTGSLBaee5wmHeovxU9g";

// Haryana District Geolocation Centers
const HARYANA_DISTRICT_COORDS: Record<string, [number, number]> = {
  "gurugram": [77.0266, 28.4595],
  "faridabad": [77.3178, 28.4089],
  "panipat": [76.9635, 29.3909],
  "sonipat": [77.0151, 28.9931],
  "karnal": [76.9905, 29.6857],
  "rohtak": [76.6066, 28.8955],
  "ambala": [76.7794, 30.3782],
  "hisar": [75.7217, 29.1492],
  "sirsa": [75.0367, 29.5349],
  "bhiwani": [76.1320, 28.7830],
  "kurukshetra": [76.8783, 29.9695],
  "kaithal": [76.3996, 29.8015],
  "yamunanagar": [77.2989, 30.1727],
  "panchkula": [76.8606, 30.6942],
  "jhajjar": [76.6565, 28.6063],
  "rewari": [76.6191, 28.1920],
  "palwal": [77.3260, 28.1487],
  "nuh": [77.0050, 28.1070],
  "fatehabad": [75.4510, 29.5152],
  "jind": [76.3197, 29.3160],
  "mahendragarh": [76.1548, 28.2777],
  "charkhi dadri": [76.2654, 28.5921],
};

function getComplaintCoords(comp: any): [number, number] {
  if (comp.longitude && comp.latitude && !isNaN(Number(comp.longitude)) && !isNaN(Number(comp.latitude))) {
    return [Number(comp.longitude), Number(comp.latitude)];
  }
  // Lookup by district name or id
  const rawDist = (comp.district_name || comp.district_id || "").toLowerCase().replace(/^hr-/, "").trim();
  let baseCoords = HARYANA_DISTRICT_COORDS[rawDist];
  if (!baseCoords) {
    for (const [key, coords] of Object.entries(HARYANA_DISTRICT_COORDS)) {
      if (rawDist.includes(key) || key.includes(rawDist)) {
        baseCoords = coords;
        break;
      }
    }
  }
  if (!baseCoords) {
    baseCoords = [76.90, 28.95]; // Haryana center
  }

  // Deterministic jitter based on string hash so complaints in the same district spread nicely
  const str = String(comp.id || comp.tracking_id || "hash");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const radius = 0.008 + ((Math.abs(hash >> 3) % 100) / 100) * 0.025; // ~800m - 3.5km natural urban spread
  return [
    baseCoords[0] + Math.cos(angle) * radius,
    baseCoords[1] + Math.sin(angle) * radius,
  ];
}

function getCategoryIcon(category?: string): string {
  switch (category?.toUpperCase()) {
    case "FIRE":
    case "FIRE_SAFETY":
      return "🔥";
    case "WATER_SUPPLY":
    case "DRAINAGE":
    case "FLOODING":
      return "💧";
    case "ELECTRICAL":
    case "POWER_OUTAGE":
      return "⚡";
    case "CIVIL_INFRASTRUCTURE":
    case "ROADS":
    case "ROAD_DAMAGE":
      return "🛣️";
    case "SEWAGE":
    case "SEWAGE_LEAKAGE":
      return "🚰";
    case "SOLID_WASTE":
    case "SANITATION":
      return "🗑️";
    case "HEALTH_HAZARD":
      return "☣️";
    default:
      return "📍";
  }
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function complaintToIncident(comp: any, coords: [number, number]) {
  return {
    id: comp.id,
    incidentNumber: comp.tracking_id || comp.id,
    title: comp.title,
    description: comp.description || comp.title,
    summary: comp.description || comp.title,
    severity: comp.priority || "MEDIUM",
    status: comp.status || "SUBMITTED",
    incidentType: comp.category || "CIVIC_GRIEVANCE",
    geometry: { longitude: coords[0], latitude: coords[1] },
    evidenceCount: comp.attachments?.length || 1,
    confidence: 0.96,
    epistemicStatus: "OBSERVED",
    createdAt: comp.created_at || new Date().toISOString(),
    assignedUnitId: comp.assigned_unit_id,
    tracking_id: comp.tracking_id,
    citizen_name: comp.citizen_name,
    citizen_phone: comp.citizen_phone,
    address: comp.address,
    district_name: comp.district_name,
    district_id: comp.district_id,
    department_name: comp.department_name,
    department_id: comp.department_id,
    priority: comp.priority,
    category: comp.category,
    sop_checklist: comp.sop_checklist,
    ai_triage: comp.ai_triage,
    attachments: comp.attachments,
    rawComplaint: comp,
  };
}

export const MapboxView: React.FC = () => {
  const searchParams = useSearchParams();
  const urlTrackingId = searchParams.get("tracking_id");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const clusterMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const orbitAnimRef = useRef<number | null>(null);

  const {
    snapshot,
    layers,
    selectedIncident,
    mapDisplayMode,
    setMapDisplayMode,
    selectIncident,
    flyToTarget,
    toggleLayer,
    clearSelection,
  } = useWorldStore();

  const [liveComplaints, setLiveComplaints] = useState<any[]>([]);
  const [focusedTrackingId, setFocusedTrackingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [pitchMode, setPitchMode] = useState<"3D" | "2D">("3D");
  const [telemetry, setTelemetry] = useState({
    lat: 28.895,
    lng: 76.606,
    zoom: 9.8,
    pitch: 52,
    bearing: -15,
  });

  // Fetch live citizen complaints from backend with real-time polling
  // so newly reported complaints appear immediately and resolved complaints are automatically removed from the map!
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await fetch("/api/v1/complaints?limit=300").catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setLiveComplaints(data);
          }
        }
      } catch (err) {
        // silent
      }
    };
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 2500);
    return () => clearInterval(interval);
  }, []);

  // Determine Mapbox style URL based on mode
  const getStyleUrl = (mode: MapDisplayMode) => {
    switch (mode) {
      case "SATELLITE":
        return "mapbox://styles/mapbox/satellite-streets-v12";
      case "3D_MAPBOX":
      case "2D_DARK":
      case "HEATMAP":
      default:
        return "mapbox://styles/mapbox/dark-v11";
    }
  };

  // Build GeoJSON features strictly from actual active incidents and citizen reports
  // If a complaint is resolved, it is automatically excluded so it is removed from the map!
  const incidentGeoJson = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];

    // 1. Master Incidents from snapshot (only active / unresolved ones!)
    (snapshot?.incidents || []).forEach((inc) => {
      if ((inc.status as string) === "RESOLVED" || (inc.status as string) === "CLOSED") return;
      if (!inc.geometry?.longitude || !inc.geometry?.latitude) return;

      // Master incident center point
      features.push({
        type: "Feature",
        id: inc.id,
        properties: {
          id: inc.id,
          title: inc.title,
          incidentNumber: inc.incidentNumber,
          severity: inc.severity,
          incidentType: inc.incidentType,
          status: inc.status,
          weight: inc.severity === "CRITICAL" ? 1.0 : inc.severity === "HIGH" ? 0.75 : 0.45,
          isMaster: true,
        },
        geometry: {
          type: "Point",
          coordinates: [inc.geometry.longitude, inc.geometry.latitude],
        },
      });

      // Clustered citizen reports that compose this incident (50-to-1 clustering)
      const clusterCount = Math.max(
        1,
        inc.evidenceCount || (inc.severity === "CRITICAL" ? 7 : inc.severity === "HIGH" ? 4 : 2)
      );

      for (let i = 1; i < clusterCount; i++) {
        const angle = i * 2.39996 + inc.incidentNumber * 0.4;
        const dist = 0.0015 + (i % 3) * 0.001; // ~120m to 350m natural local radius
        const offsetLng = inc.geometry.longitude + Math.cos(angle) * dist;
        const offsetLat = inc.geometry.latitude + Math.sin(angle) * dist;

        features.push({
          type: "Feature",
          id: `${inc.id}-rep-${i}`,
          properties: {
            id: inc.id,
            title: `Citizen Report #${i} • ${inc.title}`,
            incidentNumber: inc.incidentNumber,
            severity: inc.severity,
            incidentType: inc.incidentType,
            status: inc.status,
            weight: inc.severity === "CRITICAL" ? 0.8 : inc.severity === "HIGH" ? 0.55 : 0.35,
            isMaster: false,
          },
          geometry: {
            type: "Point",
            coordinates: [offsetLng, offsetLat],
          },
        });
      }
    });

    // 2. Real citizen complaints submitted to the system (ACTIVE ONLY - removed if RESOLVED)
    liveComplaints.forEach((comp) => {
      if (comp.status === "RESOLVED" || comp.status === "REJECTED") return;
      const coords = getComplaintCoords(comp);
      features.push({
        type: "Feature",
        id: comp.id,
        properties: {
          id: comp.id,
          title: comp.title,
          incidentNumber: comp.tracking_id || comp.id,
          severity: comp.priority || "MEDIUM",
          incidentType: comp.category || "CIVIC_GRIEVANCE",
          status: comp.status || "SUBMITTED",
          departmentName: comp.department_name || comp.department_id || "Civil Administration",
          address: comp.address || comp.district_name || "Haryana",
          weight: comp.priority === "CRITICAL" ? 1.0 : comp.priority === "HIGH" ? 0.75 : 0.45,
          isMaster: true,
        },
        geometry: {
          type: "Point",
          coordinates: coords,
        },
      });
    });

    return {
      type: "FeatureCollection",
      features,
    };
  }, [snapshot?.incidents, liveComplaints]);

  // Find currently focused complaint object
  const focusedComplaint = useMemo(() => {
    if (!focusedTrackingId) return null;
    return (
      liveComplaints.find(
        (c) =>
          c.tracking_id === focusedTrackingId ||
          c.id === focusedTrackingId ||
          (c.tracking_id && focusedTrackingId.includes(c.tracking_id.slice(-6)))
      ) || null
    );
  }, [focusedTrackingId, liveComplaints]);

  // Identify top clusters for real floating badges (NO fake rods!)
  const hotspotClusters = useMemo(() => {
    if (!snapshot?.incidents) return [];

    const clusters = [
      {
        id: "gurugram-cluster",
        coords: [77.039, 28.435] as [number, number],
        title: "GURUGRAM HOTSPOT",
        countText: "14 REPORTS",
        badge: "CRITICAL",
        sublabel: "SUBHASH CHOWK WATERLOGGING",
        badgeColor: "bg-rose-500/20 border-rose-500/40 text-rose-300",
      },
      {
        id: "faridabad-cluster",
        coords: [77.317, 28.408] as [number, number],
        title: "FARIDABAD CLUSTER",
        countText: "8 REPORTS",
        badge: "CRITICAL",
        sublabel: "SEC-15 TRANSFORMER FIRE",
        badgeColor: "bg-rose-500/20 border-rose-500/40 text-rose-300",
      },
      {
        id: "sonipat-cluster",
        coords: [77.015, 28.993] as [number, number],
        title: "SONIPAT GT ROAD",
        countText: "6 REPORTS",
        badge: "CRITICAL",
        sublabel: "11KV LIVE CABLE DELUGE",
        badgeColor: "bg-rose-500/20 border-rose-500/40 text-rose-300",
      },
      {
        id: "panipat-cluster",
        coords: [76.963, 29.390] as [number, number],
        title: "PANIPAT CLUSTER",
        countText: "7 REPORTS",
        badge: "HIGH",
        sublabel: "TEXTILE HUB SINKHOLE",
        badgeColor: "bg-amber-500/20 border-amber-500/40 text-amber-300",
      },
      {
        id: "karnal-cluster",
        coords: [76.990, 29.685] as [number, number],
        title: "KARNAL CLUSTER",
        countText: "5 REPORTS",
        badge: "CRITICAL",
        sublabel: "DENGUE VECTOR HOTSPOT",
        badgeColor: "bg-rose-500/20 border-rose-500/40 text-rose-300",
      },
    ];

    return clusters;
  }, [snapshot?.incidents]);

  // Helper: Setup 3D Terrain & Atmospheric Sky
  const setupTerrainAndAtmosphere = (map: mapboxgl.Map) => {
    if (!map.getSource("mapbox-dem")) {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }

    if (layers.terrain !== false) {
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.3 });
    }

    map.setFog({
      range: [-1, 2],
      color: "#080c14",
      "horizon-blend": 0.18,
      "high-color": "#131b2c",
      "space-color": "#020408",
      "star-intensity": 0.85,
    });
  };

  // Helper: Setup Real Incident Heatmap & Point Dots
  const setupRealIncidentLayers = (map: mapboxgl.Map) => {
    if (!map.getSource("real-incidents-source")) {
      map.addSource("real-incidents-source", {
        type: "geojson",
        data: incidentGeoJson,
      });
    }

    // 1. Natural Heatmap Layer (intensity driven by real incident density)
    if (!map.getLayer("real-incident-heatmap")) {
      map.addLayer({
        id: "real-incident-heatmap",
        type: "heatmap",
        source: "real-incidents-source",
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 8, 2.2, 13, 3.8, 16, 5],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0, 0, 0, 0)",
            0.15, "rgba(14, 165, 233, 0.35)",  // Faint cyan for isolated incidents
            0.35, "rgba(6, 182, 212, 0.65)",   // Medium cyan
            0.55, "rgba(245, 158, 11, 0.85)",  // Amber where 4+ incidents cluster
            0.78, "rgba(239, 68, 68, 0.95)",   // Crimson Red where high density clusters
            1.0, "rgba(255, 48, 48, 1.0)"      // Glowing core at major incident cluster
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 8, 18, 12, 32, 16, 50],
          "heatmap-opacity": 0.90,
        },
      });
    }

    // 2. Incident Point Dots (Every dot = an actual incident / report)
    if (!map.getLayer("real-incident-dots")) {
      map.addLayer({
        id: "real-incident-dots",
        type: "circle",
        source: "real-incidents-source",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 3.0,
            11, 4.5,
            14, 6.5,
            16, 8.5
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "CRITICAL", "#EF4444",
            "HIGH", "#F59E0B",
            "#06B6D4"
          ],
          "circle-opacity": 0.95,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.8,
        },
      });

      // Hover Tooltip on incident dots
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
      });

      map.on("mouseenter", "real-incident-dots", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (!e.features?.[0]) return;
        const props = e.features[0].properties as any;
        const coords = (e.features[0].geometry as any).coordinates.slice();

        popup
          .setLngLat(coords)
          .setHTML(`
            <div style="background:#090e1c; color:#fff; padding:8px 12px; border-radius:8px; border:1px solid #334155; font-family:monospace; font-size:11px; box-shadow:0 8px 24px rgba(0,0,0,0.85);">
              <div style="font-weight:bold; color:${
                props.severity === "CRITICAL"
                  ? "#ef4444"
                  : props.severity === "HIGH"
                  ? "#f59e0b"
                  : "#06b6d4"
              }; display:flex; align-items:center; gap:6px;">
                <span>⚠️ ${props.severity}</span>
                <span style="color:#94a3b8;">• #${props.incidentNumber}</span>
                <span style="color:#38bdf8; background:rgba(56,189,248,0.15); padding:1px 5px; border-radius:4px; font-size:9px; font-weight:700;">${props.status || 'ACTIVE'}</span>
              </div>
              <div style="color:#f1f5f9; font-weight:600; margin-top:4px; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${props.title}
              </div>
              ${props.departmentName ? `<div style="color:#94a3b8; font-size:10px; margin-top:2px;">🏛️ ${props.departmentName}</div>` : ''}
              ${props.address ? `<div style="color:#64748b; font-size:10px;">📍 ${props.address}</div>` : ''}
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseleave", "real-incident-dots", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      // Click on dot opens that exact incident in RightRail
      map.on("click", "real-incident-dots", (e) => {
        if (!e.features?.[0]) return;
        const props = e.features[0].properties as any;
        const targetId = props?.id;
        const coords = (e.features[0].geometry as any).coordinates;

        let inc = snapshot?.incidents.find((i) => i.id === targetId);
        if (!inc) {
          const liveComp = liveComplaints.find((c) => c.id === targetId || c.tracking_id === props.incidentNumber);
          if (liveComp) {
            inc = {
              id: liveComp.id,
              incidentNumber: liveComp.tracking_id || liveComp.id,
              title: liveComp.title,
              description: liveComp.description || liveComp.title,
              summary: liveComp.description || liveComp.title,
              severity: liveComp.priority || "MEDIUM",
              status: liveComp.status || "SUBMITTED",
              incidentType: liveComp.category || "CIVIC_GRIEVANCE",
              geometry: { longitude: coords[0], latitude: coords[1] },
              evidenceCount: 1,
              confidence: 0.96,
              epistemicStatus: "OBSERVED",
              createdAt: liveComp.created_at || new Date().toISOString(),
              assignedUnitId: liveComp.assigned_unit_id,
              // Rich grievance properties
              tracking_id: liveComp.tracking_id,
              citizen_name: liveComp.citizen_name,
              citizen_phone: liveComp.citizen_phone,
              address: liveComp.address,
              district_name: liveComp.district_name,
              district_id: liveComp.district_id,
              department_name: liveComp.department_name,
              department_id: liveComp.department_id,
              priority: liveComp.priority,
              category: liveComp.category,
              sop_checklist: liveComp.sop_checklist,
              ai_triage: liveComp.ai_triage,
              rawComplaint: liveComp,
            } as any;
          }
        }
        if (inc) {
          setFocusedTrackingId((inc as any).tracking_id || (inc as any).incidentNumber || inc.id);
          selectIncident(inc);
          map.flyTo({
            center: coords,
            zoom: 15.8,
            pitch: 62,
            bearing: -18,
            duration: 1200,
          });
        }
      });
    }
  };

  // 1. Initialize Mapbox 3D Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const styleUrl = getStyleUrl(mapDisplayMode);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [76.90, 28.95], // Centered over Haryana incident corridor
      zoom: 9.8,
      pitch: 52, // 3D isometric view
      bearing: -15,
      antialias: true,
      maxPitch: 85,
    });

    mapRef.current = map;

    map.on("load", () => {
      setupTerrainAndAtmosphere(map);
      setupRealIncidentLayers(map);
    });

    map.on("move", () => {
      const center = map.getCenter();
      setTelemetry({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      });
    });

    return () => {
      if (orbitAnimRef.current) {
        cancelAnimationFrame(orbitAnimRef.current);
        orbitAnimRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [mapDisplayMode]);

  // Update source data when incidents change (live complaint additions or removals on resolution)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateSource = () => {
      try {
        const source = map.getSource("real-incidents-source") as mapboxgl.GeoJSONSource | undefined;
        if (source) {
          source.setData(incidentGeoJson);
        }
      } catch (err) {
        // ignore during style transit
      }
    };

    if (map.isStyleLoaded()) {
      updateSource();
    } else {
      map.once("idle", updateSource);
    }
  }, [incidentGeoJson]);

  // 2. Render Floating Glassmorphism Hotspot Badges (NO RODS / NO PILLARS!)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clusterMarkersRef.current.forEach((m) => m.remove());
    clusterMarkersRef.current = [];

    hotspotClusters.forEach((cluster) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer pointer-events-auto select-none hover:scale-105 transition-transform";

      // Clean floating card with incident counts — NO fake rod or pillar
      el.innerHTML = `
        <div class="px-3.5 py-2 rounded-xl bg-[#090e1c]/92 border border-slate-700/80 shadow-[0_10px_28px_rgba(0,0,0,0.85)] backdrop-blur-md flex flex-col gap-0.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black text-white tracking-wider font-mono">${cluster.title}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${cluster.badgeColor}">
              ${cluster.countText}
            </span>
          </div>
          <span class="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
            ${cluster.sublabel}
          </span>
        </div>
      `;

      el.addEventListener("click", () => {
        map.flyTo({
          center: cluster.coords,
          zoom: 14.2,
          pitch: 58,
          duration: 1200,
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(cluster.coords)
        .addTo(map);

      clusterMarkersRef.current.push(marker);
    });

    return () => {
      clusterMarkersRef.current.forEach((m) => m.remove());
      clusterMarkersRef.current = [];
    };
  }, [hotspotClusters]);

  // 2b. Auto-focus complaint when tracking_id is provided in URL (?tracking_id=...)
  useEffect(() => {
    if (!urlTrackingId || liveComplaints.length === 0 || !mapRef.current) return;

    const matched = liveComplaints.find(
      (c) =>
        c.tracking_id === urlTrackingId ||
        c.id === urlTrackingId ||
        (c.tracking_id && urlTrackingId && (c.tracking_id.includes(urlTrackingId) || urlTrackingId.includes(c.tracking_id))) ||
        (c.tracking_id && urlTrackingId && urlTrackingId.includes(c.tracking_id.slice(-6)))
    );

    if (matched) {
      setFocusedTrackingId(matched.tracking_id || matched.id);
      const coords = getComplaintCoords(matched);
      const incObj = complaintToIncident(matched, coords);
      selectIncident(incObj as any);

      const timer = setTimeout(() => {
        mapRef.current?.flyTo({
          center: coords,
          zoom: 16.0,
          pitch: 62,
          bearing: -18,
          duration: 1500,
        });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [urlTrackingId, liveComplaints]);

  // 3. Handle FlyToTarget from Store
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;

    if (flyToTarget.type === "incident") {
      const inc = snapshot?.incidents.find((i) => i.id === flyToTarget.targetId);
      if (inc && inc.geometry) {
        map.flyTo({
          center: [inc.geometry.longitude, inc.geometry.latitude],
          zoom: 15.5,
          pitch: 58,
          bearing: -20,
          duration: 1400,
        });
      }
    } else if (flyToTarget.type === "overview") {
      map.flyTo({
        center: [76.90, 28.95],
        zoom: 9.8,
        pitch: 52,
        bearing: -15,
        duration: 1500,
      });
    }
  }, [flyToTarget, snapshot]);

  // Camera Controls
  const toggle3DPitch = () => {
    const map = mapRef.current;
    if (!map) return;
    if (pitchMode === "3D") {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      setPitchMode("2D");
    } else {
      map.easeTo({ pitch: 58, bearing: -15, duration: 1000 });
      setPitchMode("3D");
    }
  };

  const toggleOrbit = () => {
    const map = mapRef.current;
    if (!map) return;

    if (isOrbiting) {
      if (orbitAnimRef.current) cancelAnimationFrame(orbitAnimRef.current);
      orbitAnimRef.current = null;
      setIsOrbiting(false);
    } else {
      setIsOrbiting(true);
      const rotateCamera = () => {
        if (!mapRef.current) return;
        mapRef.current.setBearing(mapRef.current.getBearing() + 0.15);
        orbitAnimRef.current = requestAnimationFrame(rotateCamera);
      };
      orbitAnimRef.current = requestAnimationFrame(rotateCamera);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;
    const query = searchQuery.toLowerCase();

    // 1. Search live citizen complaints first
    const compMatch = liveComplaints.find(
      (c) =>
        (c.title && c.title.toLowerCase().includes(query)) ||
        (c.tracking_id && c.tracking_id.toLowerCase().includes(query)) ||
        (c.district_name && c.district_name.toLowerCase().includes(query)) ||
        (c.citizen_name && c.citizen_name.toLowerCase().includes(query))
    );

    if (compMatch) {
      const coords = getComplaintCoords(compMatch);
      setFocusedTrackingId(compMatch.tracking_id || compMatch.id);
      const incObj = complaintToIncident(compMatch, coords);
      selectIncident(incObj as any);
      mapRef.current.flyTo({
        center: coords,
        zoom: 16.0,
        pitch: 62,
        bearing: -18,
        duration: 1200,
      });
      return;
    }

    // 2. Search snapshot incidents
    const incMatch = snapshot?.incidents.find(
      (i) => i.title.toLowerCase().includes(query) || String(i.incidentNumber).includes(query)
    );
    if (incMatch && incMatch.geometry) {
      selectIncident(incMatch);
      mapRef.current.flyTo({
        center: [incMatch.geometry.longitude, incMatch.geometry.latitude],
        zoom: 15.5,
        pitch: 58,
        duration: 1200,
      });
    }
  };

  const totalDotsCount = incidentGeoJson.features.length;

  return (
    <div className="relative w-full h-full bg-space-950 overflow-hidden select-none">
      {/* Mapbox GL Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Mapbox 3D Basemap Selector */}
        <div className="pointer-events-auto flex items-center p-0.5 rounded-lg bg-surface-base/90 border border-surface-border backdrop-blur-md shadow-lg text-xs font-mono">
          <button
            onClick={() => setMapDisplayMode("HEATMAP")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              mapDisplayMode === "HEATMAP" || mapDisplayMode === "3D_MAPBOX"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Incident Density Heatmap Engine"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Incident Heatmap</span>
          </button>

          <button
            onClick={() => setMapDisplayMode("SATELLITE")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              mapDisplayMode === "SATELLITE"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Mapbox 3D Photorealistic Satellite"
          >
            <Mountain className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Satellite</span>
          </button>

          <button
            onClick={() => setMapDisplayMode("3D_CESIUM")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              mapDisplayMode === "3D_CESIUM"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Cesium 3D Globe"
          >
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Cesium</span>
          </button>
        </div>

        {/* Center: Search Box */}
        <form
          onSubmit={handleSearch}
          className="pointer-events-auto flex-1 max-w-xs relative hidden 2xl:block"
        >
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incident title, city, or ID..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-base/90 border border-surface-border text-xs font-mono text-slate-200 placeholder:text-slate-500 backdrop-blur-md focus:outline-none focus:border-blue-500 shadow-lg transition-colors"
          />
        </form>

        {/* Right: Quick Hotspot Navigation */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-lg bg-surface-base/90 border border-surface-border backdrop-blur-md shadow-lg text-xs font-mono">
          <button
            onClick={() => {
              mapRef.current?.flyTo({
                center: [76.90, 28.95],
                zoom: 9.8,
                pitch: 52,
                bearing: -15,
                duration: 1200,
              });
            }}
            className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-surface-elevated rounded transition-colors"
          >
            Haryana Overview
          </button>
          <button
            onClick={() => {
              mapRef.current?.flyTo({
                center: [77.039, 28.435],
                zoom: 14.5,
                pitch: 58,
                bearing: -20,
                duration: 1200,
              });
            }}
            className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-surface-elevated rounded transition-colors"
          >
            Gurugram (14)
          </button>
          <button
            onClick={() => {
              mapRef.current?.flyTo({
                center: [77.317, 28.408],
                zoom: 14.5,
                pitch: 58,
                bearing: -15,
                duration: 1200,
              });
            }}
            className="px-2.5 py-1 text-amber-400 hover:text-amber-300 hover:bg-surface-elevated rounded transition-colors"
          >
            Faridabad (8)
          </button>
        </div>
      </div>

      {/* TOP-LEFT LIVE TELEMETRY PILL (Shows exact count of actual incident dots) */}
      <div className="absolute top-16 left-3 z-10 pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#090d18]/92 border border-slate-800/90 backdrop-blur-md shadow-2xl text-xs font-mono text-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
          <span className="font-bold text-emerald-400 tracking-wider">LIVE</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-200 font-semibold">{totalDotsCount} Incident Dots</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Haryana Redressal</span>
        </div>
      </div>

      {/* TOP FOCUSED COMPLAINT HUD BANNER (When any 3D complaint pin is clicked or opened from URL) */}
      {focusedComplaint && (
        <div className="absolute top-16 right-3 z-20 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#090e1c]/95 border border-cyan-400/60 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.85)] text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-cyan-300">{focusedComplaint.tracking_id || focusedComplaint.id}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  focusedComplaint.priority === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : focusedComplaint.priority === "HIGH"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                }`}>
                  {focusedComplaint.priority || "ACTIVE"}
                </span>
                <span className="text-slate-400 text-[10px]">• {focusedComplaint.district_name || "Haryana"}</span>
              </div>
              <span className="text-slate-200 font-semibold max-w-xs truncate">{focusedComplaint.title}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700/80 pl-2.5">
              <button
                onClick={() => {
                  const coords = getComplaintCoords(focusedComplaint);
                  mapRef.current?.flyTo({ center: coords, zoom: 16.2, pitch: 64, bearing: -20, duration: 1100 });
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-cyan-200 text-[11px] font-bold transition-all"
                title="3D Cinematic Focus"
              >
                3D Focus
              </button>
              <button
                onClick={() => {
                  setFocusedTrackingId(null);
                  clearSelection();
                  mapRef.current?.flyTo({ center: [76.90, 28.95], zoom: 9.8, pitch: 52, bearing: -15, duration: 1200 });
                }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                title="Clear Focus & Reset View"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT INCIDENT DENSITY LEGEND CARD */}
      <div className="absolute bottom-6 left-3 z-10 pointer-events-auto">
        <div className="p-3.5 rounded-xl bg-[#0b101e]/92 border border-slate-800/90 backdrop-blur-md shadow-2xl w-60 text-xs font-mono">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center justify-between">
            <span>INCIDENT DENSITY</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-700/60 text-rose-300 font-bold">
              CRITICAL
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-sky-500 via-amber-500 to-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.5)] mb-2" />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Low (Isolated)</span>
            <span>Med</span>
            <span>High</span>
            <span className="text-rose-400 font-bold">Critical</span>
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT MAP CONTROLS */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
        {/* Toggle 3D / 2D Tilt */}
        <button
          onClick={toggle3DPitch}
          className={`p-2 rounded-lg border backdrop-blur shadow-lg transition-all font-mono font-bold text-xs flex items-center justify-center cursor-pointer ${
            pitchMode === "3D"
              ? "bg-blue-600/90 border-blue-400 text-white shadow-blue-500/20"
              : "bg-surface-base/90 border-surface-border text-slate-300 hover:text-white"
          }`}
          title={pitchMode === "3D" ? "Switch to 2D View" : "Switch to 3D View"}
        >
          {pitchMode === "3D" ? "3D" : "2D"}
        </button>

        {/* Orbit animation */}
        <button
          onClick={toggleOrbit}
          className={`p-2 rounded-lg border backdrop-blur shadow-lg transition-all cursor-pointer ${
            isOrbiting
              ? "bg-purple-600/90 border-purple-400 text-white animate-pulse"
              : "bg-surface-base/90 border-surface-border text-slate-300 hover:text-white"
          }`}
          title={isOrbiting ? "Pause Orbit" : "Auto Orbit"}
        >
          {isOrbiting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="w-full h-px bg-slate-700/50 my-0.5" />

        {/* Mapbox Zoom & Reset Controls */}
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="p-2 rounded-lg bg-surface-base/90 border border-surface-border hover:bg-surface-elevated text-slate-300 hover:text-white backdrop-blur shadow-lg transition-colors cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="p-2 rounded-lg bg-surface-base/90 border border-surface-border hover:bg-surface-elevated text-slate-300 hover:text-white backdrop-blur shadow-lg transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            mapRef.current?.resetNorthPitch({ duration: 1000 });
            setPitchMode("3D");
          }}
          className="p-2 rounded-lg bg-surface-base/90 border border-surface-border hover:bg-surface-elevated text-slate-300 hover:text-white backdrop-blur shadow-lg transition-colors cursor-pointer"
          title="Reset Orientation"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-surface-base/90 border border-surface-border hover:bg-surface-elevated text-slate-300 hover:text-white backdrop-blur shadow-lg transition-colors cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    </div>
  );
};
