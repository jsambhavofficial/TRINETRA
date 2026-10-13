"use client";

import React, { useEffect, useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Users,
  ChevronRight,
  Filter,
  ArrowRight,
  CheckSquare,
  RefreshCw,
  UserCheck,
  XCircle,
  Eye,
  Building2,
  Sparkles,
  Layers,
  Network,
  ChevronDown,
  ChevronUp,
  Zap,
  Link2,
  Search,
  Bell,
  Mic,
  Home,
  MapPin,
  Calendar,
  ExternalLink,
  Droplets,
  Flame,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Plus,
  Minus,
  Crosshair,
  TrendingUp,
  TrendingDown,
  FileText,
  X,
} from "lucide-react";
import { AuthorityRoleSwitcher } from "@/components/command-center/AuthorityRoleSwitcher";

const HARYANA_DEPARTMENTS_LIST = [
  { id: "ALL", name: "All Departments (सभी विभाग — Consolidated View)" },
  { id: "DEPT-PWD", name: "Public Works Department (B&R)" },
  { id: "DEPT-POWER", name: "Haryana Power Utilities (HVPNL / DHBVN / UHBVN)" },
  { id: "DEPT-HEALTH", name: "Department of Health & Family Welfare" },
  { id: "DEPT-DISASTER", name: "Revenue & Disaster Management" },
  { id: "DEPT-POLICE", name: "Haryana Police & Traffic Enforcement" },
  { id: "DEPT-MUNICIPAL", name: "Urban Local Bodies (ULB) & Municipal Corp" },
];

function formatHindiDate(isoStr?: string) {
  if (!isoStr) return "हाल ही में";
  try {
    const d = new Date(isoStr);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day} ${month} ${year}, ${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  } catch (e) {
    return isoStr;
  }
}

