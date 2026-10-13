"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
  Building2,
  MapPin,
  RefreshCw,
  Sparkles,
  Camera,
  Navigation,
  Check,
  X,
  Mic,
  MicOff,
  Video,
  Image as ImageIcon,
  Trash2,
  PhoneCall,
  ExternalLink,
  Copy,
  Layers,
  ChevronDown,
  Droplets,
  Zap,
  Flame,
  AlertTriangle,
  FileText,
  ListOrdered,
  Home,
  Globe,
  MoreVertical,
  CheckCircle,
} from "lucide-react";
import {
  HARYANA_DISTRICTS,
  HARYANA_DEPARTMENTS,
  COMPLAINT_CATEGORIES,
  findNearestHaryanaDistrict,
} from "@/lib/haryana";
import { AuthorityRoleSwitcher } from "@/components/command-center/AuthorityRoleSwitcher";

const QUICK_PRESETS = [
  {
    id: "waterlogging",
    iconType: "water",
    label: "जलभराव",
    sub: "Waterlogging",
    title: "Severe Underpass & Road Waterlogging",
    desc: "सड़क पर पानी, बारिश का जल भराव",
    fullDesc: "अंडरपास और मुख्य सड़क पर भारी जलभराव हो गया है। गाड़ियां फंसी हैं और यातायात पूरी तरह ठप है।",
    category: "URBAN_FLOODING",
    deptId: "DEPT-PWD",
    badgeColor: "bg-blue-100 text-blue-600",
  },
  {
    id: "electric",
    iconType: "zap",
    label: "बिजली तार / फॉल्ट",
    sub: "Live Wire / Power",
    title: "Broken Live Electric Wire Sparking on Road",
    desc: "बिजली आपूर्ति से संबंधित समस्या",
    fullDesc: "सड़क पर बिजली का तार टूटकर लटक रहा है और चिंगारी निकल रही है। तुरंत बिजली आपूर्ति बंद कर तार ठीक करें।",
    category: "ELECTRICAL_HAZARD",
    deptId: "DEPT-POWER",
    badgeColor: "bg-amber-100 text-amber-600",
  },
  {
    id: "pothole",
    iconType: "road",
    label: "सड़क पर गड्ढा",
    sub: "Dangerous Pothole",
    title: "Deep Crater Pothole on Main Road",
    desc: "सड़क क्षतिग्रस्त या गड्ढे",
    fullDesc: "मुख्य मार्ग पर गहरा जानलेवा गड्ढा है जिससे दोपहिया वाहन गिर रहे हैं। तुरंत पेचवर्क और मरम्मत की आवश्यकता है।",
    category: "ROAD_BLOCKAGE",
    deptId: "DEPT-PWD",
    badgeColor: "bg-slate-200 text-slate-700",
  },
  {
    id: "sewage",
    iconType: "pipe",
    label: "सीवर चोक / रिसाव",
    sub: "Sewer Overflow",
    title: "Sewage Pipeline Burst & Road Overflow",
    desc: "सीवर जाम या गंदा पानी",
    fullDesc: "सीवर लाइन बंद होने से सड़क पर गंदा बदबूदार पानी बह रहा है। तुरंत सीवर सफाई मशीन भेजें।",
    category: "SEWERAGE_OVERFLOW",
    deptId: "DEPT-PWD",
    badgeColor: "bg-sky-100 text-sky-600",
  },
  {
    id: "garbage",
    iconType: "trash",
    label: "कचरा व गंदगी",
    sub: "Garbage Dump",
    title: "Unattended Garbage Dump & Health Hazard",
    desc: "कचरा नहीं उठाया जाना, गंदगी",
    fullDesc: "कॉलोनी के मुख्य मोड़ पर कई दिनों से कचरा नहीं उठाया गया है। बदबू और मच्छरों से बीमारी का खतरा है।",
    category: "HEALTH_HAZARD",
    deptId: "DEPT-HEALTH",
    badgeColor: "bg-emerald-100 text-emerald-600",
  },
];

