/**
 * NEXUS Canonical Shared Types
 * Master data contracts shared between Backend (FastAPI/Pydantic) and Frontend (Next.js/TypeScript).
 */

export type EpistemicStatus = 'OBSERVED' | 'INFERRED' | 'PREDICTED' | 'SIMULATED';

export type OrganizationType = 'GOVERNMENT' | 'ENTERPRISE' | 'REGIONAL' | 'MUNICIPAL' | 'FACILITY';

export type TrinetraRole =
  | 'STATE_LEADERSHIP'
  | 'DISTRICT_ADMIN'
  | 'DEPARTMENT'
  | 'FIELD_OFFICER'
  | 'CITIZEN'
  | 'PLATFORM_ADMIN';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMMANDER'
  | 'REGIONAL_OPERATOR'
  | 'FACILITY_MANAGER'
  | 'FIELD_RESPONDER'
  | 'VIEWER'
  | 'REPORTER'
  | TrinetraRole;

export interface DistrictInfo {
  id: string;
  name: string;
  division: string;
  headquarters: string;
  latitude: number;
  longitude: number;
  population_tier: string;
  risk_index: number;
  is_assigned_district?: boolean;
}

export interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  category: string;
  lead_title: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: TrinetraRole | string;
  district_id?: string | null;
  department_id?: string | null;
  unit_id?: string | null;
  phone?: string | null;
  is_active: boolean;
}

export type EntityType =
  | 'ROAD'
  | 'BRIDGE'
  | 'BUILDING'
  | 'HOSPITAL'
  | 'EMERGENCY_STATION'
  | 'FACILITY'
  | 'UTILITY_NODE'
  | 'ZONE'
  | 'REGION';

export type EntityStatus =
  | 'OPERATIONAL'
  | 'OPEN'
  | 'DEGRADED'
  | 'CONSTRAINED'
  | 'BLOCKED'
  | 'RESTRICTED'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'AT_RISK';

export type AssetType =
  | 'AMBULANCE'
  | 'RESPONSE_TEAM'
  | 'POLICE_UNIT'
  | 'FIRE_TRUCK'
  | 'DRONE'
  | 'PUMP_UNIT'
  | 'GENERATOR';

export type AssetAvailability = 'AVAILABLE' | 'DISPATCHED' | 'ENGAGED' | 'MAINTENANCE' | 'OFFLINE';

export type IncidentType =
  | 'URBAN_FLOODING'
  | 'ROAD_BLOCKAGE'
  | 'POWER_OUTAGE'
  | 'INFRASTRUCTURE_DAMAGE'
  | 'STRUCTURAL_COLLAPSE'
  | 'HAZMAT_SPILL';

export type IncidentStatus =
  | 'CANDIDATE'
  | 'CORROBORATING'
  | 'CORROBORATED'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'ESCALATING'
  | 'STABILIZING'
  | 'RESOLVED'
  | 'MERGED'
  | 'REJECTED';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EvidenceType = 'PHOTO' | 'VIDEO' | 'VOICE' | 'TEXT' | 'SENSOR' | 'TELEMETRY';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: UserRole;
  permissions: string[];
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  roleId: string;
  displayName: string;
  email: string;
  role?: UserRole;
  organizationName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorldConfig {
  center: GeoPoint;
  defaultZoom: number;
  bounds: GeoBounds;
  timeZone: string;
  enableWeather: boolean;
  enableTraffic: boolean;
}

export interface World {
  id: string;
  name: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  config: WorldConfig;
  status: 'ACTIVE' | 'ARCHIVED' | 'SIMULATION';
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: string;
  worldId: string;
  name: string;
  code: string;
  status: 'STABLE' | 'ELEVATED_RISK' | 'CONSTRAINED' | 'CRITICAL';
  operationalScore: number;
  populationEstimate: number;
  incidentCount: number;
  facilityCount: number;
  assetCount: number;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  color: string;
}

