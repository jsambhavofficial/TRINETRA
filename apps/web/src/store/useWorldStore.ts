"use client";

import { create } from "zustand";
import {
  Asset,
  District,
  Incident,
  IncidentCandidate,
  LayerVisibilityState,
  RealtimeEvent,
  SpatialEntity,
  WorldSnapshot,
  OperationalRole,
  OperationalMode,
  IncidentImpactResponse,
  SimulationResult,
  ResponsePlan,
  ResponseAction,
  VoiceCommandResult,
  DemoTimelineStep,
  MapDisplayMode,
} from "../../../../packages/shared-types";
import { DEMO_TIMELINE_STEPS } from "./demoTimeline";
import { cameraController } from "../components/spatial/CameraController";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

let autoPlayTimer: NodeJS.Timeout | null = null;

interface WorldState {
  snapshot: WorldSnapshot | null;
  isLoading: boolean;
  error: string | null;

  // Operational Role & Access
  operationalRole: OperationalRole;

  // Selected spatial objects
  selectedEntity: SpatialEntity | null;
  selectedDistrict: District | null;
  selectedAsset: Asset | null;
  selectedIncident: Incident | null;
  selectedCandidate: IncidentCandidate | null;

  // Incident Candidates (Phase 3 Multimodal Ingestion)
  candidates: IncidentCandidate[];

  // Layer visibility toggles
  layers: LayerVisibilityState;

  // Active map filters
  filters: {
    incidentSeverity: string; // "ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"
    assetAvailability: string; // "ALL", "AVAILABLE", "EN_ROUTE", "ENGAGED"
    facilityType: string; // "ALL", "HOSPITAL", "EMERGENCY_STATION", "FACILITY", "UTILITY_NODE"
  };

  // Camera fly-to state
  flyToTarget: { targetId: string; type: "district" | "entity" | "asset" | "incident" | "candidate" | "overview"; timestamp: number } | null;

  // Operational world mode
  worldMode: OperationalMode;

  // Map Display Mode: 2D_DARK | SATELLITE | 3D_CESIUM | HEATMAP
  mapDisplayMode: MapDisplayMode;

  // RightRail active tab & visibility
  activeRightRailTab: string;
  isRightRailOpen: boolean;
  toggleRightRail: (open?: boolean) => void;

  // Phase 5 Intelligence & Simulation state
  impactData: IncidentImpactResponse | null;
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  responsePlan: ResponsePlan | null;

  // Voice Assistant
  isVoiceModalOpen: boolean;
  voiceResult: VoiceCommandResult | null;

  // Drill status
  isDrillRunning: boolean;

  // Phase 6 Judge Mode & Demo Controller
  isJudgeMode: boolean;
  currentDemoStep: number;
  isAutoPlaying: boolean;
  demoSteps: DemoTimelineStep[];
  isJudgeBriefingOpen: boolean;

  // Event stream
  realtimeEvents: RealtimeEvent[];

  // Actions
  fetchSnapshot: (worldId?: string) => Promise<void>;
  fetchCandidates: () => Promise<void>;
  setOperationalRole: (role: OperationalRole) => void;
  setActiveRightRailTab: (tab: string) => void;
  selectEntity: (entity: SpatialEntity | null) => void;
  selectDistrict: (district: District | null) => void;
  selectAsset: (asset: Asset | null) => void;
  selectIncident: (incident: Incident | null) => void;
  selectCandidate: (candidate: IncidentCandidate | null) => void;
  confirmCandidate: (candidateId: string, reviewerId?: string) => Promise<void>;
  rejectCandidate: (candidateId: string, reviewerId?: string) => Promise<void>;
  clearSelection: () => void;
  toggleLayer: (layerKey: keyof LayerVisibilityState) => void;
  setFilter: (key: "incidentSeverity" | "assetAvailability" | "facilityType", value: string) => void;
  triggerFlyTo: (targetId: string, type: "district" | "entity" | "asset" | "incident" | "candidate" | "overview") => void;
  addRealtimeEvent: (event: RealtimeEvent) => void;
  updateAssetTelemetry: (assetId: string, patch: Partial<Asset>) => void;
  setWorldMode: (mode: OperationalMode) => void;
  setMapDisplayMode: (mode: MapDisplayMode) => void;
  runCoreDemoFusion: () => Promise<void>;

