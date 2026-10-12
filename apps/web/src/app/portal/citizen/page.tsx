"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/command-center/Header";
import {
  User,
  FilePlus2,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Star,
  Send,
  Lock,
  Building2,
  MapPin,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Camera,
  Navigation,
  Check,
  X,
  FileText,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  HARYANA_DISTRICTS,
  HARYANA_DEPARTMENTS,
  COMPLAINT_CATEGORIES,
  findNearestHaryanaDistrict,
} from "@/lib/haryana";

export default function CitizenPortal() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Tracker
  const [trackQuery, setTrackQuery] = useState("");
  const [trackedRecord, setTrackedRecord] = useState<any>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // New Grievance Form State & Modal
  const [showLodgeModal, setShowLodgeModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("URBAN_FLOODING");
  const [districtId, setDistrictId] = useState("HR-GU");
  const [departmentId, setDepartmentId] = useState("DEPT-PWD");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(28.4595);
  const [longitude, setLongitude] = useState<number | null>(77.0266);
  const [citizenName, setCitizenName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [attachments, setAttachments] = useState<any[]>([
    {
      uri: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800",
      filename: "incident_site_photo.jpg",
      mime: "image/jpeg",
    },
  ]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");

  // Location Auto-Detect State
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsDetectedBadge, setGpsDetectedBadge] = useState<string | null>(null);

  // AI Model Auto-Assist State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestedCategory?: string;
    categoryConfidence?: number;
    suggestedDeptId?: string;
    suggestedDeptName?: string;
    priorityAssessment?: string;
    keywords?: string[];
  } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form Submission
  const [submittingGrievance, setSubmittingGrievance] = useState(false);
  const [lodgeSuccess, setLodgeSuccess] = useState<any | null>(null);

  // Feedback & Reopen state
  const [feedbackComplaintId, setFeedbackComplaintId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const [reopenComplaintId, setReopenComplaintId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenSuccess, setReopenSuccess] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trinetra_user");
      const storedToken = localStorage.getItem("trinetra_token") || localStorage.getItem("token");
      if (stored) {
        const u = JSON.parse(stored);
        setAuthUser(u);
        setCitizenName(u.display_name || "");
        setCitizenPhone(u.phone || "");
        if (u.district_id) setDistrictId(u.district_id);
      }
      if (storedToken) setToken(storedToken);
    } catch (e) {
      // ignore
    }
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/complaints", { headers });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [token]);

  // Live AI text analysis as citizen types title or description
  const triggerAiAnalysis = (newTitle: string, newDesc: string, curDistrict: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!newTitle.trim() && !newDesc.trim()) {
      setAiSuggestion(null);
      return;
    }

    setAiAnalyzing(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/intelligence/ai/classify", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: newTitle || "Complaint",
            description: newDesc || newTitle,
            district_id: curDistrict,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setAiSuggestion({
            suggestedCategory: data.classification?.suggested_category,
            categoryConfidence: data.classification?.confidence,
            suggestedDeptId: data.routing?.suggested_department_id,
            suggestedDeptName: data.routing?.suggested_department_name,
            priorityAssessment: data.routing?.priority_assessment,
            keywords: data.classification?.keywords_detected || [],
          });
        }
      } catch (err) {
        console.error("AI Assist call failed:", err);
      } finally {
        setAiAnalyzing(false);
      }
    }, 600);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAiAnalysis(val, description, districtId);
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    triggerAiAnalysis(title, val, districtId);
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.suggestedCategory) setCategory(aiSuggestion.suggestedCategory);
    if (aiSuggestion.suggestedDeptId) setDepartmentId(aiSuggestion.suggestedDeptId);
  };

  // GPS Auto-Detect Location with Haryana Centroids
  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);

        const nearest = findNearestHaryanaDistrict(lat, lng);
        setDistrictId(nearest.id);
        const autoAddr = `${nearest.name} Sector Center, ${nearest.name}, Haryana`;
        setAddress(autoAddr);
        setGpsDetectedBadge(`GPS: ${nearest.name} (${lat}° N, ${lng}° E)`);
        setGpsDetecting(false);

        // re-run AI suggestion with the auto-detected district
        triggerAiAnalysis(title, description, nearest.id);
      },
      (err) => {
        console.warn("GPS lookup denied or unavailable. Fallback to Gurugram.", err);
        // Fallback default to Gurugram
        setLatitude(28.4595);
        setLongitude(77.0266);
        setDistrictId("HR-GU");
        setAddress("Subhash Chowk, Gurugram, Haryana");
        setGpsDetectedBadge("GPS Fallback: Gurugram (28.4595° N, 77.0266° E)");
        setGpsDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleLodgeGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmittingGrievance(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const finalAttachments = [...attachments];
      if (customPhotoUrl.trim()) {
        finalAttachments.push({
          uri: customPhotoUrl.trim(),
          filename: "citizen_attachment.jpg",
          mime: "image/jpeg",
        });
      }

      const res = await fetch("/api/v1/complaints", {
        method: "POST",
        headers,
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          district_id: districtId,
          department_id: departmentId,
          latitude: latitude || 28.4595,
          longitude: longitude || 77.0266,
          address: address.trim() || `${districtId}, Haryana`,
          citizen_name: citizenName.trim() || "Citizen Reporter",
          citizen_phone: citizenPhone.trim() || "+91-98100-11223",
          attachments: finalAttachments,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail || "Grievance submission failed");
      }

      const created = await res.json();
      setLodgeSuccess(created);
      setShowLodgeModal(false);
      // Reset fields
      setTitle("");
      setDescription("");
      setAiSuggestion(null);
      // Reload complaints
      loadComplaints();
    } catch (err: any) {
      alert(err.message || "Failed to lodge grievance");
    } finally {
      setSubmittingGrievance(false);
    }
  };

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedRecord(null);

    try {
      const res = await fetch(`/api/v1/complaints/track/${encodeURIComponent(trackQuery.trim())}`);
      if (!res.ok) {
        throw new Error("No grievance found with this reference number.");
      }
      const data = await res.json();
      setTrackedRecord(data);
    } catch (err: any) {
      setTrackingError(err.message || "Failed to locate grievance.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleSendFeedback = async (complaintId: string) => {
    if (!token) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/complaints/${complaintId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comments: feedbackComment,
        }),
      });
      if (res.ok) {
        setFeedbackSuccess("Thank you! Your feedback has been recorded.");
        setFeedbackComplaintId(null);
        loadComplaints();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReopen = async (complaintId: string) => {
    if (!token || !reopenReason.trim()) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/complaints/${complaintId}/reopen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reopen_reason: reopenReason,
        }),
      });
      if (res.ok) {
        setReopenSuccess("Grievance reopened. Case escalated for supervisor re-evaluation.");
        setReopenComplaintId(null);
        setReopenReason("");
        loadComplaints();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <User className="w-3.5 h-3.5" />
              <span>CITIZEN SERVICES & GRIEVANCE REDRESSAL PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Public Grievance Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {authUser ? (
                <>
                  Logged in as <strong className="text-slate-200">{authUser.display_name}</strong> ({authUser.email}) •{" "}
                  <span className="text-emerald-400 font-mono">District: {authUser.district_id || "HR-GU"}</span>
                </>
              ) : (
                <>Public Access Terminal | File Grievances & Track Live Resolution Status</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadComplaints}
              className="p-2 rounded-lg bg-surface-elevated border border-surface-border text-slate-300 hover:text-white transition-colors"
              title="Refresh Complaints"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowLodgeModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Lodge New Grievance / शिकायत दर्ज करें</span>
            </button>
          </div>
        </div>

        {/* Success Banners */}
        {lodgeSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">Grievance Registered Successfully!</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Reference ID: <strong className="font-mono text-emerald-300 text-xs">{lodgeSuccess.tracking_id}</strong> •{" "}
                Routed to: <strong>{lodgeSuccess.department_name}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTrackQuery(lodgeSuccess.tracking_id);
                  handleTrackSearch({ preventDefault: () => {} } as any);
                }}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs"
              >
                Track Now
              </button>
              <button onClick={() => setLodgeSuccess(null)} className="text-emerald-400 hover:text-white px-2">
                ✕
              </button>
            </div>
          </div>
        )}

        {feedbackSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span>{feedbackSuccess}</span>
            <button onClick={() => setFeedbackSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}
        {reopenSuccess && (
          <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <span>{reopenSuccess}</span>
            <button onClick={() => setReopenSuccess(null)} className="text-amber-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Quick Tracking Search Box */}
        <div className="p-5 rounded-xl bg-surface-base border border-surface-border space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Track Grievance by Reference Number</span>
          </h2>
          <form onSubmit={handleTrackSearch} className="flex gap-2">
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="e.g. TRN-2026-GUR001 or TRN-2026-FAR001"
              className="flex-1 p-2.5 rounded-lg bg-slate-900 border border-surface-border text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={trackingLoading}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition-all inline-flex items-center gap-1.5"
            >
              <span>{trackingLoading ? "Locating..." : "Track Status"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {trackingError && (
            <p className="text-xs text-rose-400 font-mono">{trackingError}</p>
          )}

          {/* Tracked Record Card */}
          {trackedRecord && (
            <div className="mt-4 p-4 rounded-lg bg-[#0c1322] border border-emerald-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-emerald-400">
                      {trackedRecord.tracking_id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-slate-300 font-mono">
                      {trackedRecord.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-1">{trackedRecord.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                    {trackedRecord.status}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">{trackedRecord.stage_label}</p>
                </div>
              </div>

              {/* Milestone timeline */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Operational Milestone Progression
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {trackedRecord.milestones?.map((m: any) => (
                    <div
                      key={m.stage}
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        m.completed
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                          : "bg-surface-elevated/30 border-surface-border text-slate-500"
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${m.completed ? "text-emerald-400" : "text-slate-600"}`} />
                      <div>
                        <p className="font-semibold">{m.label}</p>
                        <p className="text-[10px] text-slate-400">{m.actor_label}</p>
                        {m.timestamp && <p className="text-[10px] font-mono text-slate-500 mt-0.5">{m.timestamp}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-surface-border/40">
                <span>{trackedRecord.district_name} • {trackedRecord.department_name}</span>
                <span className="font-mono text-slate-400">ETA: {trackedRecord.estimated_resolution}</span>
              </div>
            </div>
          )}
        </div>

        {/* My Complaints List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Grievances & Service Requests</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {complaints.length}
              </span>
            </h2>
            <button
              onClick={() => setShowLodgeModal(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>+ Lodge New</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
              <span>Loading complaints...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-surface-base border border-surface-border space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No active grievances found.</p>
              <p className="text-xs text-slate-500">
                Have an infrastructure or civic issue? Report waterlogging, potholes, or electrical hazards.
              </p>
              <button
                onClick={() => setShowLodgeModal(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold inline-flex items-center gap-1.5"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Submit Grievance</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => {
                const isResolved = c.status === "RESOLVED";
                const isAwaitingValidation = c.status === "AWAITING_VALIDATION";
                const hasProof = c.resolution_proof && (c.resolution_proof.before_photo || c.resolution_proof.after_photo);

                return (
                  <div
                    key={c.id}
                    className="p-4 sm:p-5 rounded-xl bg-surface-base border border-surface-border hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/50 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {c.tracking_id}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {c.category}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/40">
                            {c.district_name}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{c.title}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                            c.status === "RESOLVED"
                              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                              : c.status === "AWAITING_VALIDATION"
                              ? "bg-purple-950/60 border-purple-500/50 text-purple-300"
                              : c.status === "IN_PROGRESS"
                              ? "bg-blue-950/60 border-blue-500/50 text-blue-300"
                              : c.status === "ASSIGNED"
                              ? "bg-amber-950/60 border-amber-500/50 text-amber-300"
                              : c.status === "REOPENED"
                              ? "bg-rose-950/60 border-rose-500/50 text-rose-300"
                              : "bg-slate-800 border-slate-700 text-slate-300"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span>Assigned Line Department: </span>
                        <strong className="text-slate-200">{c.department_name}</strong>
                      </div>
                      {c.assigned_officer_name && (
                        <div>
                          <span>Field Officer: </span>
                          <strong className="text-cyan-300">{c.assigned_officer_name}</strong> ({c.assigned_unit_id})
                        </div>
                      )}
                      <div>
                        <span>Location: </span>
                        <span className="text-slate-300">{c.address}</span>
                      </div>
                      <div>
                        <span>Reported On: </span>
                        <span className="font-mono text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Resolution Proof Card (Before / After Evidence) */}
                    {hasProof && (
                      <div className="p-3.5 rounded-lg bg-[#0b121e] border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Remediation Proof & Verification Record</span>
                          </div>
                          {c.validation_status === "APPROVED" && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              ✓ Supervisor Approved
                            </span>
                          )}
                        </div>

                        {c.resolution_proof.field_note && (
                          <p className="text-xs text-slate-300 italic">
                            &quot;{c.resolution_proof.field_note}&quot;
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {c.resolution_proof.before_photo && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-mono">Before Remediation:</span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.resolution_proof.before_photo}
                                alt="Before Repair"
                                className="w-full h-28 object-cover rounded border border-slate-800"
                              />
                            </div>
                          )}
                          {c.resolution_proof.after_photo && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-emerald-400 font-mono">After Remediation:</span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.resolution_proof.after_photo}
                                alt="After Repair"
                                className="w-full h-28 object-cover rounded border border-emerald-500/40"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Citizen Action Bar: Feedback or Reopen */}
                    {isResolved && (
                      <div className="pt-2 border-t border-surface-border/40 flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-xs text-slate-400">
                          {c.feedback_rating ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              ★ Rated {c.feedback_rating}/5 {c.feedback_comments && `— "${c.feedback_comments}"`}
                            </span>
                          ) : (
                            <button
                              onClick={() => setFeedbackComplaintId(c.id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>Submit Satisfaction Rating</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setReopenComplaintId(c.id)}
                          className="px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Not Satisfied? Reopen Case</span>
                        </button>
                      </div>
                    )}

                    {/* Feedback Form Drawer */}
                    {feedbackComplaintId === c.id && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                        <span className="font-bold text-white block">Rate Redressal Quality (1-5 Stars):</span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              className={`p-1.5 rounded ${
                                feedbackRating >= star ? "text-amber-400" : "text-slate-600"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Optional citizen feedback remarks..."
                          className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setFeedbackComplaintId(null)}
                            className="px-3 py-1 rounded bg-slate-800 text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendFeedback(c.id)}
                            disabled={submittingAction}
                            className="px-3 py-1 rounded bg-emerald-600 text-black font-bold"
                          >
                            Submit Rating
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reopen Form Drawer */}
                    {reopenComplaintId === c.id && (
                      <div className="mt-3 p-3 rounded-lg bg-rose-950/30 border border-rose-800 space-y-2 text-xs">
                        <span className="font-bold text-rose-300 block">State Reason for Case Reopening:</span>
                        <input
                          type="text"
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="e.g. Pothole patch broke again after 2 days..."
                          className="w-full p-2 rounded bg-slate-950 border border-rose-900/60 text-white outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setReopenComplaintId(null)}
                            className="px-3 py-1 rounded bg-slate-800 text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReopen(c.id)}
                            disabled={submittingAction || !reopenReason.trim()}
                            className="px-3 py-1 rounded bg-rose-600 text-white font-bold"
                          >
                            Confirm Reopen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* LODGE NEW GRIEVANCE MODAL WITH LIVE AI & GPS AUTO-DETECT */}
      {/* ========================================================================= */}
      {showLodgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FilePlus2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Lodge Public Grievance / जन शिकायत दर्ज करें</h2>
              </div>
              <button
                onClick={() => setShowLodgeModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLodgeGrievance} className="space-y-4 text-xs">
              {/* Grievance Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Grievance Summary / शीर्षक <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Severe waterlogging at Subhash Chowk underpass, transformer sparking..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Detailed Description / विवरण <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  rows={3}
                  placeholder="Provide precise details: water level, live wires, traffic disruption, exact road stretch..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* LIVE AI MODEL RECOMMENDATION CARD */}
              <div className="p-3.5 rounded-xl bg-[#0a1526] border border-sky-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span className="font-bold text-sky-300 text-xs">
                      TRINETRA AI Assistant / कृत्रिम बुद्धिमत्ता विश्लेषण
                    </span>
                  </div>
                  {aiAnalyzing && (
                    <span className="text-[10px] text-sky-400 font-mono animate-pulse">
                      Analyzing complaint text...
                    </span>
                  )}
                </div>

                {aiSuggestion ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Predicted Category:</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <strong className="text-white font-mono">{aiSuggestion.suggestedCategory}</strong>
                          {aiSuggestion.categoryConfidence && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {Math.round(aiSuggestion.categoryConfidence * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Recommended Line Dept:</span>
                        <strong className="text-indigo-300 mt-0.5 block truncate">
                          {aiSuggestion.suggestedDeptName || aiSuggestion.suggestedDeptId}
                        </strong>
                      </div>
                    </div>

                    {aiSuggestion.keywords && aiSuggestion.keywords.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="text-slate-400">Detected Indicators:</span>
                        {aiSuggestion.keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={applyAiSuggestion}
                        className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black text-[11px] font-bold shadow flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply AI Routing (श्रेणी व विभाग स्वतः लागू करें)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Type your complaint text above to automatically predict category, department, and severity.
                  </p>
                )}
              </div>

              {/* District & Department Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Grievance Category / श्रेणी
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  >
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Department / विभाग
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                  >
                    {HARYANA_DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location: Auto-Detect GPS & District */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Location Details / स्थान (Haryana)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={gpsDetecting}
                    className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-black text-[11px] font-bold shadow flex items-center gap-1.5 transition-all"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${gpsDetecting ? "animate-spin" : ""}`} />
                    <span>{gpsDetecting ? "Locating..." : "Auto-Detect My Location (GPS)"}</span>
                  </button>
                </div>

                {gpsDetectedBadge && (
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{gpsDetectedBadge}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">District (22 Haryana Districts)</label>
                    <select
                      value={districtId}
                      onChange={(e) => {
                        setDistrictId(e.target.value);
                        triggerAiAnalysis(title, description, e.target.value);
                      }}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500"
                    >
                      {HARYANA_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Street Address / Landmark</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Subhash Chowk, Sohna Road, Sector 38"
                      className="w-full p-2 rounded bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Citizen Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-0.5">Citizen Name</label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="e.g. Rohit Verma"
                    className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-0.5">Contact Mobile</label>
                  <input
                    type="tel"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    placeholder="+91-98100-11223"
                    className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>
              </div>

              {/* Photo Evidence URL */}
              <div>
                <label className="block text-slate-400 text-[11px] mb-0.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Photo Attachment / फोटो प्रमाण (Optional URL)</span>
                </label>
                <input
                  type="url"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or leave blank for default evidence photo"
                  className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white outline-none font-mono text-[11px]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLodgeModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGrievance}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-lg flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingGrievance ? "Registering Case..." : "Submit Grievance / शिकायत दर्ज करें"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