export interface SpatialEntity {
  id: string;
  worldId: string;
  entityType: EntityType;
  name: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  parentEntityId?: string | null;
  status: EntityStatus;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  entityId?: string | null;
  assetType: AssetType;
  name: string;
  geometry: GeoPoint;
  state: {
    speedKmh?: number;
    fuelLevelPct?: number;
    assignedIncidentId?: string | null;
    crewCount?: number;
    headingDeg?: number;
    statusText?: string;
    routeBlocked?: boolean;
    destinationName?: string;
  };
  availability: AssetAvailability;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  worldId: string;
  incidentNumber: number;
  title: string;
  incidentType: IncidentType;
  status: IncidentStatus;
  severity: SeverityLevel;
  confidence: number;
  geometry: GeoPoint;
  affectedRadiusMeters: number;
  startedAt: string;
  detectedAt: string;
  resolvedAt?: string | null;
  evidenceCount: number;
  affectedEntityCount: number;
  epistemicStatus: EpistemicStatus;
  summary: string;
  corroborationScore?: number;
  entityMatchConfidence?: number;
  epistemicBreakdown?: {
    observed: string[];
    inferred: string[];
    unknown: string[];
  };
  fusionRationale?: string;
  mergedIntoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  incidentId?: string | null;
  evidenceType: EvidenceType;
  source: string;
  objectUri: string;
  thumbnailUri?: string | null;
  geometry: GeoPoint;
  accuracyMeters: number;
  capturedAt: string;
  receivedAt: string;
  analysis?: {
    detectedEvent: string;
    severityHint: SeverityLevel;
    detectedObjects: string[];
    transcript?: string;
    summary: string;
  } | null;
  confidence: number;
  privacyState: 'PUBLIC' | 'RESTRICTED' | 'REDACTED';
  createdAt: string;
}

export interface IncidentCandidate {
  id: string;
  worldId: string;
  incidentType: IncidentType;
  title: string;
  summary: string;
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';
  severityHint: SeverityLevel;
  confidence: number;
  epistemicStatus: EpistemicStatus;
  geometry?: GeoPoint | null;
  affectedRadiusMeters?: number;
  resolvedEntityId?: string | null;
  entityMatchConfidence?: number;
  entityCandidates?: Array<{ entity_id: string; entity_name: string; entity_type: string; match_confidence: number }>;
  evidenceCount: number;
  evidenceItems?: Array<{ id: string; type: EvidenceType; status: string; confidence?: number; objectUri?: string; analysis?: any }>;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
}

export interface WorldSnapshot {
  world: World;
  districts: District[];
  entities: SpatialEntity[];
  assets: Asset[];
  incidents: Incident[];
  timestamp: string;
  mode: 'LIVE' | 'DEMO' | 'SIMULATION';
}

export type RealtimeEventType =
  | 'ENTITY_UPDATED'
  | 'ASSET_UPDATED'
  | 'INCIDENT_UPDATED'
  | 'DISTRICT_UPDATED'
  | 'TELEMETRY_PULSE';

export interface RealtimeEvent {
  eventId: string;
  type: RealtimeEventType;
  timestamp: string;
  payload: {
    id: string;
    status?: string;
    geometry?: GeoPoint;
    state?: Record<string, any>;
    metrics?: Record<string, any>;
    message?: string;
  };
}

export interface LayerVisibilityState {
  terrain: boolean;
  buildings: boolean;
  roads: boolean;
  districts: boolean;
  hospitals: boolean;
  emergencyStations: boolean;
  utilities: boolean;
  assets: boolean;
  incidents: boolean;
  candidates: boolean;
  riskHeatmap: boolean;
}

