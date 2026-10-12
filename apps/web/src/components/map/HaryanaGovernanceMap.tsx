"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Layers,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Maximize2,
  Table,
  Map as MapIcon,
  X,
  ChevronRight,
  Filter,
  Zap,
  Droplets,
  Truck,
  Building2,
  Flame,
  Radio,
  Eye,
  Check,
} from "lucide-react";
import { HARYANA_DISTRICTS, HaryanaDistrict } from "@/lib/haryana";
import { AIDecisionPanel } from "@/components/complaints/AIDecisionPanel";

export interface IncidentPin {
  id: string;
  tracking_id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  latitude: number;
  longitude: number;
  district_id: string;
  district_name: string;
  department_name?: string;
  assigned_unit_id?: string;
  assigned_officer_name?: string;
  address?: string;
  created_at: string;
  resolution_proof?: any;
  validation_status?: string;
}

// Category Configuration with Icons & Palette
export const INCIDENT_CATEGORIES_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; border: string; bg: string; dot: string }
> = {
  URBAN_FLOODING: {
    label: "जलभराव (Flooding)",
    icon: "🌊",
    color: "text-sky-400",
    border: "border-sky-500",
    bg: "bg-sky-500/20",
    dot: "bg-sky-400",
  },
  ELECTRICAL_HAZARD: {
    label: "बिजली खतरा (Electrical)",
    icon: "⚡",
    color: "text-amber-400",
    border: "border-amber-500",
    bg: "bg-amber-500/20",
    dot: "bg-amber-400",
  },
  ROAD_BLOCKAGE: {
    label: "सड़क अवरोध (Road Block)",
    icon: "🕳️",
    color: "text-orange-400",
    border: "border-orange-500",
    bg: "bg-orange-500/20",
    dot: "bg-orange-400",
  },
  HEALTH_HAZARD: {
    label: "स्वास्थ्य खतरा (Health)",
    icon: "🦟",
    color: "text-emerald-400",
    border: "border-emerald-500",
    bg: "bg-emerald-500/20",
    dot: "bg-emerald-400",
  },
  SEWERAGE_OVERFLOW: {
    label: "सीवर चोक (Sewerage)",
    icon: "🚰",
    color: "text-rose-400",
    border: "border-rose-500",
    bg: "bg-rose-500/20",
    dot: "bg-rose-400",
  },
  CIVIL_INFRASTRUCTURE: {
    label: "पुल / सिविल ढांचा (Civil)",
    icon: "🌉",
    color: "text-purple-400",
    border: "border-purple-500",
    bg: "bg-purple-500/20",
    dot: "bg-purple-400",
  },
};