  // Phase 5 Action Handlers
  fetchIncidentImpact: (incidentId: string) => Promise<void>;
  runSimulationScenario: (scenarioType?: string, targetEntityId?: string) => Promise<void>;
  fetchResponsePlan: (incidentId: string) => Promise<void>;
  approveResponseAction: (actionId: string, notes?: string) => Promise<void>;
  executeResponseAction: (actionId: string) => Promise<void>;
  verifyIncidentClosedLoop: (incidentId: string) => Promise<void>;
  sendVoiceCommand: (query: string) => Promise<VoiceCommandResult | null>;
  toggleVoiceModal: (open?: boolean) => void;
  resetFlagshipScenario: () => Promise<void>;
  runFullFlagshipDrill: () => Promise<void>;

  // Phase 6 Judge Mode & Demo Controller Handlers
  toggleJudgeMode: (active?: boolean) => void;
  toggleJudgeBriefing: (open?: boolean) => void;
  executeDemoStep: (stepIndex: number) => Promise<void>;
  nextDemoStep: () => Promise<void>;
  prevDemoStep: () => Promise<void>;
  startAutoPlay: () => void;
  pauseAutoPlay: () => void;
  resetDemo: () => Promise<void>;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  snapshot: null,
  isLoading: false,
  error: null,

  selectedEntity: null,
  selectedDistrict: null,
  selectedAsset: null,
  selectedIncident: null,
  selectedCandidate: null,

  candidates: [],

  layers: {
    terrain: true,
    buildings: true,
    roads: true,
    districts: true,
    hospitals: true,
    emergencyStations: true,
    utilities: true,
    assets: true,
    incidents: true,
    candidates: true,
    riskHeatmap: false,
  },

  filters: {
    incidentSeverity: "ALL",
    assetAvailability: "ALL",
    facilityType: "ALL",
  },

  operationalRole: "AUTHORITY",
  flyToTarget: null,
  worldMode: "LIVE",
  mapDisplayMode: "3D_MAPBOX",
  activeRightRailTab: "context",
  impactData: null,
  simulationResult: null,
  isSimulating: false,
  responsePlan: null,
  isVoiceModalOpen: false,
  voiceResult: null,
  isDrillRunning: false,
  isJudgeMode: true,
  currentDemoStep: 1,
  isAutoPlaying: false,
  demoSteps: DEMO_TIMELINE_STEPS,
  isJudgeBriefingOpen: false,
  realtimeEvents: [],

  setOperationalRole: (role) => set({ operationalRole: role }),
  isRightRailOpen: true,
  toggleRightRail: (open) =>
    set((s) => ({ isRightRailOpen: open !== undefined ? open : !s.isRightRailOpen })),
  setActiveRightRailTab: (tab) => set({ activeRightRailTab: tab }),
  setMapDisplayMode: (mode) => set({ mapDisplayMode: mode }),