function formatHindiDate(isoStr?: string) {
  if (!isoStr) return "हाल ही में";
  try {
    const d = new Date(isoStr);
    const months = [
      "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
      "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
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

function getCategoryDisplay(cat: string) {
  switch (cat) {
    case "URBAN_FLOODING":
      return { label: "जलभराव", icon: "💧", color: "text-blue-600" };
    case "ELECTRICAL_HAZARD":
    case "POWER_OUTAGE":
      return { label: "बिजली तार / फॉल्ट", icon: "⚡", color: "text-amber-600" };
    case "ROAD_BLOCKAGE":
      return { label: "सड़क पर गड्ढा", icon: "🛣️", color: "text-slate-600" };
    case "SEWERAGE_OVERFLOW":
      return { label: "सीवर चोक / रिसाव", icon: "🚰", color: "text-sky-600" };
    case "HEALTH_HAZARD":
    case "PUBLIC_HEALTH":
      return { label: "कचरा व गंदगी", icon: "🗑️", color: "text-emerald-600" };
    default:
      return { label: cat.replace(/_/g, " "), icon: "⚠️", color: "text-slate-600" };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "RESOLVED":
      return {
        label: "स्वीकृत / समाधान",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "IN_PROGRESS":
    case "ASSIGNED":
      return {
        label: "प्रगति पर",
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };
    case "AWAITING_VALIDATION":
    case "UNDER_REVIEW":
    case "SUBMITTED":
    default:
      return {
        label: "समीक्षा में",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
  }
}

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTrackModal, setShowTrackModal] = useState(false);

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
  const [attachments, setAttachments] = useState<any[]>([]);

  // Filter Tabs
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");

  // Multimodal Media & Voice Dictation State
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Location Auto-Detect State
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsDetectedBadge, setGpsDetectedBadge] = useState<string | null>(null);

  // AI Auto-Assist State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestedCategory?: string;
    suggestedDeptId?: string;
    suggestedDeptName?: string;
    priorityAssessment?: string;
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

      let myIds: string[] = [];
      try {
        myIds = JSON.parse(localStorage.getItem("trinetra_my_grievances") || "[]");
      } catch (e) {}

      // Retrieve locally submitted grievances cache
      let localCached: any[] = [];
      try {
        localCached = JSON.parse(localStorage.getItem("trinetra_my_complaints_cache") || "[]");
      } catch (e) {}

      const trackingQuery = myIds.length > 0
        ? `?tracking_ids=${encodeURIComponent(myIds.join(","))}&limit=100`
        : `?limit=100`;

      let res = await fetch(`/api/v1/complaints${trackingQuery}`, { headers }).catch(() => null);

      // If token expired / 401, clear invalid token and retry
      if (!res || res.status === 401) {
        localStorage.removeItem("trinetra_token");
        localStorage.removeItem("token");
        res = await fetch(`/api/v1/complaints${trackingQuery}`).catch(() => null);
      }

      if (res && res.ok) {
        const allData = await res.json();

        // Merge: localCached + allData with deduplication by tracking_id
        const combinedMap = new Map<string, any>();
        // Add allData first
        if (Array.isArray(allData)) {
          allData.forEach((c: any) => combinedMap.set(c.tracking_id || c.id, c));
        }
        // Overlay localCached on top so freshly submitted citizen complaints are guaranteed
        localCached.forEach((c: any) => combinedMap.set(c.tracking_id || c.id, c));

        const combinedList = Array.from(combinedMap.values());

        // Prioritize citizen's personal complaints
        const myPersonal = combinedList.filter((c: any) => {
          if (myIds.includes(c.tracking_id) || myIds.includes(c.id)) {
            return true;
          }
          if (authUser && (c.citizen_id === authUser.id || (authUser.phone && c.citizen_phone === authUser.phone))) {
            return true;
          }
          return false;
        });

        // Other complaints
        const others = combinedList.filter((c: any) => !myPersonal.some((m) => m.tracking_id === c.tracking_id));

        // Show personal complaints first, followed by others
        setComplaints([...myPersonal, ...others]);
      } else if (localCached.length > 0) {
        setComplaints(localCached);
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

  // Live AI text analysis for category & department
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
          const cat = data.classification?.suggested_category;
          const dept = data.routing?.suggested_department_id;
          setAiSuggestion({
            suggestedCategory: cat,
            suggestedDeptId: dept,
            suggestedDeptName: data.routing?.suggested_department_name,
            priorityAssessment: data.routing?.priority_assessment,
          });
          if (cat) setCategory(cat);
          if (dept) setDepartmentId(dept);
        }
      } catch (err) {
        console.error("AI Assist error:", err);
      } finally {
        setAiAnalyzing(false);
      }
    }, 450);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAiAnalysis(val, description, districtId);
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    triggerAiAnalysis(title, val, districtId);
  };

  // Quick Preset Selection
  const handleSelectPreset = (p: typeof QUICK_PRESETS[0]) => {
    setTitle(p.title);
    setDescription(p.fullDesc);
    setCategory(p.category);
    setDepartmentId(p.deptId);
    setShowLodgeModal(true);
    triggerAiAnalysis(p.title, p.fullDesc, districtId);
  };

  // Voice Dictation
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice("आपके ब्राउज़र में वॉइस रिकग्निशन समर्थित नहीं है। कृपया लिखकर बताएं।");
      setTimeout(() => setSpeechNotice(null), 4000);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechNotice("आवाज़ सुनी जा रही है... कृपया अपनी समस्या बताएं।");
      };

      recognition.onresult = (event: any) => {
        let finalTrans = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          }
        }
        if (finalTrans) {
          setDescription((prev) => {
            const updated = prev ? `${prev} ${finalTrans}` : finalTrans;
            triggerAiAnalysis(title, updated, districtId);
            return updated;
          });
          if (!title) {
            const shortHeading = finalTrans.split(".")[0]?.slice(0, 70);
            setTitle(shortHeading);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setSpeechNotice("माइक से आवाज़ नहीं मिली। कृपया पुनः प्रयास करें।");
        setTimeout(() => setSpeechNotice(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setSpeechNotice(null);
  };

  // Attach Media
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      setAttachments((prev) => [
        ...prev,
        {
          id: `att-${Date.now()}-${i}`,
          type,
          name: file.name,
          url: previewUrl,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        },
      ]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // GPS Auto-Detect
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("आपके डिवाइस में GPS सुविधा समर्थित नहीं है।");
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        const nearest = findNearestHaryanaDistrict(lat, lng);
        setDistrictId(nearest.id);
        const autoAddr = `${nearest.name} जिला केंद्र, हरियाणा`;
        setAddress(autoAddr);
        setGpsDetectedBadge(`स्थान: ${nearest.name} (${lat.toFixed(3)}° N, ${lng.toFixed(3)}° E)`);
        setGpsDetecting(false);
        triggerAiAnalysis(title, description, nearest.id);
      },
      (err) => {
        console.warn("GPS lookup denied or unavailable.", err);
        setLatitude(28.4595);
        setLongitude(77.0266);
        setDistrictId("HR-GU");
        setAddress("सुभाष चौक, गुरुग्राम, हरियाणा");
        setGpsDetectedBadge("स्थान: गुरुग्राम (डिफ़ॉल्ट GPS)");
        setGpsDetecting(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Submit Grievance
  const handleLodgeGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmittingGrievance(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

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
          citizen_name: citizenName.trim() || "नागरिक (Citizen)",
          citizen_phone: citizenPhone.trim() || "+91-98100-11223",
          attachments,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail || "शिकायत दर्ज करने में विफल");
      }

      const created = await res.json();
      setLodgeSuccess(created);
      setShowLodgeModal(false);

      // Save tracking_id to local citizen session
      try {
        const stored = JSON.parse(localStorage.getItem("trinetra_my_grievances") || "[]");
        if (!stored.includes(created.tracking_id)) stored.unshift(created.tracking_id);
        localStorage.setItem("trinetra_my_grievances", JSON.stringify(stored));
      } catch (e) {}

      // Reset fields
      setTitle("");
      setDescription("");
      setAttachments([]);
      setAiSuggestion(null);
      loadComplaints();
    } catch (err: any) {
      alert(err.message || "शिकायत दर्ज नहीं हो सकी। कृपया दोबारा प्रयास करें।");
    } finally {
      setSubmittingGrievance(false);
    }
  };

  // Quick Tracker
  const handleQuickTrack = async (targetRef: string) => {
    if (!targetRef.trim()) return;
    setTrackQuery(targetRef);
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedRecord(null);

    try {
      const res = await fetch(`/api/v1/complaints/track/${encodeURIComponent(targetRef.trim())}`);
      if (!res.ok) {
        throw new Error("इस संदर्भ संख्या की कोई शिकायत नहीं मिली। कृपया सही ID जांचें।");
      }
      const data = await res.json();
      setTrackedRecord(data);
      setShowTrackModal(true);
    } catch (err: any) {
      setTrackingError(err.message || "शिकायत खोजने में असमर्थ।");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    await handleQuickTrack(trackQuery.trim());
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Feedback & Reopen
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
        setFeedbackSuccess("धन्यवाद! आपकी संतुष्टि रेटिंग सफलतापूर्वक दर्ज हो गई है।");
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
        setReopenSuccess("शिकायत पुनः खोल दी गई है और पर्यवेक्षक को समीक्षा के लिए भेजी गई है।");
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

  const filteredComplaints = complaints.filter((c) => {
    if (statusTab === "ACTIVE") return c.status !== "RESOLVED";
    if (statusTab === "RESOLVED") return c.status === "RESOLVED";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900 pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Matches Screenshot exactly) */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/world" className="flex items-center gap-2.5 group select-none">
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

            <div className="h-7 w-px bg-slate-200 mx-2 hidden md:block" />

            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-slate-800 leading-tight">नागरिक जन-संवाद</span>
              <span className="text-xs font-extrabold text-teal-600 tracking-wider leading-tight">TRINETRA</span>
            </div>
          </div>

          {/* Center Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => {}}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] text-white shadow-sm font-semibold text-xs"
            >
              <Home className="w-4 h-4 text-white" />
              <div className="text-left leading-tight">
                <div className="text-[11px] font-bold">नागरिक पोर्टल</div>
                <div className="text-[9px] text-slate-300">Citizen Portal</div>
              </div>
            </button>

            <button
              onClick={() => setShowLodgeModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-xs transition-colors"
            >
              <FilePlus2 className="w-4 h-4 text-slate-500" />
              <div className="text-left leading-tight">
                <div className="text-[11px] font-bold text-slate-800">नई शिकायत दर्ज करें</div>
                <div className="text-[9px] text-slate-400">Lodge Grievance</div>
              </div>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById("tracking-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-xs transition-colors"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <div className="text-left leading-tight">
                <div className="text-[11px] font-bold text-slate-800">शिकायत की स्थिति देखें</div>
                <div className="text-[9px] text-slate-400">Track Status</div>
              </div>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setSpeechLang(speechLang === "hi-IN" ? "en-IN" : "hi-IN")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{speechLang === "hi-IN" ? "हिंदी" : "English"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {authUser?.display_name ? authUser.display_name.slice(0, 2).toUpperCase() : "RV"}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-900">
                  {authUser?.display_name || "Rohit Verma"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {authUser?.district_name ? `नागरिक, ${authUser.district_name}` : "नागरिक, गुरुग्राम"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* ========================================================================= */}
        {/* 2. HERO BANNER WITH HARYANA HERITAGE & HOTLINES (Matches Screenshot) */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-blue-50/40 border border-blue-100 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
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

          {/* Left Hero Content */}
          <div className="space-y-3 z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100/90 text-blue-700 border border-blue-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>हरियाणा नागरिक सेवाएं • TRINETRA</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              नमस्ते! <span className="text-blue-600">नागरिक शिकायत निवारण</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              सड़क, पानी, बिजली या सीवर जैसी किसी भी नागरिक समस्या को 1-क्लिक में दर्ज करें। आपकी शिकायत संबंधित विभाग तक पहुँचाई जाएगी और आप इसकी स्थिति आसानी से देख सकते हैं।
            </p>

            {/* Actions & Hotlines Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Primary Action Button */}
              <button
                onClick={() => setShowLodgeModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all transform active:scale-95"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>नई शिकायत दर्ज करें</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Voice Action Button */}
              <button
                onClick={() => {
                  setShowLodgeModal(true);
                  setTimeout(() => startVoiceInput(), 450);
                }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 shadow-2xs transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-slate-900">बोलकर बताएं</div>
                  <div className="text-[10px] text-slate-500 font-medium">अपनी समस्या आवाज में बताएं</div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Emergency Cards */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 z-10 shrink-0 w-full lg:w-auto">
            {/* 112 Hotline */}
            <a
              href="tel:112"
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] hover:bg-rose-100/70 transition-all text-left shadow-2xs min-w-[210px]"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-rose-600 leading-tight">आपातकाल</div>
                <div className="text-xl font-black text-rose-950 tracking-tight leading-tight">112</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight">तुरंत सहायता के लिए कॉल करें</div>
              </div>
            </a>

            {/* 1070 Disaster Hotline */}
            <a
              href="tel:1070"
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] hover:bg-amber-100/70 transition-all text-left shadow-2xs min-w-[210px]"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-700 leading-tight">आपदा नियंत्रण कक्ष</div>
                <div className="text-xl font-black text-amber-950 tracking-tight leading-tight">1070</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight">प्राकृतिक आपदा की स्थिति में संपर्क करें</div>
              </div>
            </a>
          </div>
        </div>

        {/* Success Banner when complaint is filed */}
        {lodgeSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-sm text-emerald-950">
                  शिकायत सफलतापूर्वक दर्ज हो गई!
                </span>
              </div>
              <p className="text-xs text-slate-600">
                संदर्भ संख्या (Reference ID):{" "}
                <button
                  onClick={() => handleCopyId(lodgeSuccess.tracking_id)}
                  className="inline-flex items-center gap-1 font-mono text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-200 transition-colors"
                >
                  <span>{lodgeSuccess.tracking_id}</span>
                  <Copy className="w-3 h-3" />
                  {copiedId === lodgeSuccess.tracking_id && <span className="text-[10px] text-emerald-700">कॉपी हुआ</span>}
                </button>
              </p>
              <p className="text-[11px] text-slate-500">
                विभाग: <strong className="text-slate-800">{lodgeSuccess.department_name || lodgeSuccess.department_id}</strong> • संबंधित टीम को सूचित किया गया है।
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/portal/department?department_id=${lodgeSuccess.department_id || "ALL"}&tracking_id=${lodgeSuccess.tracking_id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-100" />
                <span>🏢 विभाग पोर्टल पर देखें →</span>
              </Link>
              <button
                onClick={() => {
                  setTrackQuery(lodgeSuccess.tracking_id);
                  handleQuickTrack(lodgeSuccess.tracking_id);
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                स्थिति जांचें (Track)
              </button>
              <button
                onClick={() => setLodgeSuccess(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Feedback / Reopen Notice banners */}
        {feedbackSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{feedbackSuccess}</span>
            </div>
            <button onClick={() => setFeedbackSuccess(null)} className="text-emerald-700 font-bold hover:text-emerald-950">✕</button>
          </div>
        )}
        {reopenSuccess && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>{reopenSuccess}</span>
            </div>
            <button onClick={() => setReopenSuccess(null)} className="text-amber-700 font-bold hover:text-amber-950">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. COMMON ISSUES (1-CLICK SELECTION) (Matches Screenshot) */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                सामान्य समस्याएं (1-क्लिक में चुनें)
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">अपनी समस्या का प्रकार चुनें</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className="bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all rounded-2xl p-4 text-left group flex flex-col justify-between active:scale-98 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${p.badgeColor}`}>
                    {p.iconType === "water" && <Droplets className="w-5 h-5 text-blue-600" />}
                    {p.iconType === "zap" && <Zap className="w-5 h-5 text-amber-600" />}
                    {p.iconType === "road" && (
                      <span className="font-black text-base text-slate-700">☲</span>
                    )}
                    {p.iconType === "pipe" && (
                      <span className="font-black text-base text-sky-600">🚰</span>
                    )}
                    {p.iconType === "trash" && (
                      <span className="font-black text-base text-emerald-600">🗑️</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {p.label}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">{p.sub}</p>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-1 leading-snug font-normal">
                    {p.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. TRACK GRIEVANCE STATUS BAR (Matches Screenshot) */}
        {/* ========================================================================= */}
        <section
          id="tracking-section"
          className="rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                शिकायत की स्थिति जानें (Track Grievance Status)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                अपनी शिकायत की वर्तमान स्थिति जानने के लिए शिकायत संख्या दर्ज करें।
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 w-full md:w-auto">
            <button
              onClick={() => {
                setTrackQuery("TRN-2026-GUR001");
                handleQuickTrack("TRN-2026-GUR001");
              }}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 self-end"
            >
              <span>नमूना आईडी देखें (Demo ID)</span>
              <span className="w-3.5 h-3.5 rounded-full border border-blue-400 flex items-center justify-center text-[9px] font-bold">i</span>
            </button>

            <form onSubmit={handleTrackSearch} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="उदाहरण: TRN-2026-GUR001"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={trackingLoading || !trackQuery.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all shrink-0 active:scale-95"
              >
                <span>{trackingLoading ? "जांच रहे हैं..." : "स्थिति देखें"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>

        {trackingError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{trackingError}</span>
            <button onClick={() => setTrackingError(null)} className="text-rose-600 font-bold">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. MY GRIEVANCES TABLE (Matches Screenshot exactly) */}
        {/* ========================================================================= */}
        <section className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {/* Table Header Row */}
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  मेरी दर्ज शिकायतें (My Grievances)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  आपके द्वारा दर्ज की गई शिकायतों की सूची और उनकी वर्तमान स्थिति
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setStatusTab("ALL")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    statusTab === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  सभी
                </button>
                <button
                  onClick={() => setStatusTab("ACTIVE")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    statusTab === "ACTIVE" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  सक्रिय
                </button>
                <button
                  onClick={() => setStatusTab("RESOLVED")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    statusTab === "RESOLVED" ? "bg-white text-emerald-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  समाधान
                </button>
              </div>

              <button
                onClick={() => setStatusTab("ALL")}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <span>सभी देखें</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                <span>शिकायतें लोड हो रही हैं...</span>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <p className="font-semibold text-slate-700">कोई शिकायत नहीं मिली</p>
                <button
                  onClick={() => setShowLodgeModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  + नई शिकायत दर्ज करें
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">शिकायत संख्या</th>
                    <th className="py-3 px-5">समस्या का प्रकार</th>
                    <th className="py-3 px-5">स्थान</th>
                    <th className="py-3 px-5">स्थिति</th>
                    <th className="py-3 px-5">दर्ज की गई तारीख</th>
                    <th className="py-3 px-5 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((c) => {
                    const catInfo = getCategoryDisplay(c.category);
                    const statusInfo = getStatusBadge(c.status);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* ID */}
                        <td className="py-4 px-5">
                          <button
                            onClick={() => {
                              handleCopyId(c.tracking_id);
                              handleQuickTrack(c.tracking_id);
                            }}
                            className="font-mono font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1.5"
                          >
                            <span>{c.tracking_id}</span>
                            <Copy className="w-3 h-3 text-slate-400 hover:text-blue-600" />
                          </button>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{catInfo.icon}</span>
                            <span className="font-bold text-slate-800">{catInfo.label}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-slate-600 max-w-xs truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{c.address || `${c.district_name || c.district_id}, हरियाणा`}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg}`}>
                            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5 text-slate-500 font-medium">
                          {formatHindiDate(c.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setTrackQuery(c.tracking_id);
                                handleQuickTrack(c.tracking_id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                            >
                              <span>विवरण देखें</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button
                              onClick={() => {
                                setTrackQuery(c.tracking_id);
                                handleQuickTrack(c.tracking_id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 6. TRACK DETAILS MODAL */}
      {/* ========================================================================= */}
      {showTrackModal && trackedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-800">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-slate-900">
                      {trackedRecord.tracking_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {trackedRecord.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {trackedRecord.district_name || trackedRecord.district_id} • {trackedRecord.department_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTrackModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{trackedRecord.title}</h4>
                <p className="text-slate-600 leading-relaxed">{trackedRecord.description}</p>
              </div>

              {/* Status Milestone Tracker */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  समाधान चरण (Resolution Milestones)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {trackedRecord.milestones && trackedRecord.milestones.length > 0 ? (
                    trackedRecord.milestones.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          m.completed
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            m.completed ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate">{m.label}</p>
                          <p className="text-[10px] text-slate-400">{m.actor_label}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-white text-xs text-slate-500 col-span-full border border-slate-200">
                      शिकायत संबंधित विभाग को आवंटित कर दी गई है। फील्ड टीम शीघ्र निवारण करेगी।
                    </div>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200 bg-white">
                <div>
                  <span className="text-slate-400">स्थान: </span>
                  <strong className="text-slate-800">{trackedRecord.address}</strong>
                </div>
                <div>
                  <span className="text-slate-400">अनुमानित समय: </span>
                  <strong className="text-slate-800">{trackedRecord.estimated_resolution || "24-48 घंटे"}</strong>
                </div>
                {trackedRecord.assigned_officer_name && (
                  <div>
                    <span className="text-slate-400">जिम्मेदार अधिकारी: </span>
                    <strong className="text-blue-600">{trackedRecord.assigned_officer_name}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">प्राथमिकता: </span>
                  <strong className="text-amber-600">{trackedRecord.priority || "सामान्य"}</strong>
                </div>
              </div>

              {/* Resolution Proof */}
              {trackedRecord.resolution_proof && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>कार्य पूर्ण होने का प्रमाण (Resolution Proof)</span>
                    </div>
                  </div>
                  {trackedRecord.resolution_proof.field_note && (
                    <p className="text-slate-600 italic">&quot;{trackedRecord.resolution_proof.field_note}&quot;</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {trackedRecord.resolution_proof.before_photo && (
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">कार्य से पहले:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={trackedRecord.resolution_proof.before_photo}
                          alt="Before"
                          className="w-full h-24 object-cover rounded-lg border border-slate-200"
                        />
                      </div>
                    )}
                    {trackedRecord.resolution_proof.after_photo && (
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold">समाधान के बाद:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={trackedRecord.resolution_proof.after_photo}
                          alt="After"
                          className="w-full h-24 object-cover rounded-lg border border-emerald-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              {trackedRecord.status === "RESOLVED" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFeedbackComplaintId(trackedRecord.id);
                      setShowTrackModal(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xs hover:bg-emerald-700"
                  >
                    ★ रेटिंग दें
                  </button>
                  <button
                    onClick={() => {
                      setReopenComplaintId(trackedRecord.id);
                      setShowTrackModal(false);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100"
                  >
                    दोबारा खोलें
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-500">स्थिति नियमित रूप से अपडेट की जाती है।</span>
              )}
              <button
                onClick={() => setShowTrackModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LODGE COMPLAINT MODAL (Preserving 100% functionality with clean aesthetic) */}
      {/* ========================================================================= */}
      {showLodgeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white border-t sm:border border-slate-200 w-full sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    नई नागरिक शिकायत दर्ज करें
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    बोलकर या लिखकर बताएं — AI सही विभाग में भेजेगा
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopVoiceInput();
                  setShowLodgeModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleLodgeGrievance} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Voice input card */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span>आवाज़ से बोलकर बताएं (Voice Input)</span>
                  </span>

                  <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSpeechLang("hi-IN")}
                      className={`px-2.5 py-0.5 rounded font-bold transition-colors ${
                        speechLang === "hi-IN" ? "bg-blue-600 text-white" : "text-slate-600"
                      }`}
                    >
                      हिंदी
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeechLang("en-IN")}
                      className={`px-2.5 py-0.5 rounded font-bold transition-colors ${
                        speechLang === "en-IN" ? "bg-blue-600 text-white" : "text-slate-600"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {isListening ? (
                  <button
                    type="button"
                    onClick={stopVoiceInput}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 animate-pulse shadow-xs"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>सुन रहे हैं... रिकॉर्डिंग रोकें (Stop)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-2xs"
                  >
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span>🎙️ माइक दबाकर अपनी समस्या बोलें</span>
                  </button>
                )}

                {speechNotice && (
                  <p className="text-[11px] text-blue-700 font-medium text-center animate-pulse">
                    {speechNotice}
                  </p>
                )}
              </div>

              {/* Title input */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  समस्या का शीर्षक (Title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="जैसे: मुख्य सड़क पर 3 फीट जलभराव या बिजली का तार टूटा"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs sm:text-sm font-medium"
                  required
                />
              </div>

              {/* Description input */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  विस्तृत विवरण (Details) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  rows={3}
                  placeholder="समस्या का ब्यौरा दें: स्थिति कितनी गंभीर है, गाड़ियां फंसी हैं या नहीं..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs sm:text-sm leading-relaxed"
                  required
                />
              </div>

              {/* Location details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>स्थान (Location)</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={gpsDetecting}
                    className="px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Navigation className={`w-3 h-3 ${gpsDetecting ? "animate-spin" : ""}`} />
                    <span>{gpsDetecting ? "खोज रहे हैं..." : "📍 मेरा स्थान लें (GPS)"}</span>
                  </button>
                </div>

                {gpsDetectedBadge && (
                  <p className="text-[11px] text-blue-700 font-medium">✓ {gpsDetectedBadge}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">हरियाणा जिला</label>
                    <select
                      value={districtId}
                      onChange={(e) => {
                        const newDistId = e.target.value;
                        setDistrictId(newDistId);
                        const dist = HARYANA_DISTRICTS.find((d) => d.id === newDistId);
                        if (dist) {
                          setLatitude(dist.lat);
                          setLongitude(dist.lng);
                          setGpsDetectedBadge(`स्थान: ${dist.name} (${dist.lat.toFixed(3)}° N, ${dist.lng.toFixed(3)}° E)`);
                        }
                        triggerAiAnalysis(title, description, newDistId);
                      }}
                      className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium outline-none"
                    >
                      {HARYANA_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">संबंधित विभाग</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium outline-none"
                    >
                      {HARYANA_DEPARTMENTS.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">सटीक पता / लैंडमार्क</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="जैसे: सुभाष चौक, सोहना रोड, सेक्टर 38"
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">फोटो या वीडियो जोड़ें (वैकल्पिक)</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex-1 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center gap-1.5 font-bold text-slate-700"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>फोटो जोड़ें</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex-1 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center gap-1.5 font-bold text-slate-700"
                  >
                    <Video className="w-4 h-4 text-amber-600" />
                    <span>वीडियो जोड़ें</span>
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "image")}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "video")}
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachments.map((att) => (
                      <div key={att.id} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.url}
                          alt="Attachment"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLodgeModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submittingGrievance || !title.trim() || !description.trim()}
                  className="flex-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                >
                  {submittingGrievance ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>दर्ज हो रही है...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>शिकायत सबमिट करें</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. FEEDBACK & REOPEN MODALS */}
      {/* ========================================================================= */}
      {feedbackComplaintId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">समाधान संतुष्टि रेटिंग (Rating & Feedback)</h3>
            <p className="text-xs text-slate-500">समाधान कार्य से आप कितने संतुष्ट हैं? (1 से 5 स्टार):</p>
            <div className="flex gap-2 text-2xl justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  className={`transition-transform hover:scale-120 ${
                    feedbackRating >= star ? "text-amber-400" : "text-slate-300"
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
              placeholder="अपनी टिप्पणी या अनुभव लिखें (वैकल्पिक)..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFeedbackComplaintId(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                रद्द करें
              </button>
              <button
                onClick={() => handleSendFeedback(feedbackComplaintId)}
                disabled={submittingAction}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
              >
                सबमिट करें
              </button>
            </div>
          </div>
        </div>
      )}

      {reopenComplaintId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-rose-700">शिकायत दोबारा खोलें (Reopen Grievance)</h3>
            <p className="text-xs text-slate-500">कृपया कारण बताएं कि आप कार्य से असंतुष्ट क्यों हैं:</p>
            <textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="जैसे गड्ढे की मरम्मत 2 दिन में फिर टूट गई या पानी की निकासी अभी भी रुकी है..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReopenComplaintId(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                रद्द करें
              </button>
              <button
                onClick={() => handleReopen(reopenComplaintId)}
                disabled={submittingAction || !reopenReason.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                पुनः खोलें (Reopen)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