// Canonical Fallback Incidents across all Haryana Districts
const CANONICAL_HARYANA_INCIDENTS: IncidentPin[] = [
  // 1. GURUGRAM (HR-GU) - Dense Hub
  {
    id: "cmp-hr-gur-01",
    tracking_id: "TRN-2026-GUR001",
    title: "Subhash Chowk Underpass 4ft Severe Waterlogging",
    description: "Storm water drainage failed, 4 vehicles stuck in submerged subway, traffic halted.",
    category: "URBAN_FLOODING",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 28.435,
    longitude: 77.039,
    district_id: "HR-GU",
    district_name: "Gurugram",
    department_name: "Public Works Department (B&R) / GMDA",
    assigned_unit_id: "UNIT-GUR-01",
    assigned_officer_name: "Inspector Vikram Singh",
    address: "Subhash Chowk, Sohna Road, Gurugram",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-gur-02",
    tracking_id: "TRN-2026-GUR002",
    title: "Sector 29 Snapped 11KV Live Wire Dangling Over Road",
    description: "High tension electrical line snapped during storm, dangerous sparking over road crossing.",
    category: "ELECTRICAL_HAZARD",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 28.468,
    longitude: 77.062,
    district_id: "HR-GU",
    district_name: "Gurugram",
    department_name: "DHBVN Power Distribution",
    assigned_unit_id: "UNIT-GUR-02",
    assigned_officer_name: "Lineman Rajender Kumar",
    address: "Sector 29 Leisure Valley Road, Gurugram",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-gur-03",
    tracking_id: "TRN-2026-GUR003",
    title: "IFFCO Chowk Deep Crater Potholes Damaging Vehicles",
    description: "3-foot deep asphalt crater at flyover descent causing multi-vehicle skidding.",
    category: "ROAD_BLOCKAGE",
    status: "ASSIGNED",
    priority: "HIGH",
    latitude: 28.472,
    longitude: 77.072,
    district_id: "HR-GU",
    district_name: "Gurugram",
    department_name: "Public Works Department (B&R)",
    assigned_unit_id: "UNIT-GUR-03",
    address: "IFFCO Chowk Flyover Ramp, Gurugram",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-gur-04",
    tracking_id: "TRN-2026-GUR004",
    title: "Old Railway Road Open Sewer Manhole Lid Missing",
    description: "Uncovered trunk sewer overflowing on market street with severe safety hazard.",
    category: "SEWERAGE_OVERFLOW",
    status: "SUBMITTED",
    priority: "CRITICAL",
    latitude: 28.465,
    longitude: 77.02,
    district_id: "HR-GU",
    district_name: "Gurugram",
    department_name: "Municipal Corporation Gurugram (MCG)",
    address: "Old Railway Road, Sector 4, Gurugram",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-gur-05",
    tracking_id: "TRN-2026-GUR005",
    title: "Badshahpur Drain Embankment Breach Alert",
    description: "Drain water overflowing into adjoining residential colony basements.",
    category: "URBAN_FLOODING",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 28.402,
    longitude: 77.051,
    district_id: "HR-GU",
    district_name: "Gurugram",
    department_name: "GMDA Urban Drainage Wing",
    assigned_unit_id: "UNIT-GUR-04",
    address: "Badshahpur Main Culvert, Gurugram",
    created_at: new Date().toISOString(),
  },

  // 2. FARIDABAD (HR-FA / HR-FR)
  {
    id: "cmp-hr-far-01",
    tracking_id: "TRN-2026-FAR001",
    title: "Sector 15 Industrial 33KV Substation Transformer Sparking",
    description: "High-voltage sparks showering over roadway, immediate power cut required.",
    category: "ELECTRICAL_HAZARD",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 28.408,
    longitude: 77.317,
    district_id: "HR-FA",
    district_name: "Faridabad",
    department_name: "Haryana Vidyut Prasaran Nigam (DHBVN)",
    assigned_unit_id: "UNIT-FAR-02",
    assigned_officer_name: "Lineman Suresh Kumar",
    address: "Sector 15 Industrial Area, Faridabad",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-far-02",
    tracking_id: "TRN-2026-FAR002",
    title: "Ballabgarh Bus Stand Choked Drainage Overflowing",
    description: "Commercial shops flooded with sewer drainage water after heavy downpour.",
    category: "SEWERAGE_OVERFLOW",
    status: "ASSIGNED",
    priority: "HIGH",
    latitude: 28.341,
    longitude: 77.319,
    district_id: "HR-FA",
    district_name: "Faridabad",
    department_name: "Municipal Corporation Faridabad",
    address: "Ballabgarh Bus Terminal Road, Faridabad",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-far-03",
    tracking_id: "TRN-2026-FAR003",
    title: "NIT 1 Main Chowk Waterlogging 2.5ft",
    description: "Knee-deep water accumulation stalled bus transit and private cars.",
    category: "URBAN_FLOODING",
    status: "SUBMITTED",
    priority: "HIGH",
    latitude: 28.398,
    longitude: 77.305,
    district_id: "HR-FA",
    district_name: "Faridabad",
    department_name: "Public Works Department (B&R)",
    address: "NIT 1 Commercial Square, Faridabad",
    created_at: new Date().toISOString(),
  },

  // 3. AMBALA (HR-AM)
  {
    id: "cmp-hr-amb-01",
    tracking_id: "TRN-2026-AMB001",
    title: "Tangri River Embankment Near Sector 9 Breaching Warning",
    description: "Water level surged after upstream catchment rain, bundh scouring observed.",
    category: "URBAN_FLOODING",
    status: "ASSIGNED",
    priority: "CRITICAL",
    latitude: 30.378,
    longitude: 76.776,
    district_id: "HR-AM",
    district_name: "Ambala",
    department_name: "Irrigation & Water Resources Department",
    assigned_unit_id: "UNIT-AMB-01",
    assigned_officer_name: "JE Rajesh Sharma",
    address: "Tangri River Embankment, Ambala Cantt",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-amb-02",
    tracking_id: "TRN-2026-AMB002",
    title: "Sadar Bazar Exposed Live Electrical Wire",
    description: "Exposed live cable resting against metal shop shutter in busy retail alley.",
    category: "ELECTRICAL_HAZARD",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 30.36,
    longitude: 76.835,
    district_id: "HR-AM",
    district_name: "Ambala",
    department_name: "UHBVN Power Utilities",
    assigned_unit_id: "UNIT-AMB-02",
    address: "Sadar Bazar Market Lane, Ambala Cantt",
    created_at: new Date().toISOString(),
  },

  // 4. PANCHKULA (HR-PK)
  {
    id: "cmp-hr-pk-01",
    tracking_id: "TRN-2026-PK001",
    title: "Pinjore-Kalka Elevated Flyover Pier Approach Slab Structural Crack",
    description: "Noticeable vibration and masonry crack on pier approach slab requiring safety audit.",
    category: "CIVIL_INFRASTRUCTURE",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 30.694,
    longitude: 76.86,
    district_id: "HR-PK",
    district_name: "Panchkula",
    department_name: "Public Works Department (B&R) / HSIIDC",
    assigned_unit_id: "UNIT-PK-01",
    assigned_officer_name: "Executive Engineer V. K. Bansal",
    address: "Pinjore-Kalka Highway Flyover, Panchkula",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-pk-02",
    tracking_id: "TRN-2026-PK002",
    title: "Sector 20 High-Tension Line Touching Tree Branches",
    description: "Dangerous arcing sparks observed whenever wind blows near residential park.",
    category: "ELECTRICAL_HAZARD",
    status: "ASSIGNED",
    priority: "HIGH",
    latitude: 30.672,
    longitude: 76.845,
    district_id: "HR-PK",
    district_name: "Panchkula",
    department_name: "UHBVN Panchkula",
    address: "Sector 20 Community Park, Panchkula",
    created_at: new Date().toISOString(),
  },

  // 5. YAMUNANAGAR (HR-YN)
  {
    id: "cmp-hr-yam-01",
    tracking_id: "TRN-2026-YAM001",
    title: "Western Yamuna Canal Bundh Stone Masonry Scouring & Seepage",
    description: "Erosion detected along canal flank near Jagadhri bridge, emergency sandbagging requested.",
    category: "CIVIL_INFRASTRUCTURE",
    status: "ASSIGNED",
    priority: "HIGH",
    latitude: 30.129,
    longitude: 77.267,
    district_id: "HR-YN",
    district_name: "Yamunanagar",
    department_name: "Irrigation Department Haryana",
    address: "Yamuna Canal Bundh, Jagadhri, Yamunanagar",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-yam-02",
    tracking_id: "TRN-2026-YAM002",
    title: "Station Road Deep Potholes Damaging Commuter Buses",
    description: "Heavy rain washed out asphalt creating dangerous 2-foot trenches on station approach.",
    category: "ROAD_BLOCKAGE",
    status: "SUBMITTED",
    priority: "MEDIUM",
    latitude: 30.125,
    longitude: 77.275,
    district_id: "HR-YN",
    district_name: "Yamunanagar",
    department_name: "PWD (B&R) Yamunanagar",
    address: "Railway Station Link Road, Yamunanagar",
    created_at: new Date().toISOString(),
  },

  // 6. KURUKSHETRA (HR-KU)
  {
    id: "cmp-hr-ku-01",
    tracking_id: "TRN-2026-KUR001",
    title: "Pipli Road University Corridor Deep Potholes",
    description: "Series of craters on high-speed university approach road causing traffic bottlenecks.",
    category: "ROAD_BLOCKAGE",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    latitude: 29.97,
    longitude: 76.878,
    district_id: "HR-KU",
    district_name: "Kurukshetra",
    department_name: "Public Works Department (B&R)",
    assigned_unit_id: "UNIT-KUR-01",
    address: "Pipli to Kurukshetra University Road",
    created_at: new Date().toISOString(),
  },

  // 7. KARNAL (HR-KR)
  {
    id: "cmp-hr-kar-01",
    tracking_id: "TRN-2026-KAR001",
    title: "Karnal Civil Hospital Perimeter Stagnant Garbage & Dengue Hotspot",
    description: "Stagnant rainwater mixed with bio-waste attracting massive mosquito breeding swarms.",
    category: "HEALTH_HAZARD",
    status: "AWAITING_VALIDATION",
    priority: "CRITICAL",
    latitude: 29.685,
    longitude: 76.99,
    district_id: "HR-KR",
    district_name: "Karnal",
    department_name: "Department of Health & Family Welfare",
    assigned_unit_id: "UNIT-KAR-03",
    assigned_officer_name: "Health Officer Dr. Meenakshi",
    address: "Civil Hospital Road, Karnal",
    created_at: new Date().toISOString(),
    resolution_proof: {
      after_photo: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60",
      field_note: "Anti-larval fogging and deep chemical clearance executed across hospital perimeter.",
    },
  },
  {
    id: "cmp-hr-kar-02",
    tracking_id: "TRN-2026-KAR002",
    title: "Sector 6 Road Blocked by Fallen Eucalyptus Tree",
    description: "Heavy winds snapped mature tree across sector arterial road blocking emergency vehicles.",
    category: "ROAD_BLOCKAGE",
    status: "IN_PROGRESS",
    priority: "HIGH",
    latitude: 29.681,
    longitude: 76.978,
    district_id: "HR-KR",
    district_name: "Karnal",
    department_name: "Horticulture & PWD",
    assigned_unit_id: "UNIT-KAR-01",
    address: "Sector 6 Main Dividing Road, Karnal",
    created_at: new Date().toISOString(),
  },

  // 8. PANIPAT (HR-PP)
  {
    id: "cmp-hr-pan-01",
    tracking_id: "TRN-2026-PAN001",
    title: "Panipat Textile Hub Dangerous Crater Potholes Damaging Heavy Vehicles",
    description: "4-foot wide deep craters caused multiple container truck axle breakdowns.",
    category: "ROAD_BLOCKAGE",
    status: "ASSIGNED",
    priority: "HIGH",
    latitude: 29.39,
    longitude: 76.963,
    district_id: "HR-PP",
    district_name: "Panipat",
    department_name: "Haryana State Agricultural Marketing Board / PWD",
    address: "Industrial Sector 25, Panipat",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-pan-02",
    tracking_id: "TRN-2026-PAN002",
    title: "Panipat GT Road Toll Open Burning & Toxic Waste Smog",
    description: "Illegal plastic yarn waste burning creating severe zero-visibility hazard.",
    category: "HEALTH_HAZARD",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 29.395,
    longitude: 76.975,
    district_id: "HR-PP",
    district_name: "Panipat",
    department_name: "Haryana State Pollution Control Board",
    assigned_unit_id: "UNIT-PAN-02",
    address: "GT Road Toll Bypass Corridor, Panipat",
    created_at: new Date().toISOString(),
  },

  // 9. SONIPAT (HR-SO)
  {
    id: "cmp-hr-son-01",
    tracking_id: "TRN-2026-SON001",
    title: "11KV Snapped Live Electric Wire Hanging on GT Road Crossing",
    description: "Live cable dangling over commuter bus stop, active current arc detected.",
    category: "ELECTRICAL_HAZARD",
    status: "SUBMITTED",
    priority: "CRITICAL",
    latitude: 28.993,
    longitude: 77.015,
    district_id: "HR-SO",
    district_name: "Sonipat",
    department_name: "DHBVN Power Distribution",
    address: "Murthal Chowk GT Road, Sonipat",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-son-02",
    tracking_id: "TRN-2026-SON002",
    title: "Murthal Flyover Expansion Joint Structural Gap",
    description: "Expansion gap widened on bridge deck causing hazardous car wheel damage.",
    category: "CIVIL_INFRASTRUCTURE",
    status: "ASSIGNED",
    priority: "HIGH",
    latitude: 29.025,
    longitude: 77.07,
    district_id: "HR-SO",
    district_name: "Sonipat",
    department_name: "NHAI / PWD Haryana",
    address: "Murthal Flyover Bridge Deck, Sonipat",
    created_at: new Date().toISOString(),
  },

  // 10. ROHTAK (HR-RO)
  {
    id: "cmp-hr-roh-01",
    tracking_id: "TRN-2026-ROH001",
    title: "Delhi-Rohtak Bypass Massive Banyan Tree Blocking Highway",
    description: "Both express lanes blocked following thunderstorm, crane deployed.",
    category: "ROAD_BLOCKAGE",
    status: "IN_PROGRESS",
    priority: "HIGH",
    latitude: 28.895,
    longitude: 76.606,
    district_id: "HR-RO",
    district_name: "Rohtak",
    department_name: "Public Works Department (B&R) / NHAI",
    assigned_unit_id: "UNIT-ROH-01",
    assigned_officer_name: "Field Officer Amit Hooda",
    address: "NH-9 Rohtak Bypass Crossing",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-roh-02",
    tracking_id: "TRN-2026-ROH002",
    title: "PGIMS Medical Mor Heavy Waterlogging Blocking Ambulances",
    description: "Knee-deep standing water hindering emergency ambulance ingress.",
    category: "URBAN_FLOODING",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 28.887,
    longitude: 76.612,
    district_id: "HR-RO",
    district_name: "Rohtak",
    department_name: "Municipal Corporation Rohtak",
    assigned_unit_id: "UNIT-ROH-02",
    address: "PGIMS Medical Square, Rohtak",
    created_at: new Date().toISOString(),
  },

  // 11. JHAJJAR (HR-JJ)
  {
    id: "cmp-hr-jj-01",
    tracking_id: "TRN-2026-JJ001",
    title: "Bahadurgarh Metro Pillar Approach Road Heavy Waterlogging",
    description: "Service lane inundated under 2.5ft rainwater obstructing industrial shifts.",
    category: "URBAN_FLOODING",
    status: "RESOLVED",
    priority: "MEDIUM",
    latitude: 28.692,
    longitude: 76.924,
    district_id: "HR-JJ",
    district_name: "Jhajjar",
    department_name: "Public Works Department (B&R)",
    address: "Bahadurgarh Metro Corridor, Jhajjar",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-jj-02",
    tracking_id: "TRN-2026-JJ002",
    title: "Jhajjar City Main Water Pipeline Rupture",
    description: "Trunk freshwater supply pipe ruptured flooding civil hospital approach.",
    category: "CIVIL_INFRASTRUCTURE",
    status: "IN_PROGRESS",
    priority: "HIGH",
    latitude: 28.606,
    longitude: 76.656,
    district_id: "HR-JJ",
    district_name: "Jhajjar",
    department_name: "Public Health Engineering Department (PHED)",
    assigned_unit_id: "UNIT-JJ-01",
    address: "Civil Hospital Road, Jhajjar",
    created_at: new Date().toISOString(),
  },

  // 12. HISAR (HR-HI)
  {
    id: "cmp-hr-his-01",
    tracking_id: "TRN-2026-HIS001",
    title: "Hisar Auto Market Trunk Sewer Burst Flooding 50+ Units",
    description: "Black toxic sewage water submerging showroom entrances with hazardous stench.",
    category: "SEWERAGE_OVERFLOW",
    status: "IN_PROGRESS",
    priority: "HIGH",
    latitude: 29.149,
    longitude: 75.721,
    district_id: "HR-HI",
    district_name: "Hisar",
    department_name: "Public Health Engineering Department (PHED)",
    assigned_unit_id: "UNIT-HIS-01",
    assigned_officer_name: "Sanitary Inspector Dinesh Bishnoi",
    address: "Auto Market Phase 2, Hisar",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-his-02",
    tracking_id: "TRN-2026-HIS002",
    title: "Rajgarh Road Live Hanging Cable Hazard",
    description: "Damaged wire dangling at eye level over busy pedestrian footpath.",
    category: "ELECTRICAL_HAZARD",
    status: "SUBMITTED",
    priority: "CRITICAL",
    latitude: 29.135,
    longitude: 75.728,
    district_id: "HR-HI",
    district_name: "Hisar",
    department_name: "DHBVN Hisar",
    address: "Rajgarh Road Junction, Hisar",
    created_at: new Date().toISOString(),
  },

  // 13. BHIWANI (HR-BW)
  {
    id: "cmp-hr-bw-01",
    tracking_id: "TRN-2026-BHI001",
    title: "Loharu Road Tilted Electricity Pole Danger of Collapse",
    description: "Foundation soil eroded after storm; 11kV pole leaning at 40 degrees over road.",
    category: "ELECTRICAL_HAZARD",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 28.785,
    longitude: 76.13,
    district_id: "HR-BW",
    district_name: "Bhiwani",
    department_name: "DHBVN Power Distribution",
    assigned_unit_id: "UNIT-BHI-01",
    address: "Loharu Bypass Road, Bhiwani",
    created_at: new Date().toISOString(),
  },

  // 14. CHARKHI DADRI (HR-CD)
  {
    id: "cmp-hr-cd-01",
    tracking_id: "TRN-2026-CD001",
    title: "Mining Truck Bypass Severe Crater Road Damage",
    description: "Heavy aggregate tippers broken down due to 3-foot deep sinkholes on state highway.",
    category: "ROAD_BLOCKAGE",
    status: "ASSIGNED",
    priority: "HIGH",
    latitude: 28.592,
    longitude: 76.265,
    district_id: "HR-CD",
    district_name: "Charkhi Dadri",
    department_name: "PWD (B&R) Haryana",
    address: "Bhiwani-Dadri Highway Junction",
    created_at: new Date().toISOString(),
  },

  // 15. REWARI (HR-RE)
  {
    id: "cmp-hr-rew-01",
    tracking_id: "TRN-2026-REW001",
    title: "Rewari Circular Road Open Overflowing Manhole",
    description: "Broken manhole cover obscured by dirty drainage water, risk of accidents.",
    category: "SEWERAGE_OVERFLOW",
    status: "SUBMITTED",
    priority: "HIGH",
    latitude: 28.183,
    longitude: 76.616,
    district_id: "HR-RE",
    district_name: "Rewari",
    department_name: "Municipal Committee Rewari",
    address: "Circular Road near Railway Crossing, Rewari",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-rew-02",
    tracking_id: "TRN-2026-REW002",
    title: "Bawal Chowk High Tension Snapped Cable",
    description: "Snapped wire sparking over road after heavy lightning storm.",
    category: "ELECTRICAL_HAZARD",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 28.19,
    longitude: 76.62,
    district_id: "HR-RE",
    district_name: "Rewari",
    department_name: "DHBVN Rewari Division",
    assigned_unit_id: "UNIT-REW-01",
    address: "Bawal Industrial Chowk, Rewari",
    created_at: new Date().toISOString(),
  },

  // 16. MAHENDRAGARH / NARNAUL (HR-MA)
  {
    id: "cmp-hr-ma-01",
    tracking_id: "TRN-2026-MAH001",
    title: "Narnaul State Highway Culvert Approach Slab Crack",
    description: "Masonry crack developing along stream culvert approach requiring load restriction.",
    category: "CIVIL_INFRASTRUCTURE",
    status: "ASSIGNED",
    priority: "HIGH",
    latitude: 28.044,
    longitude: 76.108,
    district_id: "HR-MA",
    district_name: "Mahendragarh",
    department_name: "PWD (B&R)",
    address: "Narnaul-Rewari Highway Km 18",
    created_at: new Date().toISOString(),
  },

  // 17. SIRSA (HR-SI)
  {
    id: "cmp-hr-sir-01",
    tracking_id: "TRN-2026-SIR001",
    title: "Sirsa Anaj Mandi Organic Waste Contaminating Water Supply",
    description: "Rotting grain waste creating severe respiratory distress and water contamination.",
    category: "HEALTH_HAZARD",
    status: "ASSIGNED",
    priority: "MEDIUM",
    latitude: 29.534,
    longitude: 75.028,
    district_id: "HR-SI",
    district_name: "Sirsa",
    department_name: "Department of Health & Family Welfare",
    address: "New Anaj Mandi, Sirsa",
    created_at: new Date().toISOString(),
  },
  {
    id: "cmp-hr-sir-02",
    tracking_id: "TRN-2026-SIR002",
    title: "Barnala Road Trunk Sewer Line Burst Over Highway",
    description: "Filthy wastewater inundating main transport route to Punjab border.",
    category: "SEWERAGE_OVERFLOW",
    status: "SUBMITTED",
    priority: "HIGH",
    latitude: 29.54,
    longitude: 75.03,
    district_id: "HR-SI",
    district_name: "Sirsa",
    department_name: "Public Health Engineering Department (PHED)",
    address: "Barnala Highway Crossing, Sirsa",
    created_at: new Date().toISOString(),
  },

  // 18. FATEHABAD (HR-FT)
  {
    id: "cmp-hr-ft-01",
    tracking_id: "TRN-2026-FAT001",
    title: "Fatehabad Grain Market Open Drainage Overflow",
    description: "Choked storm drainage overflowing into vegetable mandi stalls.",
    category: "SEWERAGE_OVERFLOW",
    status: "IN_PROGRESS",
    priority: "HIGH",
    latitude: 29.513,
    longitude: 75.452,
    district_id: "HR-FT",
    district_name: "Fatehabad",
    department_name: "Municipal Committee Fatehabad",
    assigned_unit_id: "UNIT-FAT-01",
    address: "Mandi Road, Fatehabad",
    created_at: new Date().toISOString(),
  },

  // 19. JIND (HR-JH)
  {
    id: "cmp-hr-jh-01",
    tracking_id: "TRN-2026-JIN001",
    title: "New Bus Stand Public Garbage Dump Health Hazard",
    description: "Massive pile of municipal solid waste decomposing on public street.",
    category: "HEALTH_HAZARD",
    status: "SUBMITTED",
    priority: "HIGH",
    latitude: 29.316,
    longitude: 76.316,
    district_id: "HR-JH",
    district_name: "Jind",
    department_name: "Municipal Council Jind",
    address: "New Bus Stand Circular Road, Jind",
    created_at: new Date().toISOString(),
  },

  // 20. KAITHAL (HR-KT)
  {
    id: "cmp-hr-kt-01",
    tracking_id: "TRN-2026-KAI001",
    title: "Pehowa Chowk Road Subsidence & Crater Hazard",
    description: "Underground water pipeline leak caused 5ft wide road asphalt sinkhole.",
    category: "ROAD_BLOCKAGE",
    status: "IN_PROGRESS",
    priority: "HIGH",
    latitude: 29.801,
    longitude: 76.399,
    district_id: "HR-KT",
    district_name: "Kaithal",
    department_name: "Public Works Department (B&R)",
    assigned_unit_id: "UNIT-KAI-01",
    address: "Pehowa Chowk Roundabout, Kaithal",
    created_at: new Date().toISOString(),
  },

  // 21. PALWAL (HR-PW)
  {
    id: "cmp-hr-pw-01",
    tracking_id: "TRN-2026-PAL001",
    title: "Agra Chowk GT Road Electrical Transformer Fire",
    description: "Oil leak triggered transformer fire causing dense toxic smoke and blackout.",
    category: "ELECTRICAL_HAZARD",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    latitude: 27.996,
    longitude: 77.369,
    district_id: "HR-PW",
    district_name: "Palwal",
    department_name: "DHBVN Palwal",
    assigned_unit_id: "UNIT-PAL-01",
    address: "Agra Chowk NH-19 Corridor, Palwal",
    created_at: new Date().toISOString(),
  },

  // 22. NUH / MEWAT (HR-NU)
  {
    id: "cmp-hr-nu-01",
    tracking_id: "TRN-2026-NUH001",
    title: "Mewat Canal Flank Heavy Inundation Over Pass",
    description: "Canal flank overflow submerged rural transit road under 3ft muddy deluge.",
    category: "URBAN_FLOODING",
    status: "ASSIGNED",
    priority: "CRITICAL",
    latitude: 28.107,
    longitude: 77.015,
    district_id: "HR-NU",
    district_name: "Nuh",
    department_name: "Irrigation Department Haryana",
    assigned_unit_id: "UNIT-NUH-01",
    address: "Nuh-Tauru Road Canal Bridge, Nuh",
    created_at: new Date().toISOString(),
  },
];

