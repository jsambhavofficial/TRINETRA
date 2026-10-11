"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useWorldStore } from "@/store/useWorldStore";
import {
  Layers,
  MapPin,
  AlertTriangle,
  Building,
  Truck,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Flame,
  Globe2,
  Compass,
  Plus,
  Minus,
  Mountain,
  Eye,
  Play,
  Pause,
  Box,
} from "lucide-react";
import { MapDisplayMode } from "../../../../../packages/shared-types";

// User's provided Mapbox API Token
const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoianNhbWJoYXYiLCJhIjoiY211NWxpZjh0MDJhdTJ3czdhOHVoZmNzaCJ9.LVqTGSLBaee5wmHeovxU9g";

export const MapboxView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const orbitAnimRef = useRef<number | null>(null);

  const {
    snapshot,
    layers,
    selectedIncident,
    selectedEntity,
    selectedAsset,
    selectedDistrict,
    mapDisplayMode,
    setMapDisplayMode,
    selectIncident,
    selectEntity,
    selectAsset,
    selectDistrict,
    simulationResult,
    worldMode,
    currentDemoStep,
    flyToTarget,
    toggleLayer,
  } = useWorldStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [pitchMode, setPitchMode] = useState<"3D" | "2D">("3D");
  const [telemetry, setTelemetry] = useState({
    lat: 26.9124,
    lng: 75.7873,
    zoom: 13.5,
    pitch: 52,
    bearing: -15,
  });

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

  // Helper to add 3D Terrain DEM to map
  const setupTerrainAndAtmosphere = (map: mapboxgl.Map) => {
    // 1. Add 3D Terrain Raster DEM Source
    if (!map.getSource("mapbox-dem")) {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }

    // Enable 3D Terrain with 1.5x exaggeration for dramatic topographic relief
    if (layers.terrain !== false) {
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
    }

    // 2. Set Atmospheric Sky and Deep Horizon Fog for immersive 3D space
    map.setFog({
      range: [-1, 2],
      color: mapDisplayMode === "SATELLITE" ? "#071224" : "#080c14",
      "horizon-blend": 0.18,
      "high-color": mapDisplayMode === "SATELLITE" ? "#122b4d" : "#131b2c",
      "space-color": "#020408",
      "star-intensity": 0.85,
    });
  };

  // Helper to add 3D extruded building models
  const setup3DBuildings = (map: mapboxgl.Map) => {
    const styleLayers = map.getStyle().layers;
    const labelLayerId = styleLayers?.find(
      (layer) => layer.type === "symbol" && layer.layout && (layer.layout as any)["text-field"]
    )?.id;

    if (!map.getLayer("3d-buildings")) {
      const isSat = mapDisplayMode === "SATELLITE";
      const buildingColors = isSat
        ? [
            "interpolate",
            ["linear"],
            ["get", "height"],
            0, "rgba(22, 33, 52, 0.75)",
            40, "rgba(37, 99, 235, 0.82)",
            90, "rgba(56, 189, 248, 0.9)",
          ]
        : [
            "interpolate",
            ["linear"],
            ["get", "height"],
            0, "#131c2e",
            30, "#1e293b",
            60, "#2563eb",
            110, "#38bdf8",
          ];

      map.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 12,
          layout: {
            visibility: layers.buildings ? "visible" : "none",
          },
          paint: {
            "fill-extrusion-color": buildingColors as any,
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              0,
              14.5,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              0,
              14.5,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.88,
            "fill-extrusion-ambient-occlusion-intensity": 0.45,
            "fill-extrusion-ambient-occlusion-radius": 3.0,
          },
        },
        labelLayerId
      );
    }
  };

  // Helper to add Custom NEXUS 3D Landmark Extrusions & Operational Corridors
  const setupNexusLayers = (map: mapboxgl.Map) => {
    // A. NEXUS City 25 Extruded Architectural Landmarks
    if (snapshot && !map.getSource("nexus-landmarks")) {
      const landmarkFeatures = snapshot.entities
        .filter((e) => e.entityType === "BUILDING" && e.geometry?.type === "Polygon")
        .map((b) => ({
          type: "Feature" as const,
          id: b.id,
          properties: {
            id: b.id,
            name: b.name,
            height: b.attributes?.height_meters || 55,
            status: b.status,
          },
          geometry: b.geometry as any,
        }));

      if (landmarkFeatures.length > 0) {
        map.addSource("nexus-landmarks", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: landmarkFeatures,
          },
        });

        map.addLayer({
          id: "nexus-landmarks-3d",
          type: "fill-extrusion",
          source: "nexus-landmarks",
          layout: {
            visibility: layers.buildings ? "visible" : "none",
          },
          paint: {
            "fill-extrusion-color": [
              "case",
              ["==", ["get", "status"], "DEGRADED"],
              "#ef4444",
              ["==", ["get", "status"], "CONSTRAINED"],
              "#f59e0b",
              "#0284c7",
            ],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.92,
            "fill-extrusion-ambient-occlusion-intensity": 0.5,
          },
        });

        // Click to inspect landmark
        map.on("click", "nexus-landmarks-3d", (e) => {
          if (e.features && e.features[0]) {
            const bldId = e.features[0].properties?.id;
            const target = snapshot.entities.find((ent) => ent.id === bldId);
            if (target) selectEntity(target);
          }
        });

        map.on("mouseenter", "nexus-landmarks-3d", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "nexus-landmarks-3d", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    }

    // B. NEXUS District Boundaries Layer
    if (snapshot && !map.getSource("nexus-districts")) {
      const districtFeatures = snapshot.districts.map((d) => ({
        type: "Feature" as const,
        id: d.id,
        properties: {
          id: d.id,
          name: d.name,
          code: d.code,
        },
        geometry: (d.geometry as any) || (d as any).boundary,
      }));

      map.addSource("nexus-districts", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: districtFeatures,
        },
      });

      map.addLayer({
        id: "nexus-districts-fill",
        type: "fill",
        source: "nexus-districts",
        layout: {
          visibility: layers.districts ? "visible" : "none",
        },
        paint: {
          "fill-color": "#38bdf8",
          "fill-opacity": 0.05,
        },
      });

      map.addLayer({
        id: "nexus-districts-line",
        type: "line",
        source: "nexus-districts",
        layout: {
          visibility: layers.districts ? "visible" : "none",
        },
        paint: {
          "line-color": "#38bdf8",
          "line-width": 1.5,
          "line-dasharray": [3, 2],
          "line-opacity": 0.6,
        },
      });

      map.on("click", "nexus-districts-fill", (e) => {
        if (e.features && e.features[0]) {
          const distId = e.features[0].properties?.id;
          const target = snapshot.districts.find((dst) => dst.id === distId);
          if (target) selectDistrict(target);
        }
      });
    }

    // C. Add R17 Flooded Corridor Line & Area Layer
    if (!map.getSource("flood-corridor-r17")) {
      map.addSource("flood-corridor-r17", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Road R17 Severance", status: "BLOCKED" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [75.782, 26.92],
                  [75.789, 26.916],
                  [75.795, 26.913],
                  [75.801, 26.909],
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "flood-r17-glow",
        type: "line",
        source: "flood-corridor-r17",
        layout: {
          visibility: layers.roads ? "visible" : "none",
        },
        paint: {
          "line-color": "#EF4444",
          "line-width": 8,
          "line-opacity": 0.45,
        },
      });

      map.addLayer({
        id: "flood-r17-core",
        type: "line",
        source: "flood-corridor-r17",
        layout: {
          visibility: layers.roads ? "visible" : "none",
        },
        paint: {
          "line-color": "#FF2E2E",
          "line-width": 3.5,
          "line-dasharray": [2, 1],
        },
      });
    }

    // D. Add Bypass Corridor Route (Road R14 Bypass)
    if (!map.getSource("bypass-corridor-r14")) {
      map.addSource("bypass-corridor-r14", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Corridor R14 Bypass", eta: "7.1m" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [75.775, 26.908],
                  [75.779, 26.914],
                  [75.783, 26.923],
                  [75.788, 26.928],
                  [75.792, 26.918], // Ingress to Memorial Hospital
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "bypass-r14-glow",
        type: "line",
        source: "bypass-corridor-r14",
        layout: {
          visibility: layers.roads ? "visible" : "none",
        },
        paint: {
          "line-color": "#06B6D4",
          "line-width": 7,
          "line-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "bypass-r14-core",
        type: "line",
        source: "bypass-corridor-r14",
        layout: {
          visibility: layers.roads ? "visible" : "none",
        },
        paint: {
          "line-color": "#22D3EE",
          "line-width": 3,
        },
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
      center: [75.7873, 26.9124], // Jaipur Twin / Nexus City center
      zoom: 13.5,
      pitch: 52, // 3D Isometric View
      bearing: -15,
      antialias: true,
      maxPitch: 85,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Setup 3D Terrain elevation and atmospheric fog
      setupTerrainAndAtmosphere(map);

      // Setup 3D Extruded Buildings across all styles
      setup3DBuildings(map);

      // Setup custom NEXUS layers (Landmarks, Districts, Corridors)
      setupNexusLayers(map);
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

  // 2. Dynamic Layer Visibility Sync (Terrain, Buildings, Districts, Roads)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // A. 3D Terrain Elevation Sync
    if (map.getSource("mapbox-dem")) {
      if (layers.terrain !== false) {
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
      } else {
        map.setTerrain(null);
      }
    }

    // B. 3D Buildings Sync
    if (map.getLayer("3d-buildings")) {
      map.setLayoutProperty(
        "3d-buildings",
        "visibility",
        layers.buildings ? "visible" : "none"
      );
    }
    if (map.getLayer("nexus-landmarks-3d")) {
      map.setLayoutProperty(
        "nexus-landmarks-3d",
        "visibility",
        layers.buildings ? "visible" : "none"
      );
    }

    // C. Districts Sync
    if (map.getLayer("nexus-districts-fill")) {
      map.setLayoutProperty(
        "nexus-districts-fill",
        "visibility",
        layers.districts ? "visible" : "none"
      );
      map.setLayoutProperty(
        "nexus-districts-line",
        "visibility",
        layers.districts ? "visible" : "none"
      );
    }

    // D. Roads & Corridors Sync
    if (map.getLayer("flood-r17-glow")) {
      map.setLayoutProperty(
        "flood-r17-glow",
        "visibility",
        layers.roads ? "visible" : "none"
      );
      map.setLayoutProperty(
        "flood-r17-core",
        "visibility",
        layers.roads ? "visible" : "none"
      );
    }
    if (map.getLayer("bypass-r14-glow")) {
      map.setLayoutProperty(
        "bypass-r14-glow",
        "visibility",
        layers.roads ? "visible" : "none"
      );
      map.setLayoutProperty(
        "bypass-r14-core",
        "visibility",
        layers.roads ? "visible" : "none"
      );
    }
  }, [layers]);

  // 3. Sync Dynamic 3D DOM Markers (Incidents, Hospitals, Assets)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !snapshot) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // A. Incidents (Alert halo beacons)
    if (layers.incidents) {
      snapshot.incidents.forEach((inc) => {
        const el = document.createElement("div");
        el.className = "group relative cursor-pointer";

        const isCritical = inc.severity === "CRITICAL" || inc.severity === "HIGH";
        const isSelected = selectedIncident?.id === inc.id;

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full ${
              isCritical ? "bg-red-500/30" : "bg-amber-500/30"
            } animate-ping"></span>
            <div class="w-6 h-6 rounded-full ${
              isCritical
                ? "bg-red-600 border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                : "bg-amber-500 border-2 border-white shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            } flex items-center justify-center text-[10px] font-bold text-white transition-transform hover:scale-125">
              ⚠️
            </div>
            <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold text-white shadow-lg pointer-events-none ${
              isSelected ? "ring-2 ring-cyan-400" : ""
            }">
              #${inc.incidentNumber} ${inc.title.slice(0, 18)}...
            </div>
          </div>
        `;

        el.addEventListener("click", () => {
          selectIncident(inc);
          map.flyTo({
            center: [inc.geometry.longitude, inc.geometry.latitude],
            zoom: 16.2,
            pitch: 60,
            bearing: -20,
            duration: 1200,
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([inc.geometry.longitude, inc.geometry.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // B. Facilities (Hospitals & Stations)
    if (layers.hospitals || layers.emergencyStations) {
      snapshot.entities.forEach((fac) => {
        if (fac.geometry?.type !== "Point") return;
        const isHosp = fac.entityType === "HOSPITAL";
        const isStation = fac.entityType === "EMERGENCY_STATION";

        if ((isHosp && !layers.hospitals) || (isStation && !layers.emergencyStations)) return;

        const el = document.createElement("div");
        el.className = "cursor-pointer group relative";

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="w-5 h-5 rounded-full ${
              isHosp ? "bg-emerald-600" : "bg-amber-600"
            } border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white transition-transform hover:scale-125">
              ${isHosp ? "🏥" : "🛡️"}
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.2 rounded bg-slate-950/80 border border-slate-800 text-[9px] font-mono font-semibold text-slate-200 pointer-events-none">
              ${fac.name.split(" ")[0]}
            </div>
          </div>
        `;

        el.addEventListener("click", () => {
          selectEntity(fac);
          map.flyTo({
            center: [fac.geometry.coordinates[0], fac.geometry.coordinates[1]],
            zoom: 16,
            pitch: 58,
            duration: 1100,
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([fac.geometry.coordinates[0], fac.geometry.coordinates[1]])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // C. Operational Assets (Ambulance / Rescue)
    if (layers.assets) {
      snapshot.assets.forEach((ast) => {
        const el = document.createElement("div");
        el.className = "cursor-pointer";

        const isEngaged = ast.availability === "ENGAGED" || ast.availability === "DISPATCHED";

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="w-4 h-4 rounded-full ${
              isEngaged ? "bg-amber-400" : "bg-cyan-400"
            } border border-slate-950 shadow flex items-center justify-center text-[8px] transition-transform hover:scale-125">
              🚑
            </div>
          </div>
        `;

        el.addEventListener("click", () => {
          selectAsset(ast);
          map.flyTo({
            center: [ast.geometry.longitude, ast.geometry.latitude],
            zoom: 16,
            pitch: 55,
            duration: 1000,
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([ast.geometry.longitude, ast.geometry.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [snapshot, layers, selectedIncident, selectIncident, selectEntity, selectAsset]);

  // 4. Handle FlyToTarget from Store (District selection, Command Bar, etc.)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;

    if (flyToTarget.type === "district") {
      const dist = snapshot?.districts.find((d) => d.id === flyToTarget.targetId);
      const geom = dist?.geometry || (dist as any)?.boundary;
      if (geom?.coordinates?.[0]) {
        const coords = geom.coordinates[0];
        const lngs = coords.map((c: any) => c[0]);
        const lats = coords.map((c: any) => c[1]);
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        map.flyTo({
          center: [centerLng, centerLat],
          zoom: 14.5,
          pitch: 55,
          bearing: -15,
          duration: 1500,
        });
      }
    } else if (flyToTarget.type === "incident") {
      const inc = snapshot?.incidents.find((i) => i.id === flyToTarget.targetId);
      if (inc) {
        map.flyTo({
          center: [inc.geometry.longitude, inc.geometry.latitude],
          zoom: 16.2,
          pitch: 60,
          bearing: -20,
          duration: 1400,
        });
      }
    } else if (flyToTarget.type === "entity") {
      const ent = snapshot?.entities.find((e) => e.id === flyToTarget.targetId);
      if (ent && ent.geometry?.type === "Point") {
        map.flyTo({
          center: [ent.geometry.coordinates[0], ent.geometry.coordinates[1]],
          zoom: 16.2,
          pitch: 58,
          bearing: -10,
          duration: 1300,
        });
      }
    } else if (flyToTarget.type === "asset") {
      const ast = snapshot?.assets.find((a) => a.id === flyToTarget.targetId);
      if (ast) {
        map.flyTo({
          center: [ast.geometry.longitude, ast.geometry.latitude],
          zoom: 16,
          pitch: 55,
          duration: 1200,
        });
      }
    } else if (flyToTarget.type === "overview") {
      map.flyTo({
        center: [75.7873, 26.9124],
        zoom: 13.5,
        pitch: 52,
        bearing: -15,
        duration: 1500,
      });
    }
  }, [flyToTarget, snapshot]);

  // 5. 3D Camera Controls: Pitch Mode Toggle (3D Isometric vs 2D Top-Down)
  const toggle3DPitch = () => {
    const map = mapRef.current;
    if (!map) return;
    if (pitchMode === "3D") {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      setPitchMode("2D");
    } else {
      map.easeTo({ pitch: 58, bearing: -20, duration: 1000 });
      setPitchMode("3D");
    }
  };

  // 6. 3D Auto-Orbit Animation (Cinematic Twin Inspection)
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

  // 7. Search Location Handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;
    const query = searchQuery.toLowerCase();

    // Check incident match
    const incMatch = snapshot?.incidents.find(
      (i) => i.title.toLowerCase().includes(query) || String(i.incidentNumber).includes(query)
    );
    if (incMatch) {
      selectIncident(incMatch);
      mapRef.current.flyTo({
        center: [incMatch.geometry.longitude, incMatch.geometry.latitude],
        zoom: 16.2,
        pitch: 60,
        duration: 1200,
      });
      return;
    }

    // Check entity match
    const entMatch = snapshot?.entities.find((e) => e.name.toLowerCase().includes(query));
    if (entMatch && entMatch.geometry?.type === "Point") {
      selectEntity(entMatch);
      mapRef.current.flyTo({
        center: [entMatch.geometry.coordinates[0], entMatch.geometry.coordinates[1]],
        zoom: 16.2,
        pitch: 58,
        duration: 1200,
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-space-950 overflow-hidden select-none">
      {/* Mapbox GL Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Mapbox 3D Basemap Selector */}
        <div className="pointer-events-auto flex items-center p-0.5 rounded-lg bg-surface-base/90 border border-surface-border backdrop-blur-md shadow-lg text-xs font-mono">
          <button
            onClick={() => setMapDisplayMode("3D_MAPBOX")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              mapDisplayMode === "3D_MAPBOX" || mapDisplayMode === "2D_DARK"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Mapbox 3D Tactical Base Map with 3D terrain and extruded buildings"
          >
            <Box className="w-3.5 h-3.5 text-cyan-300" />
            <span>3D Base Map</span>
          </button>

          <button
            onClick={() => setMapDisplayMode("SATELLITE")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              mapDisplayMode === "SATELLITE"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Mapbox 3D Photorealistic Satellite with elevation relief"
          >
            <Mountain className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D Satellite</span>
          </button>

          <button
            onClick={() => setMapDisplayMode("HEATMAP")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              mapDisplayMode === "HEATMAP"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="H3 Spatial Risk Heatmap Engine"
          >
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={() => setMapDisplayMode("3D_CESIUM")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              mapDisplayMode === "3D_CESIUM"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Cesium 3D Ion Globe (Alternative Engine)"
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
            placeholder="Search location (R17, Hospital)..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-base/90 border border-surface-border text-xs font-mono text-slate-200 placeholder:text-slate-500 backdrop-blur-md focus:outline-none focus:border-blue-500 shadow-lg transition-colors"
          />
        </form>

        {/* Right: Quick 3D Vantage Presets */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-lg bg-surface-base/90 border border-surface-border backdrop-blur-md shadow-lg text-xs font-mono">
          <button
            onClick={() => {
              mapRef.current?.flyTo({
                center: [75.7873, 26.9124],
                zoom: 13.5,
                pitch: 52,
                bearing: -15,
                duration: 1400,
              });
            }}
            className="px-2 py-1 text-slate-300 hover:text-white rounded hover:bg-surface-elevated transition-colors flex items-center gap-1"
          >
            <Building className="w-3 h-3 text-cyan-400" />
            <span>Overview 3D</span>
          </button>
          <button
            onClick={() => {
              mapRef.current?.flyTo({
                center: [75.792, 26.918],
                zoom: 16.2,
                pitch: 62,
                bearing: -25,
                duration: 1200,
              });
            }}
            className="px-2 py-1 text-amber-300 hover:text-amber-200 rounded hover:bg-surface-elevated transition-colors flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>R17 Flood</span>
          </button>
          <button
            onClick={() => {
              mapRef.current?.flyTo({
                center: [75.792, 26.918],
                zoom: 16.5,
                pitch: 58,
                bearing: 10,
                duration: 1200,
              });
            }}
            className="px-2 py-1 text-blue-300 hover:text-blue-200 rounded hover:bg-surface-elevated transition-colors flex items-center gap-1"
          >
            <Building className="w-3 h-3 text-blue-400" />
            <span>Hospital Wing</span>
          </button>
        </div>
      </div>

      {/* Floating 3D Telemetry HUD (Bottom Left) */}
      <div className="absolute bottom-14 left-4 z-10 p-2.5 rounded-lg bg-surface-base/90 border border-surface-border backdrop-blur-md shadow-lg text-[10px] font-mono text-slate-300 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-100 flex items-center gap-1.5">
            <Box className="w-3 h-3 text-cyan-400" />
            {mapDisplayMode === "SATELLITE"
              ? "MAPBOX 3D SATELLITE TERRAIN"
              : mapDisplayMode === "HEATMAP"
              ? "MAPBOX 3D RISK ENGINE"
              : "MAPBOX 3D BASE MAP (EXTRUDED)"}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            DEM 1.5x
          </span>
        </div>
        <div className="text-slate-400 flex items-center gap-3">
          <span>LAT: {telemetry.lat.toFixed(4)}°N</span>
          <span>LON: {telemetry.lng.toFixed(4)}°E</span>
          <span>PITCH: {telemetry.pitch.toFixed(0)}°</span>
          <span>BEARING: {telemetry.bearing.toFixed(0)}°</span>
          <span>ZOOM: {telemetry.zoom.toFixed(1)}</span>
        </div>
      </div>

      {/* Floating 3D Action Tools (Right Edge) */}
      <div className="absolute bottom-20 right-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
        {/* Toggle 3D / 2D Tilt */}
        <button
          onClick={toggle3DPitch}
          className={`p-2 rounded-lg border backdrop-blur shadow-lg transition-all font-mono font-bold text-xs flex items-center justify-center ${
            pitchMode === "3D"
              ? "bg-blue-600/90 border-blue-400 text-white shadow-blue-500/20"
              : "bg-surface-base/90 border-surface-border text-slate-300 hover:text-white"
          }`}
          title={pitchMode === "3D" ? "Switch to 2D Top-Down View" : "Switch to 3D Isometric View"}
        >
          {pitchMode === "3D" ? "3D" : "2D"}
        </button>

        {/* Cinematic Auto-Orbit */}
        <button
          onClick={toggleOrbit}
          className={`p-2 rounded-lg border backdrop-blur shadow-lg transition-all ${
            isOrbiting
              ? "bg-purple-600/90 border-purple-400 text-white animate-pulse"
              : "bg-surface-base/90 border-surface-border text-slate-300 hover:text-white"
          }`}
          title={isOrbiting ? "Pause Cinematic 3D Orbit" : "Start Cinematic 3D Orbit"}
        >
          {isOrbiting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Toggle 3D Terrain Relief */}
        <button
          onClick={() => toggleLayer("terrain")}
          className={`p-2 rounded-lg border backdrop-blur shadow-lg transition-all ${
            layers.terrain
              ? "bg-emerald-600/90 border-emerald-400 text-white"
              : "bg-surface-base/90 border-surface-border text-slate-400 hover:text-white"
          }`}
          title={layers.terrain ? "Disable 3D Terrain Relief" : "Enable 3D Terrain Relief"}
        >
          <Mountain className="w-4 h-4" />
        </button>

        <div className="w-full h-px bg-slate-700/50 my-0.5" />

        {/* Mapbox Zoom & Reset Controls */}
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="p-2 rounded-lg bg-surface-base/90 border border-surface-border hover:bg-surface-elevated text-slate-300 hover:text-white backdrop-blur shadow-lg transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="p-2 rounded-lg bg-surface-base/90 border border-surface-border hover:bg-surface-elevated text-slate-300 hover:text-white backdrop-blur shadow-lg transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            mapRef.current?.resetNorthPitch({ duration: 1000 });
            setPitchMode("3D");
          }}
          className="p-2 rounded-lg bg-surface-base/90 border border-surface-border hover:bg-surface-elevated text-slate-300 hover:text-white backdrop-blur shadow-lg transition-colors"
          title="Reset Orientation & North"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