export interface AuditEvent {
  id: string;
  actorType: 'USER' | 'SYSTEM' | 'AI_AGENT';
  actorId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface DependencyHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  latencyMs: number;
  details?: string;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  dependencies: {
    database: DependencyHealth;
    redis: DependencyHealth;
    storage: DependencyHealth;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// ---------------------------------------------------------------------------
// Phase 5 Canonical Types
// ---------------------------------------------------------------------------
export type OperationalRole = 'CITIZEN' | 'RESPONDER' | 'AUTHORITY' | 'ADMIN';
export type OperationalMode = 'LIVE' | 'DEMO' | 'SIMULATION' | 'REPLAY';

export interface ImpactItem {
  entityId: string;
  name: string;
  entityType: string;
  impactType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  distanceMeters?: number;
  delayMinutes?: number;
  reason: string;
  metrics?: Record<string, any>;
  recommendedReroute?: string;
}

export interface ImpactGraphNode {
  id: string;
  label: string;
  type: string;
  status?: string;
  severity?: string;
  coordinates?: [number, number];
}

export interface ImpactGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  severity?: string;
  delayMinutes?: number;
  reason?: string;
}

export interface IncidentImpactResponse {
  incidentId: string;
  incidentNumber: number;
  title: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  impactSummary: {
    totalDirectImpacts: number;
    totalAccessImpacts: number;
    totalRouteImpacts: number;
    totalSecondaryImpacts: number;
    districtMetrics: {
      districtName: string;
      districtCode: string;
      populationExposed: number;
      overallAccessibilityIndex: number;
      indexDropPct: number;
      criticalFacilitiesImpeded: number;
      responseUnitsRerouted: number;
    };
  };
  directImpacts: ImpactItem[];
  accessImpacts: ImpactItem[];
  routeImpacts: ImpactItem[];
  secondaryImpacts: ImpactItem[];
  graph: {
    nodes: ImpactGraphNode[];
    edges: ImpactGraphEdge[];
  };
}

export interface AlternativeRoute {
  routeId: string;
  name: string;
  etaMins: number;
  distanceKm: number;
  delayVsBaselineMins: number;
  surfaceCondition: string;
  throughputCapacityPct: number;
  recommended: boolean;
  pathCoordinates?: number[][];
}

export interface SimulationResult {
  scenarioId: string;
  scenarioType: string;
  targetCorridor: string;
  isSimulated: boolean;
  mode: 'SIMULATION';
  timestamp: string;
  summary: string;
  metrics: {
    baselineTransitMins: number;
    unmitigatedTransitMins: number;
    unmitigatedDelayMins: number;
    simulatedRerouteMins: number;
    simulatedDelayMins: number;
    netTimeSavedMins: number;
    districtTrafficIndexDelta: string;
  };
  alternativeRoutes: AlternativeRoute[];
  affectedAssets: Array<{
    assetId: string;
    name: string;
    assignedIncident: string;
    baselineEtaMins: number;
    unmitigatedEtaMins: number;
    simulatedEtaMins: number;
    timeSavedMins: number;
    actionRequired: string;
  }>;
  affectedFacilities: Array<{
    facilityId: string;
    name: string;
    primaryIngress: string;
    alternativeIngress: string;
    ingressStatus: string;
    patientTransferDelayMins: number;
  }>;
  recommendedInterventions: string[];
}

export interface ResponseAction {
  actionId: string;
  actionType: string;
  title: string;
  description: string;
  targetEntityId?: string;
  targetAssetId?: string;
  status: 'PENDING' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'REJECTED';
  priority?: string;
  estimatedDurationMins?: number;
  resourceAssigned?: string;
  requiresApproval?: boolean;
  actor?: string;
  approvedAt?: string;
  executedAt?: string;
  verifiedAt?: string;
}

export interface ResponsePlan {
  planId: string;
  incidentId: string;
  incidentNumber: number;
  incidentTitle: string;
  objective: string;
  priority: SeverityLevel;
  status: string;
  policyEvaluation: {
    complianceStatus: string;
    rulesVerified: string[];
    riskScore: number;
  };
  actions: ResponseAction[];
  createdAt?: string;
}

export interface PublicTrackingReport {
  reportId: string;
  title: string;
  category: string;
  district: string;
  submittedAt: string;
  currentStage: string;
  isResolved: boolean;
  publicSafetyMessage: string;
  stages: Array<{ stage: string; label: string; icon: string }>;
  timeline: Array<{ stage: string; label: string; time: string; status: string; description: string }>;
}

export interface VoiceCommandResult {
  transcript: string;
  intent: string;
  toolCalled: string;
  spokenResponse: string;
  clientAction?: {
    action: string;
    targetId?: string;
    tab?: string;
    entityType?: string;
    message?: string;
  };
  data?: Record<string, any>;
}

export interface DemoTimelineStep {
  stepIndex: number;
  time: string;
  title: string;
  category: string;
  description: string;
  cameraPreset?: string;
  cameraCoords: { lat: number; lng: number; alt: number };
  activeTab?: 'context' | 'why' | 'impact' | 'simulate' | 'plan' | 'timeline';
  roleTarget?: OperationalRole;
  actionSummary: string;
  incidentStatus: string;
}

export type MapDisplayMode = '3D_MAPBOX' | '2D_DARK' | 'SATELLITE' | '3D_CESIUM' | 'HEATMAP';