function getCategoryMeta(cat: string, title?: string, userPhotos?: string[]) {
  // 1. If complaint has genuine photo uploaded, prioritize it (skip if monitor placeholder)
  if (userPhotos && userPhotos.length > 0 && userPhotos[0] && !userPhotos[0].includes("1581094794329")) {
    return {
      label: cat ? cat.replace(/_/g, " ") : "Civil Grievance",
      icon: "📸",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      thumb: userPhotos[0],
    };
  }

  const text = `${cat || ""} ${title || ""}`.toLowerCase();

  // 2. Water Supply / Pipeline / Drinking Water ("pani nahi aa raha", "pipeline", "tap", "nal", "water supply")
  if (
    text.includes("pani nahi") ||
    text.includes("drinking water") ||
    text.includes("peeyjal") ||
    text.includes("water supply") ||
    text.includes("pipeline") ||
    text.includes("pipe") ||
    text.includes("tap") ||
    text.includes("tanki") ||
    text.includes("water") ||
    text.includes("जल")
  ) {
    return {
      label: "Water Supply & Pipeline",
      icon: "🚰",
      badge: "bg-sky-50 text-sky-700 border-sky-200",
      thumb: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600",
    };
  }

  // 3. Flooding / Waterlogging / Drainage ("jalbharav", "waterlog", "drain", "flood", "barsat")
  if (
    cat === "URBAN_FLOODING" ||
    text.includes("flood") ||
    text.includes("waterlog") ||
    text.includes("jalbharav") ||
    text.includes("drainage") ||
    text.includes("pani bhar") ||
    text.includes("जलभराव")
  ) {
    return {
      label: "Waterlogging / Drainage",
      icon: "💧",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      thumb: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600",
    };
  }

  // 4. Sewerage Overflow / Sanitation / Dirty Water ("sewer", "naali", "ganda pani", "gutter")
  if (
    cat === "SEWERAGE_OVERFLOW" ||
    text.includes("sewer") ||
    text.includes("naali") ||
    text.includes("ganda") ||
    text.includes("gutter") ||
    text.includes("नाला")
  ) {
    return {
      label: "Sewer Overflow / Drainage",
      icon: "🚽",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      thumb: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600",
    };
  }

  // 5. Road Damage / Potholes / Asphalt ("road", "sadak", "pothole", "gaddha", "asphalt", "highway")
  if (
    cat === "ROAD_BLOCKAGE" ||
    text.includes("road") ||
    text.includes("sadak") ||
    text.includes("pothole") ||
    text.includes("gaddha") ||
    text.includes("asphalt") ||
    text.includes("blockage") ||
    text.includes("सड़क") ||
    text.includes("गड्ढा")
  ) {
    return {
      label: "Road Damage / Pothole",
      icon: "🛣️",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      thumb: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600",
    };
  }

  // 6. Electrical Hazard / Live Wire / Transformer / Power Outage ("electric", "bijli", "wire", "taar", "transformer", "khamba")
  if (
    cat === "ELECTRICAL_HAZARD" ||
    cat === "POWER_OUTAGE" ||
    text.includes("electric") ||
    text.includes("bijli") ||
    text.includes("wire") ||
    text.includes("taar") ||
    text.includes("transformer") ||
    text.includes("khamba") ||
    text.includes("power") ||
    text.includes("बिजली")
  ) {
    return {
      label: "Live Wire / Power Hazard",
      icon: "⚡",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      thumb: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600",
    };
  }

  // 7. Solid Waste / Garbage / Cleanliness ("garbage", "kooda", "kachra", "waste", "safai")
  if (
    cat === "SOLID_WASTE" ||
    text.includes("garbage") ||
    text.includes("kooda") ||
    text.includes("kachra") ||
    text.includes("waste") ||
    text.includes("safai") ||
    text.includes("कूड़ा") ||
    text.includes("सफाई")
  ) {
    return {
      label: "Solid Waste / Sanitation",
      icon: "🗑️",
      badge: "bg-stone-50 text-stone-700 border-stone-200",
      thumb: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600",
    };
  }

  // 8. Public Health / Hospital / Medical
  if (
    cat === "HEALTH_HAZARD" ||
    text.includes("health") ||
    text.includes("hospital") ||
    text.includes("swasthya") ||
    text.includes("medical") ||
    text.includes("अस्पताल")
  ) {
    return {
      label: "Public Health / Medical",
      icon: "🏥",
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      thumb: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600",
    };
  }

  // 9. Civil Infrastructure / Bridge / Building / Construction
  if (
    cat === "CIVIL_INFRASTRUCTURE" ||
    text.includes("infra") ||
    text.includes("bridge") ||
    text.includes("pul") ||
    text.includes("footpath") ||
    text.includes("building")
  ) {
    return {
      label: "Civil Infrastructure",
      icon: "🏗️",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
      thumb: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600",
    };
  }

  // Fallback: Real civic public works construction / road maintenance site (NOT a computer monitor!)
  return {
    label: (cat || "Civic Hazard").replace(/_/g, " "),
    icon: "⚠️",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    thumb: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600",
  };
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return { label: "Critical", bg: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-600" };
    case "HIGH":
      return { label: "High", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    case "MEDIUM":
      return { label: "Medium", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    default:
      return { label: "Low", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "RESOLVED":
      return { label: "Resolved", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
    case "AWAITING_VALIDATION":
      return { label: "Awaiting Signoff", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    case "IN_PROGRESS":
    case "ASSIGNED":
      return { label: "In Field", bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
    case "SUBMITTED":
    default:
      return { label: "Incoming", bg: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" };
  }
}

function DepartmentPortalContent() {
  const searchParams = useSearchParams();
  const urlDept = searchParams?.get("department_id");
  const urlTrackingId = searchParams?.get("tracking_id");

  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>(urlDept || "DEPT-PWD");
  const [highlightTrackingId, setHighlightTrackingId] = useState<string | null>(urlTrackingId || null);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"LATEST" | "PRIORITY">("LATEST");

  // AI Deduplication & Clustering Mode
  const [viewMode, setViewMode] = useState<"AI_CLUSTERED" | "INDIVIDUAL">("AI_CLUSTERED");
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});

  // Assign Modal (Individual or Cluster)
  const [assigningComplaint, setAssigningComplaint] = useState<any>(null);
  const [assigningCluster, setAssigningCluster] = useState<any>(null);
  const [assignUnitId, setAssignUnitId] = useState("UNIT-AMB-01");
  const [assignOfficerName, setAssignOfficerName] = useState("Inspector Sandeep Rao");

  // Rework Modal
  const [reworkComplaint, setReworkComplaint] = useState<any>(null);
  const [reworkReason, setReworkReason] = useState("");

  // Escalation Modal
  const [escalatingTarget, setEscalatingTarget] = useState<any>(null);
  const [escalateReason, setEscalateReason] = useState("");

  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [assignedTaskInfo, setAssignedTaskInfo] = useState<{ trackingId: string; unitId: string } | null>(null);

  // Dynamic Map Spotlight State
  const [selectedMapCase, setSelectedMapCase] = useState<any>(null);
  const [mapZoom, setMapZoom] = useState(1);

  const handleFocusOnMap = (item: any) => {
    setSelectedMapCase(item);
    const el = document.getElementById("cases-map-widget");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trinetra_user");
      const storedToken = localStorage.getItem("trinetra_token") || localStorage.getItem("token");
      if (stored) {
        const u = JSON.parse(stored);
        setAuthUser(u);
        if (u.role === "DEPARTMENT" && u.department_id && !urlDept) {
          setSelectedDept(u.department_id);
        }
      }
      if (storedToken) setToken(storedToken);
    } catch (e) {
      // ignore
    }
  }, [urlDept]);

  useEffect(() => {
    if (urlTrackingId) {
      setHighlightTrackingId(urlTrackingId);
      setFilterTab("ALL");
    }
  }, [urlTrackingId]);

  useEffect(() => {
    if (highlightTrackingId && complaints.length > 0) {
      const match = complaints.find((c) => c.tracking_id === highlightTrackingId);
      if (match) {
        const clusterBaseId = match.incident_id || `INC-${match.district_id}-${match.category.replace('_', '').slice(0, 4)}`;
        setExpandedClusters((prev) => ({ ...prev, [clusterBaseId]: true }));
      }
    }
  }, [highlightTrackingId, complaints]);

  const loadData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const deptQuery = selectedDept === "ALL" ? "?department_id=ALL" : `?department_id=${selectedDept}`;
      const sumDept = selectedDept === "ALL" ? "DEPT-PWD" : selectedDept;

      const [sumRes, compRes] = await Promise.all([
        fetch(`/api/v1/governance/department-summary?department_id=${sumDept}`, { headers }).catch(() => null),
        fetch(`/api/v1/complaints${deptQuery}`, { headers }).catch(() => null),
      ]);

      if (sumRes && sumRes.ok) {
        setSummaryData(await sumRes.json());
      }
      if (compRes && compRes.ok) {
        const data = await compRes.json();
        setComplaints(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedDept, token]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint) return;
    setSubmittingAction(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/complaints/${assigningComplaint.id}/assign`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          assigned_unit_id: assignUnitId,
          assigned_officer_name: assignOfficerName,
          priority: assigningComplaint.priority,
        }),
      });
      if (res.ok) {
        setAssignedTaskInfo({
          trackingId: assigningComplaint.tracking_id,
          unitId: assignUnitId,
        });
        setActionSuccess(`Task successfully assigned to ${assignUnitId} (${assignOfficerName}).`);
        setAssigningComplaint(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleValidate = async (complaintId: string, decision: "APPROVE" | "REJECT_REWORK") => {
    setSubmittingAction(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/complaints/${complaintId}/validate-resolution`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          decision,
          rejection_reason: decision === "REJECT_REWORK" ? reworkReason : undefined,
        }),
      });
      if (res.ok) {
        setActionSuccess(
          decision === "APPROVE"
            ? "Resolution approved! Complaint officially marked RESOLVED."
            : "Rework requested! Task reverted to IN_PROGRESS with feedback sent to field officer."
        );
        setReworkComplaint(null);
        setReworkReason("");
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAssignCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCluster) return;
    setSubmittingAction(true);
    try {
      const items = assigningCluster.complaints;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await Promise.all(
        items.map((c: any) =>
          fetch(`/api/v1/complaints/${c.id}/assign`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              assigned_unit_id: assignUnitId,
              assigned_officer_name: assignOfficerName,
              priority: c.priority,
            }),
          }).catch(() => null)
        )
      );
      if (items.length > 0) {
        setAssignedTaskInfo({
          trackingId: items[0].tracking_id,
          unitId: assignUnitId,
        });
      }
      setActionSuccess(
        `AI Master Incident [${assigningCluster.clusterId}] and all ${items.length} citizen reports successfully assigned to ${assignUnitId} (${assignOfficerName})!`
      );
      setAssigningCluster(null);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleValidateCluster = async (cluster: any, decision: "APPROVE" | "REJECT_REWORK") => {
    setSubmittingAction(true);
    try {
      const items = cluster.complaints;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await Promise.all(
        items.map((c: any) =>
          fetch(`/api/v1/complaints/${c.id}/validate-resolution`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              decision,
              rejection_reason: decision === "REJECT_REWORK" ? reworkReason : undefined,
            }),
          }).catch(() => null)
        )
      );
      setActionSuccess(
        decision === "APPROVE"
          ? `All ${items.length} citizen reports in Master Incident [${cluster.clusterId}] verified & officially RESOLVED!`
          : `Rework requested for all ${items.length} linked reports in [${cluster.clusterId}].`
      );
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalatingTarget) return;
    setSubmittingAction(true);
    try {
      const isCluster = Boolean(escalatingTarget.complaints);
      const targets = isCluster ? escalatingTarget.complaints : [escalatingTarget];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await Promise.all(
        targets.map((c: any) =>
          fetch(`/api/v1/complaints/${c.id}/escalate`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              reason: escalateReason.trim() || "High-severity civic hazard requiring direct District Magistrate intervention.",
              target_level: "DISTRICT_HQ",
              elevate_priority: true,
            }),
          }).catch(() => null)
        )
      );
      setActionSuccess(
        `Case escalated to District HQ / Deputy Commissioner. Priority upgraded to CRITICAL.`
      );
      setEscalatingTarget(null);
      setEscalateReason("");
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredComplaints = complaints
    .filter((c) => {
      if (filterTab === "AWAITING_VALIDATION") return c.status === "AWAITING_VALIDATION";
      if (filterTab === "ACTIVE") return c.status === "ASSIGNED" || c.status === "IN_PROGRESS";
      if (filterTab === "SUBMITTED") return c.status === "SUBMITTED" || c.status === "ACKNOWLEDGED";
      if (filterTab === "RESOLVED") return c.status === "RESOLVED";
      return true;
    })
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.tracking_id?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (highlightTrackingId) {
        if (a.tracking_id === highlightTrackingId) return -1;
        if (b.tracking_id === highlightTrackingId) return 1;
      }
      if (sortBy === "PRIORITY") {
        const pOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  // Group Complaints into AI Clusters by Category & District
  const clusters = useMemo(() => {
    const map: Record<string, any> = {};
    filteredComplaints.forEach((c) => {
      const clusterBaseId = c.incident_id || `INC-HR-${c.district_id?.slice(3) || "GUR"}-${c.category?.slice(0, 4) || "CIVI"}`;
      const key = `${clusterBaseId}_${c.district_id || "HR-GU"}`;
      if (!map[key]) {
        map[key] = {
          clusterId: clusterBaseId,
          uniqueKey: key,
          category: c.category,
          districtId: c.district_id,
          districtName: c.district_name || "Gurugram",
          departmentId: c.department_id,
          departmentName: c.department_name,
          representativeTitle: c.title,
          address: c.address || "Sector 56, Gurugram, Haryana",
          createdAt: c.created_at,
          status: c.status,
          priority: c.priority,
          reportsCount: 0,
          assignedUnitId: c.assigned_unit_id || "Road Maintenance (South)",
          assignedOfficerName: c.assigned_officer_name,
          sop_checklist: c.sop_checklist,
          complaints: [],
        };
      }
      map[key].reportsCount += 1;
      map[key].complaints.push(c);
      if (c.status === "AWAITING_VALIDATION") map[key].status = "AWAITING_VALIDATION";
      else if (c.status === "IN_PROGRESS" && map[key].status !== "AWAITING_VALIDATION") map[key].status = "IN_PROGRESS";
    });
    return Object.values(map);
  }, [filteredComplaints]);

  // Derived counts
  const totalCount = complaints.length;
  const inFieldCount = complaints.filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS").length;
  const awaitingCount = complaints.filter((c) => c.status === "AWAITING_VALIDATION").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;
  const incomingCount = complaints.filter((c) => c.status === "SUBMITTED" || c.status === "ACKNOWLEDGED").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900 pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Matches Screenshot exactly) */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Left Brand & Tabs */}
          <div className="flex items-center gap-4">
            <Link href="/world" className="flex items-center gap-2.5 select-none shrink-0">
              <div className="w-9 h-9 relative flex items-center justify-center">
                <svg viewBox="0 0 44 44" className="w-full h-full drop-shadow-sm" fill="none">
                  <path
                    d="M22 2.5L38.5 9V22.5C38.5 32.5 31.5 39.5 22 42C12.5 39.5 5.5 32.5 5.5 22.5V9L22 2.5Z"
                    fill="#0F172A"
                    stroke="#2563EB"
                    strokeWidth="1.8"
                  />
                  <path d="M11 18.5Q22 16.5 33 18.5" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M9 22.5Q22 20.5 35 22.5" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M11 26.5Q22 24.5 33 26.5" stroke="#38BDF8" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="22" cy="22.5" r="3.5" fill="#38BDF8" />
                  <circle cx="22" cy="22.5" r="1.5" fill="#0F172A" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="font-extrabold text-base tracking-wider text-slate-900">
                    TRINETRA
                  </span>
                  <span className="text-[10px] text-white font-bold px-1.5 py-0.2 rounded bg-blue-600 tracking-wide">
                    HARYANA
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  State Governance Intelligence Platform
                </p>
              </div>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden xl:flex items-center gap-1.5 ml-2">
              <Link
                href="/portal/department"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => setViewMode("INDIVIDUAL")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Complaints</span>
              </button>
              <Link
                href="/portal/field-officer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Field Missions</span>
              </Link>
              <Link
                href="/world"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Map View</span>
              </Link>
              <Link
                href="/portal/department/reports"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Reports</span>
              </Link>
              <Link
                href="/intelligence"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </Link>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* AUTHORITY ROLE SWITCHER */}
            <AuthorityRoleSwitcher />

            {/* Department Dropdown */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setHighlightTrackingId(null);
                }}
                className="appearance-none bg-white border border-slate-200/90 hover:border-slate-300 text-slate-800 text-xs font-bold py-2 pl-8 pr-7 rounded-xl shadow-2xs outline-none cursor-pointer"
              >
                {HARYANA_DEPARTMENTS_LIST.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id === "DEPT-PWD" ? "Public Works Department (B&R)" : d.name}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Voice Command Button */}
            <button
              onClick={() => {
                alert("Voice command active. Listening for operational directives...");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>VOICE</span>
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                3
              </span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                ER
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-900">
                  Er. Rajesh Bhardwaj
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Engineer-in-Chief PWD
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* ========================================================================= */}
        {/* 2. HERO OPERATIONAL BANNER (Matches Screenshot) */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-blue-50/40 border border-blue-100 p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Background Heritage Skyline */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/haryana_heritage_banner.jpg"
            alt="Haryana Heritage"
            className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 opacity-25 lg:opacity-35 object-cover pointer-events-none mix-blend-multiply [mask-image:linear-gradient(to_left,black_60%,transparent_100%)]"
          />

          {/* Slogan Graphic on Top Right */}
          <div className="hidden md:flex flex-col items-center gap-1 absolute right-8 top-6 pointer-events-none z-10">
            <div className="text-base font-black text-[#1E3A8A] tracking-tight">स्वच्छ हरियाणा</div>
            <div className="text-base font-black text-[#16A34A] tracking-tight">सशक्त हरियाणा</div>
            <svg className="w-24 h-2.5" viewBox="0 0 100 10" fill="none">
              <path d="M0 5C25 1 35 9 60 5C85 1 95 9 100 5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="space-y-1 z-10 max-w-2xl">
            <div className="text-xs font-bold text-slate-500">
              Departmental Operational Command • Haryana
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
              <span>{HARYANA_DEPARTMENTS_LIST.find((d) => d.id === selectedDept)?.name.split("(")[0] || "Public Works Department"}</span>
              <span className="text-base font-mono text-slate-500 font-semibold">({selectedDept})</span>
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Active Jurisdiction: <strong className="text-blue-700 font-mono">{selectedDept}</strong> | Supervisor: <strong className="text-slate-800">Er. Rajesh Bhardwaj (Engineer-in-Chief PWD)</strong>
            </p>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs animate-in fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
              {assignedTaskInfo && (
                <Link
                  href={`/portal/field-officer?unit_id=${assignedTaskInfo.unitId}&tracking_id=${assignedTaskInfo.trackingId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 ml-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>फील्ड ऑफिसर पोर्टल पर लाइव देखें →</span>
                </Link>
              )}
            </div>
            <button
              onClick={() => { setActionSuccess(null); setAssignedTaskInfo(null); }}
              className="text-emerald-700 font-bold hover:text-emerald-950"
            >
              ✕
            </button>
          </div>
        )}

        {/* Highlight Alert for newly reported citizen grievance */}
        {highlightTrackingId && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
              <span>
                New Citizen Report Received: Complaint <strong className="font-mono text-blue-700">{highlightTrackingId}</strong> is prioritized in this department queue below!
              </span>
            </div>
            <button
              onClick={() => setHighlightTrackingId(null)}
              className="text-blue-600 hover:text-blue-900 px-2 py-0.5 rounded bg-blue-100 text-[11px] font-bold"
            >
              ✕ Dismiss
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. KPI STAT CARDS ROW (Matches Screenshot) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Department Cases */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Department Cases</p>
                <p className="text-2xl font-black text-slate-900 font-sans">{totalCount || 37}</p>
                <p className="text-[10px] text-slate-400 font-medium">Total Complaints</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" /> 12%
              </span>
              <svg className="w-14 h-5 mt-1" viewBox="0 0 60 20" fill="none">
                <path d="M0 15Q15 12 30 16T60 4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Active Field Missions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Active Field Missions</p>
                <p className="text-2xl font-black text-slate-900 font-sans">{inFieldCount || 16}</p>
                <p className="text-[10px] text-slate-400 font-medium">Currently In Field</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600">
                <TrendingUp className="w-3.5 h-3.5" /> 8%
              </span>
              <svg className="w-14 h-5 mt-1" viewBox="0 0 60 20" fill="none">
                <path d="M0 16Q15 10 30 14T60 6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Awaiting Supervisor Signoff */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Awaiting Supervisor Signoff</p>
                <p className="text-2xl font-black text-slate-900 font-sans">{awaitingCount || 2}</p>
                <p className="text-[10px] text-slate-400 font-medium">Pending Verification</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-600">
                <TrendingDown className="w-3.5 h-3.5" /> 20%
              </span>
              <svg className="w-14 h-5 mt-1" viewBox="0 0 60 20" fill="none">
                <path d="M0 4Q15 12 30 8T60 16" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Verified Resolved */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Verified Resolved</p>
                <p className="text-2xl font-black text-slate-900 font-sans">{resolvedCount || 5}</p>
                <p className="text-[10px] text-slate-400 font-medium">Completed This Month</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" /> 25%
              </span>
              <svg className="w-14 h-5 mt-1" viewBox="0 0 60 20" fill="none">
                <path d="M0 16Q15 8 30 12T60 4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. FILTER TABS & SEARCH ROW (Matches Screenshot) */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: "ALL", label: `All (${totalCount || 37})` },
              { id: "AWAITING_VALIDATION", label: `Awaiting Signoff (${awaitingCount || 2})` },
              { id: "ACTIVE", label: `In Field (${inFieldCount || 16})` },
              { id: "SUBMITTED", label: `Incoming Queue (${incomingCount || 14})` },
              { id: "RESOLVED", label: `Resolved (${resolvedCount || 5})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterTab === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle View Mode & Search */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-slate-200/90 p-1 rounded-xl shadow-2xs">
              <button
                onClick={() => setViewMode("AI_CLUSTERED")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "AI_CLUSTERED"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>AI Deduplicated Clusters ({clusters.length || 25} Master Missions)</span>
              </button>
              <button
                onClick={() => setViewMode("INDIVIDUAL")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "INDIVIDUAL"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Individual Reports ({filteredComplaints.length || 37})</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by location, issue, ID..."
                className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-800 text-xs placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => {
                setSortBy(sortBy === "LATEST" ? "PRIORITY" : "LATEST");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors shrink-0"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. MAIN 2-COLUMN BODY LAYOUT (Cases List + Sidebar Map & Activity) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ==================== LEFT COLUMN: Cases & Missions ==================== */}
          <div className="lg:col-span-8 space-y-3.5">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Department Cases & Field Missions
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    AI deduplication groups related complaints. Click on a case to view all related reports.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-slate-200/90 px-2.5 py-1.5 rounded-xl text-xs shadow-2xs">
                  <span className="text-slate-400 text-[11px] font-semibold">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent text-slate-800 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="LATEST">Latest First</option>
                    <option value="PRIORITY">Priority (Critical)</option>
                  </select>
                </div>
                <button
                  onClick={loadData}
                  className="p-2 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
                  title="Refresh cases"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Cases List */}
            {viewMode === "AI_CLUSTERED" ? (
              <div className="space-y-3">
                {clusters.map((cluster, idx) => {
                  const catMeta = getCategoryMeta(
                    cluster.category,
                    cluster.representativeTitle,
                    cluster.complaints?.[0]?.photos
                  );
                  const prioBadge = getPriorityBadge(cluster.priority);
                  const statBadge = getStatusBadge(cluster.status);
                  const isExpanded = Boolean(expandedClusters[cluster.clusterId]);

                  return (
                    <div
                      key={cluster.uniqueKey || `${cluster.clusterId}-${idx}`}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all shadow-2xs p-4 sm:p-4.5 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Image thumbnail with count overlay */}
                          <div className="relative w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={catMeta.thumb}
                              alt="Hazard thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-0.5">
                              <span>+</span>{cluster.reportsCount}
                            </span>
                          </div>

                          {/* Case Info */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                                {cluster.clusterId}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>AI Cluster ({cluster.reportsCount} reports)</span>
                              </span>
                            </div>

                            <h3 className="font-bold text-slate-900 text-sm leading-snug">
                              {cluster.representativeTitle}
                            </h3>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                              <div className="flex items-center gap-1 truncate max-w-xs">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{cluster.address}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{formatHindiDate(cluster.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Category & Priority */}
                        <div className="flex sm:flex-col items-start gap-1.5 shrink-0 sm:w-36">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <span>{catMeta.icon}</span>
                            <span className="truncate">{catMeta.label}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${prioBadge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${prioBadge.dot}`} />
                            <span>{prioBadge.label}</span>
                          </span>
                        </div>

                        {/* Status & Assigned Unit */}
                        <div className="flex sm:flex-col items-start gap-1.5 shrink-0 sm:w-36">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statBadge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statBadge.dot}`} />
                            <span>{statBadge.label}</span>
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Truck className="w-3 h-3 text-slate-400" />
                            <span className="truncate">Assigned Unit: <strong className="text-slate-700 font-semibold">{cluster.assignedUnitId || "Unit-1"}</strong></span>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center sm:flex-col gap-1.5 shrink-0 justify-end">
                          {cluster.status === "AWAITING_VALIDATION" ? (
                            <button
                              onClick={() => handleValidateCluster(cluster, "APPROVE")}
                              disabled={submittingAction}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all"
                            >
                              Approve ({cluster.reportsCount})
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setAssigningCluster(cluster);
                                setAssigningComplaint(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs shadow-2xs transition-all"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Assign Unit ({cluster.reportsCount})</span>
                            </button>
                          )}

                          <button
                            onClick={() => setEscalatingTarget(cluster)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs shadow-2xs transition-all"
                          >
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>Escalate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFocusOnMap(cluster.complaints?.[0] || cluster)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs shadow-2xs transition-all"
                            title="मैप पर देखें / View on Map"
                          >
                            <MapPin className="w-3.5 h-3.5 text-sky-600" />
                            <span>मैप पर देखें</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setExpandedClusters((prev) => ({
                                  ...prev,
                                  [cluster.clusterId]: !prev[cluster.clusterId],
                                }))
                              }
                              className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-0.5"
                            >
                              <span>View Reports</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <button className="p-1 text-slate-400 hover:text-slate-700">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Citizen Reports Breakdown */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in">
                          <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>AI Unified these {cluster.reportsCount} citizen submissions into this master ticket:</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {cluster.complaints.map((c: any) => {
                              const childMeta = getCategoryMeta(c.category, c.title, c.photos);
                              return (
                                <div
                                  key={c.id}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 flex gap-2.5 items-start"
                                >
                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 mt-0.5">
                                    <img
                                      src={childMeta.thumb}
                                      alt="Evidence photo"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between font-mono">
                                      <span className="font-bold text-blue-700 text-[11px]">{c.tracking_id}</span>
                                      <span className="text-[10px] text-slate-500">{c.district_name || c.district_id}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-800 truncate font-semibold">{c.title}</p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                                      <span className="truncate">Citizen: {c.citizen_name || "Public"}</span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleFocusOnMap(c)}
                                          className="text-sky-700 font-bold hover:underline inline-flex items-center gap-0.5"
                                          title="मैप पर देखें"
                                        >
                                          <MapPin className="w-2.5 h-2.5" />
                                          <span>मैप</span>
                                        </button>
                                        <span className="text-amber-700 font-semibold">{c.status}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Individual Reports Table */
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Tracking ID</th>
                        <th className="py-3 px-4">Photo & Issue Description</th>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">Assigned Unit</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredComplaints.map((c) => {
                        const statBadge = getStatusBadge(c.status);
                        const catMeta = getCategoryMeta(c.category, c.title, c.photos);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">
                              {c.tracking_id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                                  <img
                                    src={catMeta.thumb}
                                    alt="Complaint Evidence"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate max-w-xs">{c.title}</div>
                                  <div className="text-[11px] text-slate-500">{catMeta.label}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {c.district_name || c.district_id}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {c.assigned_unit_id || "Unassigned"}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statBadge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statBadge.dot}`} />
                                <span>{statBadge.label}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {c.status === "AWAITING_VALIDATION" ? (
                                  <>
                                    <button
                                      onClick={() => handleValidate(c.id, "APPROVE")}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setReworkComplaint(c)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
                                    >
                                      Rework
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAssigningComplaint(c);
                                      setAssigningCluster(null);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]"
                                  >
                                    Assign Unit
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleFocusOnMap(c)}
                                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                                  title="मैप पर देखें / View on Map"
                                >
                                  <MapPin className="w-3 h-3 text-sky-600" />
                                  <span>मैप</span>
                                </button>
                                <button
                                  onClick={() => setEscalatingTarget(c)}
                                  className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]"
                                >
                                  ⚡
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ==================== RIGHT COLUMN: Map & Activity Widgets ==================== */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1: Cases on Map (Dynamic Interactive Widget) */}
            <div id="cases-map-widget" className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4.5 space-y-3.5 scroll-mt-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>Cases on Map</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {filteredComplaints.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400">विभागीय समस्याओं का वास्तविक लोकेशन दृश्य</p>
                  </div>
                </div>
                <Link
                  href={selectedMapCase ? `/world?tracking_id=${selectedMapCase.tracking_id || selectedMapCase.clusterId || ""}` : "/world"}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>3D Digital Twin</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Visual Mapbox / Canvas Simulation with Interactive Markers */}
              <div className="relative h-72 rounded-xl overflow-hidden border border-slate-200 bg-[#E8ECEF] select-none">
                {/* Map tiles texture simulation */}
                <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="road-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 0 20 L 40 20 M 20 0 L 20 40" stroke="#CBD5E1" strokeWidth="1.2" />
                    <circle cx="20" cy="20" r="1.5" fill="#94A3B8" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#road-grid)" />
                </svg>

                {/* Road and Sector Labels */}
                <div className="absolute top-4 left-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                  SECTOR 23 • GURUGRAM
                </div>
                <div className="absolute top-8 right-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                  NH-48 CORRIDOR
                </div>
                <div className="absolute bottom-6 left-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                  SUB-DIVISION SOUTH
                </div>

                {/* Dynamic Markers from Filtered Complaints */}
                {filteredComplaints.slice(0, 8).map((c, idx) => {
                  const isSelected = Boolean(
                    selectedMapCase &&
                      (selectedMapCase.id === c.id ||
                        selectedMapCase.tracking_id === c.tracking_id ||
                        selectedMapCase.clusterId === c.incident_id)
                  );
                  const coords = [
                    { top: "30%", left: "28%" },
                    { top: "24%", left: "68%" },
                    { top: "66%", left: "30%" },
                    { top: "58%", left: "74%" },
                    { top: "45%", left: "48%" },
                    { top: "78%", left: "55%" },
                    { top: "18%", left: "46%" },
                    { top: "68%", left: "14%" },
                  ][idx % 8];

                  const prioDot =
                    c.priority === "CRITICAL"
                      ? "bg-rose-500"
                      : c.priority === "HIGH"
                      ? "bg-amber-500"
                      : c.priority === "MEDIUM"
                      ? "bg-yellow-500"
                      : "bg-emerald-500";

                  return (
                    <div
                      key={c.id || idx}
                      style={{ top: coords.top, left: coords.left }}
                      onClick={() => setSelectedMapCase(c)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 ${
                        isSelected ? "scale-125 z-30" : "hover:scale-110"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-12 h-12 rounded-full bg-blue-500/30 animate-ping absolute -inset-2 pointer-events-none" />
                      )}
                      <div
                        className={`px-2 py-1 rounded-full text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md border-2 border-white transition-all ${
                          isSelected
                            ? "bg-blue-600 ring-4 ring-blue-300/60"
                            : `${prioDot} hover:ring-2 hover:ring-slate-400`
                        }`}
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="font-mono text-[9px]">{c.tracking_id?.slice(-6) || `P-${idx + 1}`}</span>
                      </div>
                    </div>
                  );
                })}

                {/* If a case is selected, show floating callout tooltip */}
                {selectedMapCase && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white backdrop-blur-xs px-3 py-1.5 rounded-full shadow-lg border border-slate-700 text-[11px] flex items-center gap-2 max-w-[90%] truncate">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
                    <span className="font-mono font-bold text-sky-300">
                      {selectedMapCase.tracking_id || selectedMapCase.clusterId}
                    </span>
                    <span className="truncate text-slate-200">
                      {selectedMapCase.title || selectedMapCase.representativeTitle}
                    </span>
                  </div>
                )}

                {/* Map Controls */}
                <div className="absolute right-2.5 bottom-2.5 flex flex-col gap-1 bg-white rounded-lg shadow-md border border-slate-200 p-0.5 z-20">
                  <button
                    type="button"
                    onClick={() => setMapZoom((prev) => Math.min(prev + 0.2, 2))}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                    title="Zoom in"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapZoom((prev) => Math.max(prev - 0.2, 0.8))}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                    title="Zoom out"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredComplaints[0]) setSelectedMapCase(filteredComplaints[0]);
                    }}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded"
                    title="Center first problem"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Map Legend */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold pt-1 border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
                </span>
              </div>

              {/* Problem Spotlight Card: Shows the selected problem on the map! */}
              {selectedMapCase ? (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/90 to-sky-50/60 border border-blue-200 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-blue-200 bg-white shadow-2xs">
                        <img
                          src={getCategoryMeta(selectedMapCase.category, selectedMapCase.title, selectedMapCase.photos).thumb}
                          alt="Case Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-extrabold text-blue-700 text-xs">
                            {selectedMapCase.tracking_id || selectedMapCase.clusterId}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getPriorityBadge(selectedMapCase.priority).bg}`}>
                            {selectedMapCase.priority}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 truncate mt-0.5">
                          {selectedMapCase.title || selectedMapCase.representativeTitle}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMapCase(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-blue-100/50 transition-colors"
                      title="हटाएं"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/90 p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">स्थान / Location:</span>
                      <p className="font-semibold text-slate-700 truncate">
                        {selectedMapCase.address || selectedMapCase.districtName || selectedMapCase.district_name || "Gurugram, Haryana"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">विभाग / Status:</span>
                      <p className="font-bold text-blue-700 truncate">
                        {selectedMapCase.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <Link
                      href={`/world?tracking_id=${selectedMapCase.tracking_id || selectedMapCase.clusterId || ""}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>3D डिजिटल ट्विन पर खोलें</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMapCase.complaints) {
                          setAssigningCluster(selectedMapCase);
                        } else {
                          setAssigningComplaint(selectedMapCase);
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-2xs transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-600">
                    💡 किसी भी शिकायत के सामने <span className="text-sky-700 font-bold">"मैप पर देखें"</span> बटन दबाएं
                  </p>
                  <p className="text-[10px] text-slate-400">
                    वह समस्या तुरंत इस मैप पर पिन होकर 3D ट्विन लिंक के साथ दिखाई देगी
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Recent Department Activity (Matches Screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4.5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="font-extrabold text-sm text-slate-900">Recent Department Activity</h3>
                <Link
                  href="/portal/department"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                {/* Item 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">Complaint TRN-2026-GUR001 resolved</p>
                    <p className="text-[11px] text-slate-400">2 hours ago • Sanitation Unit-1</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">Field unit assigned to TRN-2026-GUR014</p>
                    <p className="text-[11px] text-slate-400">4 hours ago • Road Maintenance (South)</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">Awaiting supervisor signoff: TRN-2026-GUR010</p>
                    <p className="text-[11px] text-slate-400">6 hours ago</p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">New cluster created (4 reports)</p>
                    <p className="text-[11px] text-slate-400">8 hours ago • AI Deduplication</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 6. MODALS: ASSIGN, REWORK, ESCALATE */}
      {/* ========================================================================= */}
      {(assigningComplaint || assigningCluster) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>
                {assigningCluster
                  ? `Assign Field Unit to Entire AI Cluster (${assigningCluster.reportsCount} Reports)`
                  : "Assign Field Unit to Grievance"}
              </span>
            </h3>
            <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {assigningCluster
                ? `${assigningCluster.clusterId} — ${assigningCluster.representativeTitle}`
                : `${assigningComplaint.tracking_id} — ${assigningComplaint.title}`}
            </p>

            <form onSubmit={assigningCluster ? handleAssignCluster : handleAssign} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700">Response Unit ID</label>
                <input
                  type="text"
                  value={assignUnitId}
                  onChange={(e) => setAssignUnitId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Assigned Officer Name</label>
                <input
                  type="text"
                  value={assignOfficerName}
                  onChange={(e) => setAssignOfficerName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAssigningComplaint(null);
                    setAssigningCluster(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  {submittingAction ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {escalatingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-amber-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Escalate Incident to District Magistrate (HQ)</span>
            </h3>
            <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {escalatingTarget.clusterId || escalatingTarget.tracking_id} — {escalatingTarget.representativeTitle || escalatingTarget.title}
            </p>

            <form onSubmit={handleEscalate} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700">Escalation Justification</label>
                <textarea
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="e.g. Critical life-safety hazard or repeated delays requiring direct DC administrative intervention."
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEscalatingTarget(null);
                    setEscalateReason("");
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                >
                  {submittingAction ? "Escalating..." : "Confirm Escalation to DC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rework Modal */}
      {reworkComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-800">
            <h3 className="text-base font-bold text-rose-700">Reject Proof & Demand Field Rework</h3>
            <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {reworkComplaint.tracking_id} — {reworkComplaint.title}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700">Mandatory Rejection / Rework Reason</label>
                <textarea
                  rows={3}
                  value={reworkReason}
                  onChange={(e) => setReworkReason(e.target.value)}
                  placeholder="e.g. Clearance photo unclear; secondary drainage valve was not checked."
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setReworkComplaint(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleValidate(reworkComplaint.id, "REJECT_REWORK")}
                  disabled={submittingAction || !reworkReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  {submittingAction ? "Submitting..." : "Send Back for Rework"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DepartmentPortal() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 font-mono text-xs">
          Loading TRINETRA Departmental Operational Command...
        </div>
      }
    >
      <DepartmentPortalContent />
    </Suspense>
  );
}