  fetchSnapshot: async (worldId = "world-nexus-city-01") => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/snapshot`, {
        headers: { "X-User-Role": "COMMANDER" },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch world model snapshot`);
      }
      const raw = await res.json();
      const data: WorldSnapshot = {
        ...raw,
        incidents: (raw.incidents || []).map((inc: any) => ({
          ...inc,
          incidentNumber: inc.incidentNumber ?? inc.incident_number ?? (inc.id === "inc-1047" || inc.id === "inc-nxc-001" ? 1047 : 1001),
          incidentType: inc.incidentType ?? inc.incident_type,
          evidenceCount: inc.evidenceCount ?? inc.evidence_count ?? 0,
          affectedEntityCount: inc.affectedEntityCount ?? inc.affected_entity_count ?? 0,
          epistemicStatus: inc.epistemicStatus ?? inc.epistemic_status ?? "OBSERVED",
          affectedRadiusMeters: inc.affectedRadiusMeters ?? inc.affected_radius_meters ?? 100,
          startedAt: inc.startedAt ?? inc.started_at,
          detectedAt: inc.detectedAt ?? inc.detected_at,
          resolvedAt: inc.resolvedAt ?? inc.resolved_at,
          worldId: inc.worldId ?? inc.world_id,
          corroborationScore: inc.corroborationScore ?? inc.corroboration_score ?? 0,
          entityMatchConfidence: inc.entityMatchConfidence ?? inc.entity_match_confidence ?? 0,
          epistemicBreakdown: inc.epistemicBreakdown ?? inc.epistemic_breakdown,
          fusionRationale: inc.fusionRationale ?? inc.fusion_rationale,
          mergedIntoId: inc.mergedIntoId ?? inc.merged_into_id,
        })),
        entities: (raw.entities || []).map((ent: any) => ({
          ...ent,
          entityType: ent.entityType ?? ent.entity_type,
          worldId: ent.worldId ?? ent.world_id,
          parentEntityId: ent.parentEntityId ?? ent.parent_entity_id,
        })),
        assets: (raw.assets || []).map((ast: any) => ({
          ...ast,
          assetType: ast.assetType ?? ast.asset_type,
          entityId: ast.entityId ?? ast.entity_id,
        })),
        districts: (raw.districts || []).map((dist: any) => ({
          ...dist,
          populationEstimate: dist.populationEstimate ?? dist.population_estimate ?? 125000,
          incidentCount: dist.incidentCount ?? dist.incident_count ?? 0,
          facilityCount: dist.facilityCount ?? dist.facility_count ?? 0,
          assetCount: dist.assetCount ?? dist.asset_count ?? 0,
          operationalScore: dist.operationalScore ?? dist.operational_score ?? 0.88,
        })),
      };
      set({ snapshot: data, isLoading: false });

      // Automatically select primary incident on initial load
      if (data.incidents.length > 0 && !get().selectedIncident) {
        const primary = data.incidents.find((i) => i.incidentNumber === 1047) || data.incidents[0];
        set({ selectedIncident: primary });
      }

      // Also fetch candidates
      get().fetchCandidates();
    } catch (err: any) {
      console.warn("Snapshot fetch fallback to seed data:", err.message);
      set({
        error: err.message,
        isLoading: false,
      });
    }
  },

  fetchCandidates: async () => {
    try {
      const res = await fetch(`${API_BASE}/incidents/candidates?world_id=world-nexus-city-01`);
      if (res.ok) {
        const raw = await res.json();
        const data = (raw || []).map((cand: any) => ({
          ...cand,
          incidentType: cand.incidentType ?? cand.incident_type,
          severityHint: cand.severityHint ?? cand.severity_hint ?? cand.severity ?? "HIGH",
          epistemicStatus: cand.epistemicStatus ?? cand.epistemic_status ?? "OBSERVED",
          affectedRadiusMeters: cand.affectedRadiusMeters ?? cand.affected_radius_meters ?? 100,
          resolvedEntityId: cand.resolvedEntityId ?? cand.resolved_entity_id,
          worldId: cand.worldId ?? cand.world_id,
        }));
        set({ candidates: data });
      }
    } catch (err: any) {
      console.warn("Failed to fetch candidates:", err.message);
    }
  },

  selectEntity: (entity) =>
    set({
      selectedEntity: entity,
      selectedDistrict: null,
      selectedAsset: null,
      selectedIncident: null,
      selectedCandidate: null,
    }),

  selectDistrict: (district) =>
    set({
      selectedDistrict: district,
      selectedEntity: null,
      selectedAsset: null,
      selectedIncident: null,
      selectedCandidate: null,
    }),

  selectAsset: (asset) =>
    set({
      selectedAsset: asset,
      selectedDistrict: null,
      selectedEntity: null,
      selectedIncident: null,
      selectedCandidate: null,
    }),

  selectIncident: (incident) =>
    set({
      selectedIncident: incident,
      isRightRailOpen: true,
      selectedDistrict: null,
      selectedEntity: null,
      selectedAsset: null,
      selectedCandidate: null,
    }),

  selectCandidate: (candidate) =>
    set({
      selectedCandidate: candidate,
      selectedEntity: null,
      selectedDistrict: null,
      selectedAsset: null,
      selectedIncident: null,
    }),

  confirmCandidate: async (candidateId, reviewerId = "operator") => {
    try {
      const fd = new FormData();
      fd.append("reviewer_id", reviewerId);
      const res = await fetch(`${API_BASE}/incidents/candidates/${candidateId}/confirm`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        await get().fetchCandidates();
        await get().fetchSnapshot();
      }
    } catch (err: any) {
      console.error("Failed to confirm candidate:", err.message);
    }
  },

  rejectCandidate: async (candidateId, reviewerId = "operator") => {
    try {
      const fd = new FormData();
      fd.append("reviewer_id", reviewerId);
      const res = await fetch(`${API_BASE}/incidents/candidates/${candidateId}/reject`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        await get().fetchCandidates();
        if (get().selectedCandidate?.id === candidateId) {
          set({ selectedCandidate: null });
        }
      }
    } catch (err: any) {
      console.error("Failed to reject candidate:", err.message);
    }
  },

  clearSelection: () =>
    set({
      selectedEntity: null,
      selectedDistrict: null,
      selectedAsset: null,
      selectedIncident: null,
      selectedCandidate: null,
    }),

  toggleLayer: (layerKey) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerKey]: !state.layers[layerKey],
      },
    })),

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),

  triggerFlyTo: (targetId, type) =>
    set({
      flyToTarget: {
        targetId,
        type,
        timestamp: Date.now(),
      },
    }),

  addRealtimeEvent: (event) =>
    set((state) => ({
      realtimeEvents: [event, ...state.realtimeEvents.slice(0, 49)],
    })),

  updateAssetTelemetry: (assetId, patch) =>
    set((state) => {
      if (!state.snapshot) return state;
      const updatedAssets = state.snapshot.assets.map((a) => {
        if (a.id === assetId) {
          return {
            ...a,
            ...patch,
            state: {
              ...a.state,
              ...(patch.state || {}),
            },
          };
        }
        return a;
      });
      return {
        snapshot: {
          ...state.snapshot,
          assets: updatedAssets,
        },
      };
    }),

  setWorldMode: (mode) => set({ worldMode: mode }),

  runCoreDemoFusion: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch(`${API_BASE}/fusion/demo/core-run`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        await get().fetchSnapshot();
        await get().fetchCandidates();
        const targetId = data.incident_id || data.canonical_incident?.id || "inc-1047";
        const freshSnapshot = get().snapshot;
        const found = freshSnapshot?.incidents.find(
          (i) => i.id === targetId || i.incidentNumber === 1047
        );
        if (found) {
          get().selectIncident(found);
          get().triggerFlyTo(found.id, "incident");
        }
      }
    } catch (err: any) {
      console.error("Failed to run core fusion demo:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchIncidentImpact: async (incidentId) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/impact`, {
        headers: { "X-User-Role": "COMMANDER" },
      });
      if (res.ok) {
        const raw = await res.json();
        const data: IncidentImpactResponse = {
          incidentId: raw.incident_id,
          incidentNumber: raw.incident_number,
          title: raw.title,
          severity: raw.severity,
          status: raw.status,
          impactSummary: {
            totalDirectImpacts: raw.impact_summary?.total_direct_impacts ?? 0,
            totalAccessImpacts: raw.impact_summary?.total_access_impacts ?? 0,
            totalRouteImpacts: raw.impact_summary?.total_route_impacts ?? 0,
            totalSecondaryImpacts: raw.impact_summary?.total_secondary_impacts ?? 0,
            districtMetrics: {
              districtName: raw.impact_summary?.district_metrics?.district_name ?? "South Sector",
              districtCode: raw.impact_summary?.district_metrics?.district_code ?? "SEC-SOUTH",
              populationExposed: raw.impact_summary?.district_metrics?.population_exposed ?? 42500,
              overallAccessibilityIndex: raw.impact_summary?.district_metrics?.overall_accessibility_index ?? 71.4,
              indexDropPct: raw.impact_summary?.district_metrics?.index_drop_pct ?? -23.6,
              criticalFacilitiesImpeded: raw.impact_summary?.district_metrics?.critical_facilities_impeded ?? 1,
              responseUnitsRerouted: raw.impact_summary?.district_metrics?.response_units_rerouted ?? 1,
            },
          },
          directImpacts: (raw.direct_impacts || []).map((di: any) => ({
            entityId: di.entity_id,
            name: di.name,
            entityType: di.entity_type,
            impactType: di.impact_type,
            severity: di.severity,
            distanceMeters: di.distance_meters,
            delayMinutes: di.delay_minutes,
            reason: di.reason,
            metrics: di.metrics,
          })),
          accessImpacts: (raw.access_impacts || []).map((ai: any) => ({
            entityId: ai.entity_id,
            name: ai.name,
            entityType: ai.entity_type,
            impactType: ai.impact_type,
            severity: ai.severity,
            distanceMeters: ai.distance_meters,
            delayMinutes: ai.delay_minutes,
            reason: ai.reason,
            metrics: ai.metrics,
          })),
          routeImpacts: (raw.route_impacts || []).map((ri: any) => ({
            entityId: ri.asset_id,
            name: ri.name,
            entityType: ri.asset_type,
            impactType: ri.impact_type,
            severity: ri.severity,
            delayMinutes: ri.delay_mins,
            reason: ri.reason,
            recommendedReroute: ri.recommended_reroute,
          })),
          secondaryImpacts: (raw.secondary_impacts || []).map((si: any) => ({
            entityId: si.entity_id,
            name: si.name,
            entityType: si.entity_type,
            impactType: si.impact_type,
            severity: si.severity,
            distanceMeters: si.distance_meters,
            reason: si.reason,
            metrics: si.metrics,
          })),
          graph: raw.graph || { nodes: [], edges: [] },
        };
        set({ impactData: data });
      }
    } catch (err: any) {
      console.error("Failed to fetch incident impact:", err.message);
    }
  },

  runSimulationScenario: async (scenarioType = "ROAD_CLOSURE", targetEntityId = "ent-road-r17") => {
    try {
      set({ isSimulating: true });
      const res = await fetch(`${API_BASE}/simulation/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_type: scenarioType,
          target_entity_id: targetEntityId,
          incident_id: get().selectedIncident?.id || "inc-nxc-001",
        }),
      });
      if (res.ok) {
        const raw = await res.json();
        const simResult: SimulationResult = {
          scenarioId: raw.scenario_id,
          scenarioType: raw.scenario_type,
          targetCorridor: raw.target_corridor,
          isSimulated: true,
          mode: "SIMULATION",
          timestamp: raw.timestamp,
          summary: raw.summary,
          metrics: {
            baselineTransitMins: raw.metrics?.baseline_transit_mins ?? 4.2,
            unmitigatedTransitMins: raw.metrics?.unmitigated_transit_mins ?? 18.5,
            unmitigatedDelayMins: raw.metrics?.unmitigated_delay_mins ?? 14.3,
            simulatedRerouteMins: raw.metrics?.simulated_reroute_mins ?? 7.1,
            simulatedDelayMins: raw.metrics?.simulated_delay_mins ?? 2.9,
            netTimeSavedMins: raw.metrics?.net_time_saved_mins ?? 11.4,
            districtTrafficIndexDelta: raw.metrics?.district_traffic_index_delta ?? "+16%",
          },
          alternativeRoutes: (raw.alternative_routes || []).map((ar: any) => ({
            routeId: ar.route_id,
            name: ar.name,
            etaMins: ar.eta_mins,
            distanceKm: ar.distance_km,
            delayVsBaselineMins: ar.delay_vs_baseline_mins,
            surfaceCondition: ar.surface_condition,
            throughputCapacityPct: ar.throughput_capacity_pct,
            recommended: ar.recommended,
            pathCoordinates: ar.path_coordinates,
          })),
          affectedAssets: (raw.affected_assets || []).map((aa: any) => ({
            assetId: aa.asset_id,
            name: aa.name,
            assignedIncident: aa.assigned_incident,
            baselineEtaMins: aa.baseline_eta_mins,
            unmitigatedEtaMins: aa.unmitigated_eta_mins,
            simulatedEtaMins: aa.simulated_eta_mins,
            timeSavedMins: aa.time_saved_mins,
            actionRequired: aa.action_required,
          })),
          affectedFacilities: (raw.affected_facilities || []).map((af: any) => ({
            facilityId: af.facility_id,
            name: af.name,
            primaryIngress: af.primary_ingress,
            alternativeIngress: af.alternative_ingress,
            ingressStatus: af.ingress_status,
            patientTransferDelayMins: af.patient_transfer_delay_mins,
          })),
          recommendedInterventions: raw.recommended_interventions || [],
        };
        set({ simulationResult: simResult, worldMode: "SIMULATION" });
      }
    } catch (err: any) {
      console.error("Simulation failed:", err.message);
    } finally {
      set({ isSimulating: false });
    }
  },

  fetchResponsePlan: async (incidentId) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/response-plan`, {
        headers: { "X-User-Role": "COMMANDER" },
      });
      if (res.ok) {
        const raw = await res.json();
        const plan: ResponsePlan = {
          planId: raw.plan_id,
          incidentId: raw.incident_id,
          incidentNumber: raw.incident_number,
          incidentTitle: raw.incident_title,
          objective: raw.objective,
          priority: raw.priority,
          status: raw.status,
          policyEvaluation: raw.policy_evaluation,
          actions: (raw.actions || []).map((a: any) => ({
            actionId: a.action_id || a.id,
            actionType: a.action_type,
            title: a.title,
            description: a.description,
            targetEntityId: a.target_entity_id,
            targetAssetId: a.target_asset_id,
            status: a.status,
            priority: a.priority,
            estimatedDurationMins: a.estimated_duration_mins,
            resourceAssigned: a.resource_assigned,
            requiresApproval: a.requires_approval,
            actor: a.actor,
            approvedAt: a.approved_at,
            executedAt: a.executed_at,
            verifiedAt: a.verified_at,
          })),
        };
        set({ responsePlan: plan });
      }
    } catch (err: any) {
      console.error("Failed to fetch response plan:", err.message);
    }
  },

  approveResponseAction: async (actionId, notes = "Approved via Command Center") => {
    try {
      const res = await fetch(`${API_BASE}/actions/${actionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Role": "COMMANDER" },
        body: JSON.stringify({ actor: "Commander Vikram Malhotra", notes }),
      });
      if (res.ok) {
        if (get().responsePlan) {
          const updatedActions = get().responsePlan!.actions.map((act) =>
            act.actionId === actionId ? { ...act, status: "APPROVED" as const, approvedAt: new Date().toISOString() } : act
          );
          set({ responsePlan: { ...get().responsePlan!, actions: updatedActions } });
        }
      }
    } catch (err: any) {
      console.error("Action approval error:", err.message);
    }
  },

  executeResponseAction: async (actionId) => {
    try {
      const formData = new FormData();
      formData.append("actor", "Commander Vikram Malhotra");
      const res = await fetch(`${API_BASE}/actions/${actionId}/execute`, {
        method: "POST",
        headers: { "X-User-Role": "COMMANDER" },
        body: formData,
      });
      if (res.ok) {
        if (get().responsePlan) {
          const updatedActions = get().responsePlan!.actions.map((act) =>
            act.actionId === actionId ? { ...act, status: "COMPLETED" as const, executedAt: new Date().toISOString() } : act
          );
          set({ responsePlan: { ...get().responsePlan!, actions: updatedActions } });
        }
        await get().fetchSnapshot();
      }
    } catch (err: any) {
      console.error("Action execution error:", err.message);
    }
  },

  verifyIncidentClosedLoop: async (incidentId) => {
    try {
      const formData = new FormData();
      formData.append("actor", "Commander Vikram Malhotra");
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/verify`, {
        method: "POST",
        headers: { "X-User-Role": "COMMANDER" },
        body: formData,
      });
      if (res.ok) {
        await get().fetchSnapshot();
        if (get().selectedIncident) {
          set({
            selectedIncident: {
              ...get().selectedIncident!,
              status: "RESOLVED",
              confidence: 0.99,
              epistemicStatus: "OBSERVED",
              summary: "RESOLVED: Road R17 flooding cleared by auxiliary pump deployment. Water level decreased to 4cm.",
            },
          });
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err.message);
    }
  },

  sendVoiceCommand: async (query) => {
    try {
      const res = await fetch(`${API_BASE}/voice/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, actor: "Commander Vikram Malhotra" }),
      });
      if (res.ok) {
        const raw: any = await res.json();
        const data: VoiceCommandResult = {
          transcript: raw.transcript || raw.query || query,
          intent: raw.intent || "QUERY_STATUS",
          toolCalled: raw.toolCalled || raw.tool_called || "system",
          spokenResponse: raw.spokenResponse || raw.spoken_response || "Command processed.",
          clientAction: raw.clientAction || (raw.client_action ? {
            action: raw.client_action.action,
            targetId: raw.client_action.targetId || raw.client_action.target_id,
            tab: raw.client_action.tab,
            entityType: raw.client_action.entityType || raw.client_action.entity_type,
            message: raw.client_action.message,
          } : undefined),
          data: raw.data,
        };
        set({ voiceResult: data });
        // Handle client UI action triggers
        if (data.clientAction) {
          const { action, tab, targetId, entityType } = data.clientAction;
          if (tab) set({ activeRightRailTab: tab });
          if (targetId && (action === "FOCUS_INCIDENT" || action === "FOCUS_ENTITY")) {
            get().triggerFlyTo(targetId, entityType ? (entityType.toLowerCase() as any) : "incident");
          }
          if (action === "INCIDENT_RESOLVED") {
            await get().fetchSnapshot();
          }
        }
        return data;
      }
    } catch (err: any) {
      console.error("Voice command failed:", err.message);
    }
    return null;
  },

  toggleVoiceModal: (open) => {
    set((state) => ({ isVoiceModalOpen: open !== undefined ? open : !state.isVoiceModalOpen }));
  },

  resetFlagshipScenario: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch(`${API_BASE}/scenarios/r17/reset`, { method: "POST" });
      if (res.ok) {
        await get().fetchSnapshot();
        await get().fetchCandidates();
        set({
          simulationResult: null,
          worldMode: "LIVE",
          activeRightRailTab: "context",
        });
      }
    } catch (err: any) {
      console.error("Scenario reset failed:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  runFullFlagshipDrill: async () => {
    try {
      set({ isDrillRunning: true });
      const res = await fetch(`${API_BASE}/scenarios/r17/run-full`, { method: "POST" });
      if (res.ok) {
        await get().fetchSnapshot();
        const freshSnapshot = get().snapshot;
        const inc = freshSnapshot?.incidents.find((i) => i.incidentNumber === 1047 || i.id === "inc-nxc-001");
        if (inc) {
          get().selectIncident(inc);
          get().triggerFlyTo(inc.id, "incident");
          set({ activeRightRailTab: "response" });
        }
      }
    } catch (err: any) {
      console.error("Flagship drill failed:", err.message);
    } finally {
      set({ isDrillRunning: false });
    }
  },

  // Phase 6 Judge Mode & Demo Controller
  toggleJudgeMode: (active) => {
    set((state) => ({ isJudgeMode: active !== undefined ? active : !state.isJudgeMode }));
  },

  toggleJudgeBriefing: (open) => {
    set((state) => ({ isJudgeBriefingOpen: open !== undefined ? open : !state.isJudgeBriefingOpen }));
  },

  executeDemoStep: async (stepIndex: number) => {
    const steps = DEMO_TIMELINE_STEPS;
    const step = steps.find((s) => s.stepIndex === stepIndex);
    if (!step) return;

    set({ currentDemoStep: stepIndex, isLoading: true });

    try {
      // 1. Trigger backend step
      await fetch(`${API_BASE}/scenarios/r17/step/${stepIndex}`, { method: "POST" });

      // 2. Camera choreography
      if (typeof window !== "undefined") {
        cameraController.flyToLocation(
          step.cameraCoords.lat,
          step.cameraCoords.lng,
          step.cameraCoords.alt,
          1.5
        );
      }

      // 3. UI Tab synchronization
      if (step.activeTab) {
        set({ activeRightRailTab: step.activeTab });
      }

      // 4. Ensure R17 incident is selected
      const currentInc = get().snapshot?.incidents.find((i) => i.incidentNumber === 1047 || i.id === "inc-nxc-001");
      if (currentInc) {
        set({ selectedIncident: currentInc });
      }

      // 5. Specific step triggers
      if (stepIndex === 1) {
        await get().fetchSnapshot();
        await get().fetchCandidates();
      } else if (stepIndex === 4) {
        await get().runCoreDemoFusion();
        await get().fetchSnapshot();
      } else if (stepIndex === 6) {
        await get().fetchIncidentImpact("inc-nxc-001");
      } else if (stepIndex === 7) {
        await get().runSimulationScenario("ROAD_CLOSURE", "ent-road-r17");
        await get().fetchResponsePlan("inc-nxc-001");
      } else if (stepIndex === 8) {
        await get().fetchResponsePlan("inc-nxc-001");
      } else if (stepIndex === 10) {
        await get().fetchSnapshot();
      }

      // 6. Broadcast ticker event
      get().addRealtimeEvent({
        eventId: `evt-step-${stepIndex}-${Date.now()}`,
        type: step.category as any,
        timestamp: new Date().toISOString(),
        payload: {
          id: `step-${stepIndex}`,
          message: `[${step.time}] ${step.title}: ${step.actionSummary}`,
          state: {
            step: stepIndex,
            time: step.time,
            title: step.title,
          },
        },
      });
    } catch (err: any) {
      console.error("Failed to execute demo step:", err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  nextDemoStep: async () => {
    const cur = get().currentDemoStep;
    if (cur < 10) {
      await get().executeDemoStep(cur + 1);
    } else {
      get().pauseAutoPlay();
    }
  },

  prevDemoStep: async () => {
    const cur = get().currentDemoStep;
    if (cur > 1) {
      await get().executeDemoStep(cur - 1);
    }
  },

  startAutoPlay: () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    set({ isAutoPlaying: true });

    autoPlayTimer = setInterval(async () => {
      const { currentDemoStep, nextDemoStep, pauseAutoPlay } = get();
      if (currentDemoStep < 10) {
        await nextDemoStep();
      } else {
        pauseAutoPlay();
      }
    }, 4500);
  },

  pauseAutoPlay: () => {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
    set({ isAutoPlaying: false });
  },

  resetDemo: async () => {
    get().pauseAutoPlay();
    set({ currentDemoStep: 1 });
    await get().resetFlagshipScenario();
    await get().executeDemoStep(1);
  },
}));