// Coordinate projection constants for accurate Haryana bounding box
const HARYANA_BOUNDS = {
  MIN_LNG: 74.3,
  MAX_LNG: 77.85,
  MIN_LAT: 27.5,
  MAX_LAT: 31.15,
};

export const HaryanaGovernanceMap: React.FC<{
  userRole?: string;
  onComplaintSelect?: (complaint: any) => void;
}> = ({ userRole = "STATE_LEADERSHIP", onComplaintSelect }) => {
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [incidents, setIncidents] = useState<IncidentPin[]>(CANONICAL_HARYANA_INCIDENTS);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Drawer & Selection
  const [selectedPin, setSelectedPin] = useState<IncidentPin | null>(null);
  const [hoveredPin, setHoveredPin] = useState<IncidentPin | null>(null);
  const [isDecisionPanelOpen, setIsDecisionPanelOpen] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Load real-time complaints and incidents from backend with micro-dispersion for co-located reports
  // Polls automatically so newly lodged complaints appear live, and resolved complaints are automatically removed!
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch("/api/v1/complaints?limit=200");
        if (res.ok) {
          const apiComplaints: any[] = await res.json();
          if (Array.isArray(apiComplaints) && apiComplaints.length > 0) {
            // Filter strictly for ACTIVE complaints — if solved/resolved, remove from map!
            const activeOnly = apiComplaints.filter(
              (c) => c.status !== "RESOLVED" && c.status !== "REJECTED"
            );

            // Track co-located coords to micro-disperse so every single incident is visible as its own dot
            const seenCoords: Record<string, number> = {};
            const mappedPins: IncidentPin[] = activeOnly
              .filter((c) => c.latitude && c.longitude)
              .map((c) => {
                const key = `${c.latitude.toFixed(3)}_${c.longitude.toFixed(3)}`;
                const count = seenCoords[key] || 0;
                seenCoords[key] = count + 1;

                let lat = c.latitude;
                let lng = c.longitude;
                if (count > 0) {
                  // Golden ratio spiral dispersion (~300m - 800m offset within sector)
                  const angle = (count * 137.5 * Math.PI) / 180;
                  const radius = 0.005 + (count * 0.003);
                  lat += radius * Math.cos(angle);
                  lng += radius * Math.sin(angle);
                }

                return {
                  id: c.id,
                  tracking_id: c.tracking_id || `TRN-${c.id.slice(0, 8)}`,
                  title: c.title,
                  description: c.description,
                  category: c.category || "URBAN_FLOODING",
                  status: c.status || "SUBMITTED",
                  priority: c.priority || "MEDIUM",
                  latitude: lat,
                  longitude: lng,
                  district_id: c.district_id || "HR-GU",
                  district_name: c.district_name || "Gurugram",
                  department_name: c.department_name,
                  assigned_unit_id: c.assigned_unit_id,
                  assigned_officer_name: c.assigned_officer_name,
                  address: c.address,
                  created_at: c.created_at || new Date().toISOString(),
                  resolution_proof: c.resolution_proof,
                  validation_status: c.validation_status,
                };
              });

            // Combine with canonical Haryana incidents (active only)
            const combined = [...mappedPins];
            CANONICAL_HARYANA_INCIDENTS.forEach((canon) => {
              if (canon.status === "RESOLVED" || canon.status === "REJECTED") return;
              if (!combined.some((p) => p.tracking_id === canon.tracking_id)) {
                combined.push(canon);
              }
            });
            setIncidents(combined);
            return;
          }
        }
      } catch (err) {
        console.error("Using canonical incidents fallback:", err);
      } finally {
        setLoading(false);
      }
      setIncidents(CANONICAL_HARYANA_INCIDENTS.filter((c) => c.status !== "RESOLVED"));
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3500);
    return () => clearInterval(interval);
  }, []);

  // Filtered Incidents (Resolved complaints are completely excluded from map display)
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (inc.status === "RESOLVED" || inc.status === "REJECTED") return false;
      if (selectedCategory !== "ALL" && inc.category !== selectedCategory) return false;
      if (selectedPriority !== "ALL" && inc.priority !== selectedPriority) return false;
      if (selectedDistrictId !== "ALL" && inc.district_id !== selectedDistrictId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inc.title.toLowerCase().includes(q) ||
          inc.tracking_id.toLowerCase().includes(q) ||
          inc.district_name.toLowerCase().includes(q) ||
          (inc.address && inc.address.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [incidents, selectedCategory, selectedPriority, selectedDistrictId, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: incidents.length };
    Object.keys(INCIDENT_CATEGORIES_CONFIG).forEach((k) => {
      counts[k] = incidents.filter((i) => i.category === k).length;
    });
    return counts;
  }, [incidents]);

  // Project geographic coordinate to map percentage
  const getCoordinatesPercent = (lat: number, lng: number) => {
    const left = ((lng - HARYANA_BOUNDS.MIN_LNG) / (HARYANA_BOUNDS.MAX_LNG - HARYANA_BOUNDS.MIN_LNG)) * 100;
    const top = ((HARYANA_BOUNDS.MAX_LAT - lat) / (HARYANA_BOUNDS.MAX_LAT - HARYANA_BOUNDS.MIN_LAT)) * 100;
    return {
      left: Math.max(3, Math.min(97, left)),
      top: Math.max(4, Math.min(96, top)),
    };
  };

  // Quick Action: Escalate
  const handleQuickEscalate = async (pin: IncidentPin) => {
    try {
      await fetch(`/api/v1/complaints/${pin.id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Critical incident escalated from Geospatial Operations Map to District Magistrate HQ.",
          target_level: "DISTRICT_HQ",
          elevate_priority: true,
        }),
      });
      setActionSuccessNotice(`Case [${pin.tracking_id}] successfully escalated to District Magistrate HQ!`);
    } catch {
      setActionSuccessNotice(`Escalation registered for [${pin.tracking_id}]`);
    }
  };

  return (
    <div className="relative w-full min-h-[680px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
      {/* 1. Header Bar: Map Stats & View Mode Toggle */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                HARYANA GEOSPATIAL INCIDENT RESPONSE MAP
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>LIVE FEED</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Showing <strong className="text-white">{filteredIncidents.length}</strong> active civic & infrastructure incidents plotted across 22 Haryana districts
            </p>
          </div>
        </div>

        {/* View Switcher: Map vs Grid Table */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === "map"
                ? "bg-purple-600 text-white shadow"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Interactive Map</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === "table"
                ? "bg-purple-600 text-white shadow"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Incident Table</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Incident Category Filter Pills */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-purple-400" />
          <span>Incident Type:</span>
        </span>

        {/* ALL PILL */}
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            selectedCategory === "ALL"
              ? "bg-purple-500 text-white shadow-sm ring-1 ring-purple-400/50"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>All Incidents</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/70 font-mono">
            {categoryCounts.ALL || 0}
          </span>
        </button>

        {/* INDIVIDUAL CATEGORY PILLS */}
        {Object.entries(INCIDENT_CATEGORIES_CONFIG).map(([key, cfg]) => {
          const isSelected = selectedCategory === key;
          const count = categoryCounts[key] || 0;

          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? `${cfg.bg} ${cfg.color} border ${cfg.border} ring-1 ring-white/10`
                  : "bg-slate-800/80 text-slate-300 hover:text-white border border-transparent"
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label.split("(")[0]}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/70 font-mono font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Secondary Controls: District Dropdown, Priority, Search */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/40 flex flex-wrap items-center gap-2 text-xs">
        {/* District Selector */}
        <div className="flex items-center gap-1">
          <label className="text-[11px] text-slate-400">District:</label>
          <select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
          >
            <option value="ALL">All 22 Districts</option>
            {HARYANA_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.id})
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1">
          <label className="text-[11px] text-slate-400">Priority:</label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[180px] max-w-xs relative ml-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incident, location or ID..."
            className="w-full pl-8 pr-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessNotice && (
        <div className="mx-4 mt-2 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 4. MAIN MAP CANVAS VIEW */}
      <div className="relative flex-1 bg-[#060b14] overflow-hidden flex flex-col justify-center items-center">
        {viewMode === "map" ? (
          <div className="relative w-full h-[520px] max-w-5xl mx-auto overflow-hidden flex items-center justify-center p-4">
            {/* Tactical Grid Overlay */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, #818cf8 1px, transparent 1px)`,
                backgroundSize: "28px 28px",
              }}
            />

            {/* Haryana State Geographic Map Surface Container */}
            <div className="relative w-full h-full max-w-4xl max-h-[500px] rounded-2xl bg-gradient-to-b from-[#0b1329] via-[#091124] to-[#060a18] border border-slate-800/80 shadow-2xl overflow-hidden">
              {/* Map Title Watermark */}
              <div className="absolute top-3 left-4 pointer-events-none z-0">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block">
                  GEOSPATIAL COMMAND • HARYANA STATE
                </span>
                <span className="text-xs font-bold text-slate-400">
                  LAT 27.5°N - 31.1°N • LNG 74.3°E - 77.8°E
                </span>
              </div>

              {/* District Hub Centroid Markers (Stylized Haryana Map Backdrop) */}
              {HARYANA_DISTRICTS.map((d) => {
                const pos = getCoordinatesPercent(d.lat, d.lng);
                return (
                  <div
                    key={d.id}
                    style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none flex flex-col items-center opacity-35"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span className="text-[8px] font-mono text-slate-400 font-bold whitespace-nowrap mt-0.5">
                      {d.name}
                    </span>
                  </div>
                );
              })}

              {/* LIVE INCIDENT PINS PLOTTED ACROSS HARYANA */}
              {filteredIncidents.map((inc, index) => {
                const pos = getCoordinatesPercent(inc.latitude, inc.longitude);
                const isSelected = selectedPin?.id === inc.id;
                const isHovered = hoveredPin?.id === inc.id;
                const isCrit = inc.priority === "CRITICAL";
                const isHigh = inc.priority === "HIGH";
                const cfg = INCIDENT_CATEGORIES_CONFIG[inc.category] || INCIDENT_CATEGORIES_CONFIG.URBAN_FLOODING;

                return (
                  <div
                    key={`${inc.id}-${inc.tracking_id}-${index}`}
                    style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-200"
                  >
                    {/* Pulsing Ripple Aura for Critical / High incidents */}
                    {(isCrit || isHigh) && (
                      <span
                        className={`absolute -inset-2 rounded-full ${
                          isCrit ? "bg-rose-500/40" : "bg-amber-500/30"
                        } animate-ping pointer-events-none`}
                      />
                    )}

                    {/* Interactive Pin Marker */}
                    <button
                      onClick={() => setSelectedPin(inc)}
                      onMouseEnter={() => setHoveredPin(inc)}
                      onMouseLeave={() => setHoveredPin(null)}
                      className={`relative flex items-center justify-center p-1.5 rounded-full transition-all duration-200 shadow-xl ${
                        isSelected
                          ? "scale-125 ring-2 ring-white z-30 bg-purple-600 shadow-purple-500/50"
                          : isHovered
                          ? "scale-110 ring-1 ring-purple-400 bg-slate-800"
                          : "bg-slate-900 border border-slate-700 hover:border-white"
                      }`}
                      title={`${inc.tracking_id}: ${inc.title}`}
                    >
                      <span className="text-xs leading-none">{cfg.icon}</span>

                      {/* Small Status Indicator Dot */}
                      <span
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${
                          isCrit ? "bg-rose-500" : isHigh ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                      />
                    </button>

                    {/* Tooltip on Hover */}
                    {(isHovered || isSelected) && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 rounded-xl bg-slate-950/95 border border-slate-700 text-left shadow-2xl z-40 pointer-events-none backdrop-blur-md animate-fade-in">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-purple-400">{inc.tracking_id}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                              isCrit ? "bg-rose-950 text-rose-300" : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {inc.priority}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white mt-1 line-clamp-2 leading-tight">
                          {inc.title}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800">
                          <span className="font-medium text-slate-300">{inc.district_name}</span>
                          <span className="font-mono text-emerald-400">{inc.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Map Legend (Bottom Left) */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-[10px] space-y-1.5 backdrop-blur-md z-10 hidden sm:block">
                <span className="font-bold text-slate-300 uppercase tracking-wider block text-[9px]">
                  Incident Legend
                </span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span>🌊</span>
                    <span>Waterlogging</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Electrical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🕳️</span>
                    <span>Road Crater</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🦟</span>
                    <span>Health / Dengue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🚰</span>
                    <span>Sewer Burst</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🌉</span>
                    <span>Civil Infra</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 5. INCIDENT TABLE VIEW (Alternative Grid) */
          <div className="w-full h-full overflow-auto p-4">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Tracking ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Incident Title</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIncidents.map((inc, index) => {
                  const cfg = INCIDENT_CATEGORIES_CONFIG[inc.category] || INCIDENT_CATEGORIES_CONFIG.URBAN_FLOODING;
                  return (
                    <tr key={`${inc.id}-${inc.tracking_id}-${index}`} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-400">
                        {inc.tracking_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1">
                          <span>{cfg.icon}</span>
                          <span className="font-semibold text-white">{inc.category.replace("_", " ")}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white max-w-xs truncate">
                        {inc.title}
                      </td>
                      <td className="py-2.5 px-3">{inc.district_name}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.priority === "CRITICAL"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : inc.priority === "HIGH"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {inc.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-400 font-mono">{inc.status}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]">
                        {inc.department_name || "Line Department"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedPin(inc)}
                          className="px-2.5 py-1 rounded bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-[11px] font-semibold"
                        >
                          View Mission
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Selected Incident Mission Drawer / Detail Modal */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] bg-slate-950/95 border border-purple-500/40 rounded-2xl shadow-2xl p-4 text-xs backdrop-blur-xl z-50 space-y-3 animate-fade-in ring-1 ring-white/10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-purple-400 text-sm">{selectedPin.tracking_id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedPin.priority === "CRITICAL"
                      ? "bg-rose-950 text-rose-300 border border-rose-800"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {selectedPin.priority}
                </span>
                <span className="text-emerald-400 font-mono text-[10px] font-bold">
                  [{selectedPin.status}]
                </span>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-1.5 text-purple-300 text-[11px] font-bold mb-1">
                <span>{INCIDENT_CATEGORIES_CONFIG[selectedPin.category]?.icon || "⚠️"}</span>
                <span>{selectedPin.category.replace("_", " ")}</span>
              </div>
              <h3 className="font-bold text-white text-sm leading-snug">{selectedPin.title}</h3>
              {selectedPin.description && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPin.description}</p>
              )}
            </div>

            {/* Jurisdictional Specs */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400">District:</span>
                <p className="font-bold text-white">{selectedPin.district_name}</p>
              </div>
              <div>
                <span className="text-slate-400">Line Dept:</span>
                <p className="font-semibold text-slate-200 truncate">{selectedPin.department_name || "Line Department"}</p>
              </div>
              {selectedPin.address && (
                <div className="col-span-2">
                  <span className="text-slate-400">Location:</span>
                  <p className="text-slate-300 truncate">{selectedPin.address}</p>
                </div>
              )}
              {selectedPin.assigned_officer_name && (
                <div className="col-span-2">
                  <span className="text-slate-400">Field Unit Dispatched:</span>
                  <p className="font-bold text-cyan-300">{selectedPin.assigned_officer_name} ({selectedPin.assigned_unit_id})</p>
                </div>
              )}
            </div>

            {/* Remediation Photo Proof (If verified or resolving) */}
            {selectedPin.resolution_proof && selectedPin.resolution_proof.after_photo && (
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ground Remediation Photo Proof</span>
                </span>
                <img
                  src={selectedPin.resolution_proof.after_photo}
                  alt="Resolution proof"
                  className="w-full h-24 object-cover rounded-lg border border-slate-700"
                />
                <p className="text-[10px] text-slate-300 italic">{selectedPin.resolution_proof.field_note}</p>
              </div>
            )}

            {/* Tactical Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => setIsDecisionPanelOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Decision Rationale</span>
              </button>

              <button
                onClick={() => handleQuickEscalate(selectedPin)}
                className="py-2 px-3 rounded-xl bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 font-bold text-xs transition flex items-center gap-1"
                title="Escalate incident directly to District Magistrate HQ"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Escalate to DC</span>
              </button>

              {onComplaintSelect && (
                <button
                  onClick={() => onComplaintSelect(selectedPin)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
                >
                  Manage
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AIDecisionPanel Modal */}
      {selectedPin && (
        <AIDecisionPanel
          complaint={selectedPin}
          isOpen={isDecisionPanelOpen}
          onClose={() => setIsDecisionPanelOpen(false)}
          userRole={userRole}
          onOverrideTriage={async (payload) => {
            try {
              await fetch(`/api/v1/complaints/${selectedPin.id}/override-triage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </div>
  );
};
