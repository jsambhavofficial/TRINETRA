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
  Play,
  Volume2,
  PhoneCall,
  ExternalLink,
  Copy,
  Layers,
} from "lucide-react";
import {
  HARYANA_DISTRICTS,
  HARYANA_DEPARTMENTS,
  COMPLAINT_CATEGORIES,
  findNearestHaryanaDistrict,
} from "@/lib/haryana";

const QUICK_PRESETS = [
  {
    id: "waterlogging",
    icon: "🌊",
    label: "जलभराव",
    sub: "Waterlogging",
    title: "Severe Underpass & Road Waterlogging",
    desc: "अंडरपास और मुख्य सड़क पर भारी जलभराव हो गया है। गाड़ियां फंसी हैं और यातायात पूरी तरह ठप है।",
    category: "URBAN_FLOODING",
    deptId: "DEPT-PWD",
  },
  {
    id: "electric",
    icon: "⚡",
    label: "बिजली तार / फॉल्ट",
    sub: "Live Wire / Power",
    title: "Broken Live Electric Wire Sparking on Road",
    desc: "सड़क पर बिजली का तार टूटकर लटक रहा है और चिंगारी निकल रही है। तुरंत बिजली आपूर्ति बंद कर तार ठीक करें।",
    category: "ELECTRICAL_HAZARD",
    deptId: "DEPT-POWER",
  },
  {
    id: "pothole",
    icon: "🕳️",
    label: "सड़क पर गड्ढा",
    sub: "Dangerous Pothole",
    title: "Deep Crater Pothole on Main Road",
    desc: "मुख्य मार्ग पर गहरा जानलेवा गड्ढा है जिससे दोपहिया वाहन गिर रहे हैं। तुरंत पेचवर्क और मरम्मत की आवश्यकता है।",
    category: "ROAD_BLOCKAGE",
    deptId: "DEPT-PWD",
  },
  {
    id: "sewage",
    icon: "🚰",
    label: "सीवर चोक / रिसाव",
    sub: "Sewer Overflow",
    title: "Sewage Pipeline Burst & Road Overflow",
    desc: "सीवर लाइन बंद होने से सड़क पर गंदा बदबूदार पानी बह रहा है। तुरंत सीवर सफाई मशीन भेजें।",
    category: "SEWERAGE_OVERFLOW",
    deptId: "DEPT-PWD",
  },
  {
    id: "garbage",
    icon: "🦟",
    label: "कचरा व गंदगी",
    sub: "Garbage Dump",
    title: "Unattended Garbage Dump & Health Hazard",
    desc: "कॉलोनी के मुख्य मोड़ पर कई दिनों से कचरा नहीं उठाया गया है। बदबू और मच्छरों से बीमारी का खतरा है।",
    category: "HEALTH_HAZARD",
    deptId: "DEPT-HEALTH",
  },
];

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

      const res = await fetch("/api/v1/complaints", { headers });
      if (res.ok) {
        const allData = await res.json();
        let myIds: string[] = [];
        try {
          myIds = JSON.parse(localStorage.getItem("trinetra_my_grievances") || "[]");
        } catch (e) {}

        const myFiltered = allData.filter((c: any) => {
          if (authUser && (c.citizen_id === authUser.id || (authUser.phone && c.citizen_phone === authUser.phone))) {
            return true;
          }
          if (myIds.includes(c.tracking_id) || myIds.includes(c.id)) {
            return true;
          }
          return false;
        });
        setComplaints(myFiltered);
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
    setDescription(p.desc);
    setCategory(p.category);
    setDepartmentId(p.deptId);
    setShowLodgeModal(true);
    triggerAiAnalysis(p.title, p.desc, districtId);
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
        setSpeechNotice(
          speechLang === "hi-IN"
            ? "🎙️ सुन रहे हैं... कृपया अपनी समस्या बोलें"
            : "🎙️ Listening... Please speak your grievance"
        );
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript.trim()) {
          setDescription(transcript);
          if (!title.trim() || title.length < 5) {
            setTitle(transcript.slice(0, 50));
          }
          triggerAiAnalysis(title || transcript.slice(0, 40), transcript, districtId);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
        setSpeechNotice("आवाज़ पहचानने में समस्या आई। पुनः प्रयास करें।");
        setTimeout(() => setSpeechNotice(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("SpeechRecognition error:", err);
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

  // Media Upload (Photo/Video)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mediaType: "IMAGE" | "VIDEO") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            uri: result,
            filename: file.name,
            mime: file.type || (mediaType === "IMAGE" ? "image/jpeg" : "video/mp4"),
            type: mediaType,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // GPS Auto-Detect Location
  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("GPS आपके ब्राउज़र में उपलब्ध नहीं है।");
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

  // Filter complaints based on tab
  const filteredComplaints = complaints.filter((c) => {
    if (statusTab === "ACTIVE") return c.status !== "RESOLVED";
    if (statusTab === "RESOLVED") return c.status === "RESOLVED";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 sm:pb-8 selection:bg-emerald-500/30 selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ========================================================================= */}
        {/* 1. SIMPLE HERO BANNER (Clean, welcoming, mobile-first) */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>हरियाणा जन-संवाद पोर्टल • Citizen Services</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              नमस्ते! नागरिक शिकायत निवारण
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              सड़क, पानी, बिजली या सीवर जैसी किसी भी नागरिक समस्या को 1-क्लिक में दर्ज करें। AI द्वारा तुरंत सही विभाग को प्रेषित किया जाएगा।
            </p>

            {/* Helpline quick buttons */}
            <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px]">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors font-semibold"
              >
                <PhoneCall className="w-3 h-3" />
                <span>आपातकाल: 112</span>
              </a>
              <a
                href="tel:1070"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors font-semibold"
              >
                <PhoneCall className="w-3 h-3" />
                <span>आपदा नियंत्रण: 1070</span>
              </a>
              {authUser && (
                <span className="text-slate-400 hidden sm:inline">
                  • लॉगिन: <strong className="text-slate-200">{authUser.display_name}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => setShowLodgeModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/15 transition-all active:scale-95"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>+ नई शिकायत दर्ज करें</span>
            </button>
            <button
              onClick={() => {
                setShowLodgeModal(true);
                setTimeout(() => startVoiceInput(), 400);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>बोलकर बताएं</span>
            </button>
          </div>
        </div>

        {/* Success Banner when complaint is filed */}
        {lodgeSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold text-sm text-white">
                  शिकायत सफलतापूर्वक दर्ज हो गई!
                </span>
              </div>
              <p className="text-xs text-slate-300">
                संदर्भ संख्या (Reference ID):{" "}
                <button
                  onClick={() => handleCopyId(lodgeSuccess.tracking_id)}
                  className="inline-flex items-center gap-1 font-mono text-emerald-300 font-bold bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-800/40 transition-colors"
                >
                  <span>{lodgeSuccess.tracking_id}</span>
                  <Copy className="w-3 h-3" />
                  {copiedId === lodgeSuccess.tracking_id && <span className="text-[10px] text-emerald-400">कॉपी हुआ</span>}
                </button>
              </p>
              <p className="text-[11px] text-slate-400">
                विभाग: <strong className="text-slate-200">{lodgeSuccess.department_name || lodgeSuccess.department_id}</strong> • फील्ड टीम को सूचित किया गया है।
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/portal/department?department_id=${lodgeSuccess.department_id || "ALL"}&tracking_id=${lodgeSuccess.tracking_id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-200" />
                <span>🏢 विभाग पोर्टल पर लाइव देखें →</span>
              </Link>
              <button
                onClick={() => {
                  setTrackQuery(lodgeSuccess.tracking_id);
                  handleQuickTrack(lodgeSuccess.tracking_id);
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
              >
                स्थिति जांचें (Track)
              </button>
              <button
                onClick={() => setLodgeSuccess(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Notice banners */}
        {feedbackSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span>{feedbackSuccess}</span>
            <button onClick={() => setFeedbackSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}
        {reopenSuccess && (
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <span>{reopenSuccess}</span>
            <button onClick={() => setReopenSuccess(null)} className="text-amber-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. QUICK 1-TAP ISSUE PRESETS (Mobile-friendly big tap cards) */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>सामान्य समस्याएं (1-क्लिक में चुनें)</span>
            </h2>
            <span className="text-[11px] text-slate-500">त्वरित समाधान हेतु</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition-all text-left group flex flex-col justify-between space-y-2 active:scale-95 shadow-sm min-h-[82px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[10px] font-bold text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    चुनें →
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300 leading-snug">
                    {p.label}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {p.sub}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SIMPLE COMPLAINT TRACKER */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <span>शिकायत की स्थिति जांचें (Track Grievance Status)</span>
            </h2>
            <button
              onClick={() => handleQuickTrack("TRN-2026-6B21E2")}
              className="text-[11px] text-emerald-400 hover:underline hidden sm:inline"
            >
              नमूना आईडी देखें (Demo ID)
            </button>
          </div>

          <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="संदर्भ संख्या दर्ज करें (जैसे TRN-2026-GUR001)"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={trackingLoading || !trackQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>{trackingLoading ? "जांच हो रही है..." : "स्थिति देखें"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {trackingError && (
            <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg">
              {trackingError}
            </p>
          )}

          {/* Tracked Record Result Card */}
          {trackedRecord && (
            <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {trackedRecord.tracking_id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {trackedRecord.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {trackedRecord.district_name || trackedRecord.district_id}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{trackedRecord.title}</h3>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded border ${
                      trackedRecord.status === "RESOLVED"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : trackedRecord.status === "IN_PROGRESS"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-sky-500/10 border-sky-500/30 text-sky-400"
                    }`}
                  >
                    {trackedRecord.status === "RESOLVED"
                      ? "✓ समाधान हो गया"
                      : trackedRecord.status === "IN_PROGRESS"
                      ? "⏳ कार्य प्रगति पर"
                      : "📝 दर्ज / समीक्षा जारी"}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    विभाग: {trackedRecord.department_name}
                  </span>
                </div>
              </div>

              {/* Friendly 4-Step Milestone Progression */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  समाधान चरण (Resolution Progress)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {trackedRecord.milestones && trackedRecord.milestones.length > 0 ? (
                    trackedRecord.milestones.map((m: any, i: number) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          m.completed
                            ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-500"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            m.completed ? "text-emerald-400" : "text-slate-600"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{m.label}</p>
                          <p className="text-[10px] text-slate-400">{m.actor_label}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-400 col-span-full">
                      शिकायत संबंधित विभाग को आवंटित कर दी गई है। फील्ड टीम शीघ्र निवारण करेगी।
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-1">
                <span>स्थान: <strong className="text-slate-300">{trackedRecord.address}</strong></span>
                <span className="font-mono text-slate-400">
                  अनुमानित समय: {trackedRecord.estimated_resolution || "24-48 घंटे"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. MY COMPLAINTS LIST (Clean, clear cards with status tabs) */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>मेरी दर्ज शिकायतें (My Grievances)</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {complaints.length}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                आपके द्वारा दर्ज की गई सभी समस्याओं की स्थिति
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setStatusTab("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusTab === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                सभी ({complaints.length})
              </button>
              <button
                onClick={() => setStatusTab("ACTIVE")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusTab === "ACTIVE" ? "bg-amber-500/20 text-amber-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                सक्रिय ({complaints.filter((c) => c.status !== "RESOLVED").length})
              </button>
              <button
                onClick={() => setStatusTab("RESOLVED")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusTab === "RESOLVED" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                समाधान ({complaints.filter((c) => c.status === "RESOLVED").length})
              </button>
              <button
                onClick={loadComplaints}
                className="p-1 rounded-lg text-slate-400 hover:text-white ml-1"
                title="रिफ्रेश करें"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
              <span>शिकायतें लोड हो रही हैं...</span>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto" />
              <p className="text-sm font-bold text-slate-200">
                {statusTab === "RESOLVED"
                  ? "कोई समाधानित शिकायत नहीं है।"
                  : statusTab === "ACTIVE"
                  ? "कोई सक्रिय शिकायत लंबित नहीं है।"
                  : "आपने अभी तक कोई शिकायत दर्ज नहीं की है।"}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                सड़क, पानी, सीवर या बिजली की किसी भी समस्या को दर्ज करने के लिए नीचे दिया गया बटन दबाएं।
              </p>
              <button
                onClick={() => setShowLodgeModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>+ नई शिकायत दर्ज करें</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((c) => {
                const isResolved = c.status === "RESOLVED";
                const hasProof = c.resolution_proof && (c.resolution_proof.before_photo || c.resolution_proof.after_photo);

                return (
                  <div
                    key={c.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleCopyId(c.tracking_id)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-400 hover:underline"
                            title="आईडी कॉपी करें"
                          >
                            <span>{c.tracking_id}</span>
                            <Copy className="w-3 h-3 text-emerald-500" />
                            {copiedId === c.tracking_id && <span className="text-[10px] text-emerald-400">कॉपी</span>}
                          </button>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {c.category}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {c.district_name || c.district_id}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{c.title}</h3>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded border ${
                            c.status === "RESOLVED"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : c.status === "IN_PROGRESS"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : c.status === "REOPENED"
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                              : "bg-sky-500/10 border-sky-500/30 text-sky-400"
                          }`}
                        >
                          {c.status === "RESOLVED"
                            ? "✓ समाधान हो गया"
                            : c.status === "IN_PROGRESS"
                            ? "⏳ कार्य प्रगति पर"
                            : c.status === "REOPENED"
                            ? "🔄 पुनः खुला"
                            : "📝 दर्ज / समीक्षा"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400">
                      <div>
                        <span>विभाग: </span>
                        <strong className="text-slate-200">{c.department_name || c.department_id}</strong>
                      </div>
                      <div>
                        <span>स्थान: </span>
                        <span className="text-slate-300 truncate">{c.address}</span>
                      </div>
                      <div>
                        <span>तारीख: </span>
                        <span className="text-slate-400">{new Date(c.created_at).toLocaleDateString("hi-IN")}</span>
                      </div>
                      {c.assigned_officer_name && (
                        <div>
                          <span>अधिकारी: </span>
                          <strong className="text-emerald-400">{c.assigned_officer_name}</strong>
                        </div>
                      )}
                    </div>

                    {/* Resolution Proof Card (Before / After Photo Proof) */}
                    {hasProof && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>कार्य पूर्ण होने का प्रमाण (Resolution Proof)</span>
                          </div>
                          {c.validation_status === "APPROVED" && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              ✓ सत्यापित
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
                              <span className="text-[10px] text-slate-400">कार्य से पहले:</span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.resolution_proof.before_photo}
                                alt="Before Repair"
                                className="w-full h-24 object-cover rounded-lg border border-slate-800"
                              />
                            </div>
                          )}
                          {c.resolution_proof.after_photo && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-emerald-400 font-bold">समाधान के बाद:</span>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.resolution_proof.after_photo}
                                alt="After Repair"
                                className="w-full h-24 object-cover rounded-lg border border-emerald-500/40"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Citizen Action Bar: Feedback or Reopen */}
                    {isResolved && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-xs text-slate-400">
                          {c.feedback_rating ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              ★ रेटिंग दी गई: {c.feedback_rating}/5 {c.feedback_comments && `("${c.feedback_comments}")`}
                            </span>
                          ) : (
                            <button
                              onClick={() => setFeedbackComplaintId(c.id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>रेटिंग व प्रतिक्रिया दें</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setReopenComplaintId(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>संतुष्ट नहीं? दोबारा खोलें</span>
                        </button>
                      </div>
                    )}

                    {/* Feedback Form Drawer */}
                    {feedbackComplaintId === c.id && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                        <span className="font-bold text-white block">समाधान से कितने संतुष्ट हैं? (1 से 5 स्टार):</span>
                        <div className="flex gap-1.5 text-base">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              className={`p-1 transition-transform hover:scale-110 ${
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
                          placeholder="अपनी टिप्पणी लिखें (वैकल्पिक)..."
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setFeedbackComplaintId(null)}
                            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300"
                          >
                            रद्द करें
                          </button>
                          <button
                            onClick={() => handleSendFeedback(c.id)}
                            disabled={submittingAction}
                            className="px-3.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                          >
                            रेटिंग सबमिट करें
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reopen Form Drawer */}
                    {reopenComplaintId === c.id && (
                      <div className="mt-2 p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2 text-xs">
                        <span className="font-bold text-rose-300 block">दोबारा खोलने का कारण बताएं:</span>
                        <input
                          type="text"
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="जैसे गड्ढे की मरम्मत 2 दिन में फिर टूट गई..."
                          className="w-full p-2 rounded-lg bg-slate-950 border border-rose-900/40 text-white outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setReopenComplaintId(null)}
                            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300"
                          >
                            रद्द करें
                          </button>
                          <button
                            onClick={() => handleReopen(c.id)}
                            disabled={submittingAction || !reopenReason.trim()}
                            className="px-3.5 py-1 rounded-lg bg-rose-600 text-white font-bold"
                          >
                            पुनः खोलें (Reopen)
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
      {/* 5. MOBILE STICKY BOTTOM ACTION BAR (Thumb friendly on mobile phones) */}
      {/* ========================================================================= */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40">
        <div className="p-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 shadow-2xl flex items-center gap-2">
          <button
            onClick={() => setShowLodgeModal(true)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>+ शिकायत दर्ज करें</span>
          </button>
          <button
            onClick={() => {
              setShowLodgeModal(true);
              setTimeout(() => startVoiceInput(), 400);
            }}
            className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
            title="बोलकर बताएं"
          >
            <Mic className="w-4 h-4" />
            <span>बोलें</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. LODGE NEW GRIEVANCE MODAL (Mobile-first bottom sheet/dialog) */}
      {/* ========================================================================= */}
      {showLodgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border-t sm:border border-slate-800 w-full sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* STICKY HEADER */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>नई नागरिक शिकायत दर्ज करें</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
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
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                title="बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form id="lodge-form" onSubmit={handleLodgeGrievance} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* VOICE INPUT PROMINENT CARD */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span>आवाज़ से बोलकर बताएं (Voice Input)</span>
                  </span>

                  <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSpeechLang("hi-IN")}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        speechLang === "hi-IN" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                      }`}
                    >
                      हिंदी
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeechLang("en-IN")}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        speechLang === "en-IN" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
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
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 animate-pulse shadow-md transition-all"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>सुन रहे हैं... रिकॉर्डिंग रोकें (Stop)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Mic className="w-4 h-4" />
                    <span>🎙️ माइक दबाकर अपनी समस्या बोलें</span>
                  </button>
                )}

                {speechNotice && (
                  <p className="text-[11px] text-emerald-300 font-medium text-center animate-pulse">
                    {speechNotice}
                  </p>
                )}
              </div>

              {/* QUICK CHIPS */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  त्वरित श्रेणी चुनें (Quick Issue):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setTitle(p.title);
                        setDescription(p.desc);
                        setCategory(p.category);
                        setDepartmentId(p.deptId);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all ${
                        category === p.category
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  समस्या का शीर्षक (Title) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="जैसे: मुख्य सड़क पर 3 फीट जलभराव या बिजली का तार टूटा"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-emerald-500 text-xs sm:text-sm font-medium"
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  विस्तृत विवरण (Details) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  rows={3}
                  placeholder="समस्या का ब्यौरा दें: स्थिति कितनी गंभीर है, गाड़ियां फंसी हैं या नहीं..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-emerald-500 text-xs sm:text-sm leading-relaxed"
                  required
                />
              </div>

              {/* LOCATION DETAILS & GPS */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>स्थान (Location)</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={gpsDetecting}
                    className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Navigation className={`w-3 h-3 ${gpsDetecting ? "animate-spin" : ""}`} />
                    <span>{gpsDetecting ? "खोज रहे हैं..." : "📍 मेरा स्थान लें (GPS)"}</span>
                  </button>
                </div>

                {gpsDetectedBadge && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ {gpsDetectedBadge}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">हरियाणा जिला</label>
                    <select
                      value={districtId}
                      onChange={(e) => {
                        const newDistId = e.target.value;
                        setDistrictId(newDistId);
                        const dist = HARYANA_DISTRICTS.find((d) => d.id === newDistId);
                        if (dist) {
                          setLatitude(dist.lat);
                          setLongitude(dist.lng);
                          setGpsDetectedBadge(`स्थान: ${dist.name} (${dist.lat.toFixed(4)}° N, ${dist.lng.toFixed(4)}° E)`);
                        }
                        triggerAiAnalysis(title, description, newDistId);
                      }}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                    >
                      {HARYANA_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">सड़क / लैंडमार्क पता</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="जैसे सुभाष चौक, सेक्टर 38, मुख्य मोड़"
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-500 text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Exact GPS Coordinates Row */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-mono">Latitude (अक्षांश)</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={latitude || ""}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      placeholder="28.4595"
                      className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-mono">Longitude (देशांतर)</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={longitude || ""}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      placeholder="77.0266"
                      className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* MEDIA ATTACHMENTS (PHOTO / VIDEO) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>फोटो या वीडियो प्रमाण (वैकल्पिक)</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={photoInputRef}
                      onChange={(e) => handleFileUpload(e, "IMAGE")}
                      className="hidden"
                    />
                    <input
                      type="file"
                      accept="video/*"
                      ref={videoInputRef}
                      onChange={(e) => handleFileUpload(e, "VIDEO")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 text-[11px] font-bold flex items-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>+ फोटो</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" />
                      <span>+ वीडियो</span>
                    </button>
                  </div>
                </div>

                {attachments.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="relative group p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center overflow-hidden"
                      >
                        {att.type === "VIDEO" ? (
                          <div className="w-full h-16 bg-slate-950 rounded flex items-center justify-center relative">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={att.uri}
                            alt={att.filename}
                            className="w-full h-16 object-cover rounded bg-slate-950"
                          />
                        )}
                        <div className="w-full flex items-center justify-between mt-1 text-[10px] text-slate-400 px-1">
                          <span className="truncate max-w-[80px]">{att.filename}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="text-rose-400 hover:text-rose-300 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    घटना स्थल की फोटो या वीडियो जोड़ने से विभाग शीघ्र समाधान करता है।
                  </p>
                )}
              </div>

              {/* AI ROUTING NOTICE */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">
                    {aiAnalyzing
                      ? "AI द्वारा सही विभाग का निर्धारण हो रहा है..."
                      : `स्वतः प्रेषित: ${HARYANA_DEPARTMENTS.find((d) => d.id === departmentId)?.name || departmentId}`}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    शिकायत दर्ज होते ही संबंधित लाइन विभाग के कंट्रोल रूम में लाइव अलर्ट पहुंचेगा।
                  </p>
                </div>
              </div>

              {/* CITIZEN CONTACT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">आपका नाम (Citizen Name)</label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="जैसे: रोहित वर्मा"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">संपर्क मोबाइल (Mobile No.)</label>
                  <input
                    type="tel"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    placeholder="+91-98100-11223"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none text-xs"
                    required
                  />
                </div>
              </div>
            </form>

            {/* STICKY MODAL FOOTER */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2 shrink-0 z-10">
              <button
                type="button"
                onClick={() => {
                  stopVoiceInput();
                  setShowLodgeModal(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                form="lodge-form"
                disabled={submittingGrievance || !title.trim() || !description.trim()}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submittingGrievance ? "दर्ज हो रहा है..." : "शिकायत दर्ज करें"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
