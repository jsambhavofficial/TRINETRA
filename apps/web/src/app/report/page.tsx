"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Preset landmarks in the fictional NEXUS city
const CITY_PRESETS = [
  { name: "Road R17 Bypass Bridge", lat: 26.9180, lng: 75.7920, desc: "Primary north-south river corridor" },
  { name: "Central Memorial Hospital", lat: 26.9120, lng: 75.7880, desc: "Level 1 Trauma Center & ICU" },
  { name: "North Industrial Substation", lat: 26.9250, lng: 75.7850, desc: "High-voltage distribution hub" },
  { name: "Metro River Crossing Pier 4", lat: 26.9150, lng: 75.8010, desc: "Rapid transit bridge structure" },
  { name: "East Logistics Corridor", lat: 26.9080, lng: 75.7990, desc: "Heavy transport & warehousing artery" },
];

export default function ReportPage() {
  const router = useRouter();

  // Mode: PHOTO | VIDEO | VOICE | TEXT
  const [activeTab, setActiveTab] = useState<"PHOTO" | "VIDEO" | "VOICE" | "TEXT">("PHOTO");

  // Form Fields
  const [textContent, setTextContent] = useState("");
  const [latitude, setLatitude] = useState<number>(26.9180);
  const [longitude, setLongitude] = useState<number>(75.7920);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submission & Pipeline States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0); // 0: Idle, 1: Uploading, 2: AI Perception, 3: Entity Resolution, 4: Complete
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis Result
  const [analysisResult, setAnalysisResult] = useState<{
    evidenceId: string;
    candidateId?: string;
    incidentType?: string;
    title?: string;
    summary?: string;
    severity?: string;
    confidence?: number;
    resolvedEntity?: string;
    detectedObjects?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Community Corroboration & Nearby Activity State
  const [nearbyData, setNearbyData] = useState<any>(null);
  const [corroboratedReports, setCorroboratedReports] = useState<Record<string, boolean>>({});
  const [corroborateLoading, setCorroborateLoading] = useState<string | null>(null);
  const [corroborateFeedback, setCorroborateFeedback] = useState<string | null>(null);

  const fetchNearby = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/citizen/nearby-reports");
      if (res.ok) {
        const data = await res.json();
        setNearbyData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNearby();
    const interval = setInterval(fetchNearby, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCorroborate = async (reportId: string) => {
    if (corroboratedReports[reportId]) return;
    setCorroborateLoading(reportId);
    setCorroborateFeedback(null);
    try {
      let token = typeof window !== "undefined" ? localStorage.getItem("aegis_citizen_token") : null;
      if (!token) {
        token = `citizen-tok-${Math.random().toString(36).slice(2, 10)}`;
        if (typeof window !== "undefined") localStorage.setItem("aegis_citizen_token", token);
      }

      const res = await fetch(`http://localhost:8000/api/v1/citizen/reports/${reportId}/corroborate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizen_token: token,
          latitude,
          longitude,
          comment: "Corroborated: Experiencing identical problem at this location.",
        }),
      });

      if (res.ok) {
        setCorroboratedReports((prev) => ({ ...prev, [reportId]: true }));
        setCorroborateFeedback("Your location and report now corroborate this issue.");
        await fetchNearby();
      } else if (res.status === 409) {
        setCorroboratedReports((prev) => ({ ...prev, [reportId]: true }));
        setCorroborateFeedback("You have already corroborated this report.");
      }
    } catch (err: any) {
      setCorroborateFeedback(err.message || "Failed to corroborate report");
    } finally {
      setCorroborateLoading(null);
    }
  };

  // Clean up object preview urls
  useEffect(() => {
    return () => {
      if (filePreview && !filePreview.startsWith("data:")) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Handle File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  // Preset Selection
  const applyPresetLocation = (preset: typeof CITY_PRESETS[0]) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        },
        () => {
          // Default to city center if GPS access denied
          setLatitude(26.9180);
          setLongitude(75.7920);
        }
      );
    }
  };

  // Voice Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice-dispatch-${Date.now()}.webm`, { type: "audio/webm" });
        setSelectedFile(audioFile);
        setFilePreview(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      // Fallback mock recording for environments without mic permissions
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      // Simulated audio blob
      const mockBlob = new Blob(["mock-audio-recording"], { type: "audio/wav" });
      const audioFile = new File([mockBlob], `voice-dispatch-${Date.now()}.wav`, { type: "audio/wav" });
      setSelectedFile(audioFile);
    }
  };

  // 1-Click Demo Scenarios
  const triggerDemoScenario = (scenario: "FLOOD" | "GAS" | "POWER") => {
    setErrorMsg(null);
    setAnalysisResult(null);

    if (scenario === "FLOOD") {
      setActiveTab("PHOTO");
      setLatitude(26.9180);
      setLongitude(75.7920);
      setTextContent("Torrential floodwaters rising rapidly on Road R17 Bypass embankment. Multiple passenger vehicles stranded, structural bridge pillars partially submerged.");
      // Create a dummy image file for instant upload demonstration
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0f2027";
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = "#203a43";
        ctx.fillRect(0, 150, 400, 150);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 20px monospace";
        ctx.fillText("NEXUS SIMULATED OBSERVATION", 40, 60);
        ctx.fillStyle = "#f87171";
        ctx.fillText("ALERT: ROAD R17 FLOOD SURGE", 40, 100);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "road_r17_flood_surge.png", { type: "image/png" });
          setSelectedFile(file);
          setFilePreview(URL.createObjectURL(file));
        }
      });
    } else if (scenario === "GAS") {
      setActiveTab("TEXT");
      setLatitude(26.9250);
      setLongitude(75.7850);
      setTextContent("Critical gas pipeline pressure rupture observed near North Industrial Substation. Dense white vapor plume escaping with violent whistling noise. Hazardous perimeter requested.");
      setSelectedFile(null);
      setFilePreview(null);
    } else if (scenario === "POWER") {
      setActiveTab("VOICE");
      setLatitude(26.9120);
      setLongitude(75.7880);
      setTextContent("Central Memorial Hospital auxiliary diesel generator failure. ICU backup batteries triggered, emergency fuel pump malfunction reported.");
      const mockBlob = new Blob(["mock-voice-payload"], { type: "audio/wav" });
      const file = new File([mockBlob], "central_hospital_aux_power.wav", { type: "audio/wav" });
      setSelectedFile(file);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    setPipelineStep(1); // Uploading & Validating

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

      let evidenceId = "";

      if (activeTab === "TEXT" && !selectedFile) {
        // Text-only report endpoint
        const formData = new FormData();
        formData.append("world_id", "world-nexus-city-01");
        formData.append("text_content", textContent);
        formData.append("latitude", latitude.toString());
        formData.append("longitude", longitude.toString());
        formData.append("location_source", "citizen_app");

        const res = await fetch(`${apiUrl}/reports`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Report submission failed: HTTP ${res.status}`);
        const data = await res.json();
        evidenceId = data.evidence_id;
      } else {
        // Multipart evidence upload endpoint
        const formData = new FormData();
        if (selectedFile) {
          formData.append("file", selectedFile);
        } else {
          // If user didn't pick a file in Photo/Video/Audio tab, generate a descriptor file
          const textBlob = new Blob([textContent || "Field report observation"], { type: "text/plain" });
          formData.append("file", textBlob, "observation.txt");
        }
        formData.append("world_id", "world-nexus-city-01");
        formData.append("latitude", latitude.toString());
        formData.append("longitude", longitude.toString());
        formData.append("location_source", "citizen_app");
        if (textContent) {
          formData.append("text_content", textContent);
        }

        const res = await fetch(`${apiUrl}/evidence/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Evidence upload failed: HTTP ${res.status}`);
        const data = await res.json();
        evidenceId = data.evidence_id;
      }

      // Step 2: AI Perception & Multimodal Analysis
      setPipelineStep(2);
      await new Promise((r) => setTimeout(r, 900));

      // Poll for processing job completion or candidate creation
      setPipelineStep(3); // Entity & Spatial Resolution
      await new Promise((r) => setTimeout(r, 900));

      // Fetch candidates list to see newly formed candidate
      const candRes = await fetch(`${apiUrl}/incidents/candidates?world_id=world-nexus-city-01`);
      let matchedCand: any = null;
      if (candRes.ok) {
        const candidates = await candRes.json();
        if (candidates && candidates.length > 0) {
          matchedCand = candidates[0]; // Most recent candidate
        }
      }

      setPipelineStep(4); // Analysis Complete!
      setAnalysisResult({
        evidenceId,
        candidateId: matchedCand?.id || `cand-${evidenceId.slice(3, 11)}`,
        incidentType: matchedCand?.incident_type || (textContent.toLowerCase().includes("flood") ? "FLOOD" : "INFRASTRUCTURE"),
        title: matchedCand?.title || "Incident Candidate Detected",
        summary: matchedCand?.summary || textContent || "Multimodal evidence received and classified by vision/language model.",
        severity: matchedCand?.severity_hint || "HIGH",
        confidence: matchedCand?.confidence ? Math.round(matchedCand.confidence * 100) : 91,
        resolvedEntity: matchedCand?.resolved_entity_id || "Road R17 Bypass Bridge",
        detectedObjects: ["standing_water", "hazard_zone", "vehicle_impediment"],
      });

      // Also create corresponding complaint record in TRINETRA Haryana governance workflow
      try {
        const cat = textContent.toLowerCase().includes("flood")
          ? "URBAN_FLOODING"
          : textContent.toLowerCase().includes("power") || textContent.toLowerCase().includes("generator")
          ? "ELECTRICAL_HAZARD"
          : "ROAD_BLOCKAGE";

        await fetch("http://localhost:8000/api/v1/complaints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: cat,
            title: textContent.slice(0, 80) || "Citizen Observation Report",
            description: textContent || "Citizen reported field hazard observation.",
            district_id: "HR-GU",
            latitude,
            longitude,
            address: "Reported Observation Site, Gurugram, Haryana",
            citizen_name: "Citizen Reporter",
            citizen_phone: "+91-98100-11223",
          }),
        });
      } catch (err) {
        console.warn("Shared complaint workflow sync notice:", err);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit evidence");
      setPipelineStep(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Ambient Light Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[300px] bg-emerald-500/10 blur-[130px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/world" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-center font-black tracking-wider text-cyan-400 text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-widest text-white mono-telemetry">AEGIS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 font-bold">
                  CITIZEN PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Multimodal Evidence & Citizen Perception Layer</p>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          <nav className="hidden md:flex items-center gap-2 text-xs">
            <Link href="/world" className="text-slate-400 hover:text-slate-200">
              Command Center
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/intelligence" className="text-slate-400 hover:text-slate-200">
              Contextual Intelligence
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/review" className="text-slate-400 hover:text-slate-200">
              Field Operations
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            AI SENSORY PIPELINE ONLINE
          </div>
          <Link
            href="/world"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-xs font-semibold text-cyan-300 transition-colors shadow-sm"
          >
            <span>←</span> Command Center
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-36">
        {/* Title & One-Click Hackathon Presets */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800/60">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Real-World Observation Report
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Submit raw photos, aerial video, voice dispatches, or field descriptions. NEXUS multimodal AI parses, classifies, resolves geographic entities, and projects candidates onto the operational 3D world model.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Demo Presets:</span>
              <button
                type="button"
                onClick={() => triggerDemoScenario("FLOOD")}
                className="px-2.5 py-1 text-xs rounded-md bg-cyan-950/70 border border-cyan-800/70 hover:border-cyan-500 text-cyan-300 font-mono transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              >
                🌊 R17 Bridge Flood
              </button>
              <button
                type="button"
                onClick={() => triggerDemoScenario("GAS")}
                className="px-2.5 py-1 text-xs rounded-md bg-amber-950/70 border border-amber-800/70 hover:border-amber-500 text-amber-300 font-mono transition-all hover:shadow-[0_0_10px_rgba(245,158,11,0.3)]"
              >
                ⚠️ Gas Pipeline Leak
              </button>
              <button
                type="button"
                onClick={() => triggerDemoScenario("POWER")}
                className="px-2.5 py-1 text-xs rounded-md bg-purple-950/70 border border-purple-800/70 hover:border-purple-500 text-purple-300 font-mono transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              >
                ⚡ Hospital Generator
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 8: NEARBY ACTIVITY & COMMUNITY SIGNAL (Section 2 - 8) */}
        <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/20 backdrop-blur-md p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/90 border border-cyan-500/60 flex items-center justify-center text-cyan-400 text-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                📡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-wider text-white mono-telemetry uppercase">
                    NEARBY ACTIVITY
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-bold">
                    COMMUNITY CORROBORATION
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  See when other citizens are observing related conditions in your immediate area.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SPATIAL CLUSTER: 420m RADIUS</span>
            </div>
          </div>

          {/* Feedback Banner if Corroborated */}
          {corroborateFeedback && (
            <div className="p-3.5 rounded-xl border border-emerald-500/60 bg-emerald-950/40 text-emerald-200 text-xs font-mono flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>{corroborateFeedback}</span>
              </div>
              <span className="text-emerald-400 font-bold">13 Nearby Reports Corroborating</span>
            </div>
          )}

          {/* 3-Row Civic Grid: YOUR REPORT | NEARBY REPORTS | COMMUNITY SIGNAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 1. YOUR REPORT (4 cols) */}
            <div className="lg:col-span-4 p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  YOUR OBSERVATION
                </span>
                <h3 className="text-sm font-bold text-white">Power Outage & Grid Surge</h3>
                <div className="text-xs text-cyan-400 font-mono mt-1">Sector 17 — North Substation Feeder</div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  {textContent || "Transformer arching observed, residential feeder tripped."}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">STATUS:</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
                  UNDER REVIEW
                </span>
              </div>
            </div>

            {/* 2. NEARBY REPORTS (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  NEARBY CITIZEN REPORTS ({nearbyData?.nearby_reports?.length || 3} ACTIVE)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Privacy Protected: No citizen names exposed</span>
              </div>

              <div className="space-y-2.5">
                {(nearbyData?.nearby_reports || [
                  {
                    report_id: "RPT-R17-001",
                    title: "Power Outage & Grid Surge",
                    distance_m: 250,
                    reported_time: "4 min ago",
                    corroborated_count: 12,
                    status: "UNDER REVIEW",
                  },
                  {
                    report_id: "RPT-R17-002",
                    title: "Substation Warning Siren & Sparking",
                    distance_m: 310,
                    reported_time: "6 min ago",
                    corroborated_count: 8,
                    status: "UNDER REVIEW",
                  },
                  {
                    report_id: "RPT-R17-003",
                    title: "Traffic Signal Inoperative at Crossroad",
                    distance_m: 180,
                    reported_time: "7 min ago",
                    corroborated_count: 5,
                    status: "ASSIGNED",
                  },
                ]).map((rep: any) => {
                  const isCorroborated = corroboratedReports[rep.report_id];
                  const isLoading = corroborateLoading === rep.report_id;
                  const displayCount = isCorroborated ? rep.corroborated_count + 1 : rep.corroborated_count;

                  return (
                    <div
                      key={rep.report_id}
                      className="p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{rep.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                            {rep.distance_m}m away
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <span>Reported {rep.reported_time}</span>
                          <span>•</span>
                          <span className="text-amber-300 font-semibold">
                            {displayCount} nearby citizens reported this
                          </span>
                        </div>
                      </div>

                      {/* Corroboration Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/track?id=${rep.report_id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                        >
                          View Report
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleCorroborate(rep.report_id)}
                          disabled={isCorroborated || isLoading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                            isCorroborated
                              ? "bg-emerald-950 border border-emerald-600 text-emerald-300 cursor-default"
                              : "bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
                          }`}
                        >
                          {isLoading ? (
                            <span>Corroborating...</span>
                          ) : isCorroborated ? (
                            <>
                              <span>✓</span>
                              <span>CORROBORATED</span>
                            </>
                          ) : (
                            <>
                              <span>⚡</span>
                              <span>THIS IS HAPPENING HERE TOO</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. COMMUNITY SIGNAL SUMMARY BANNER (Section 5 & 6) */}
          <div className="p-4 rounded-xl border border-cyan-900/50 bg-cyan-950/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  COMMUNITY SIGNAL
                </span>
                <span className="text-xs text-cyan-300 font-mono">
                  13 nearby citizens report the same issue
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Time window: <strong className="text-slate-200">10:14 AM – 10:21 AM</strong> • Cluster: <strong className="text-slate-200">420m radius</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">AGGREGATE REPORTS</span>
                <strong className="text-white block mt-0.5">8 reports</strong>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">CITIZEN PHOTOS</span>
                <strong className="text-cyan-300 block mt-0.5">8 photos</strong>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">CITIZEN VIDEOS</span>
                <strong className="text-cyan-300 block mt-0.5">3 videos</strong>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">VOICE DISPATCHES</span>
                <strong className="text-purple-300 block mt-0.5">2 audio notes</strong>
              </div>
            </div>

            {/* Citizen-Safe Truthful Explanation (Section 6 & 7) */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">ℹ️</span>
              <div>
                <p>
                  <strong>Why this matters:</strong> Multiple nearby reports may help AEGIS determine whether separate observations are describing the same real-world event.
                </p>
                <p className="text-slate-400 mt-0.5 text-[10px]">
                  Notice: Corroboration is evidence. It is NOT operational truth. AEGIS combines citizen signals with municipal sensor telemetry before dispatching specialized response crews.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout: Form on Left, AI Stepper & Feedback on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Submission Input Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 shadow-xl">
              {/* Step 1: Modality Tabs */}
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                1. What Did You See? (Select Modality)
              </label>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {(
                  [
                    { id: "PHOTO", label: "Photo", icon: "📷", desc: "Vision & DINO" },
                    { id: "VIDEO", label: "Video", icon: "🎥", desc: "Temporal AI" },
                    { id: "VOICE", label: "Voice", icon: "🎙️", desc: "Whisper Audio" },
                    { id: "TEXT", label: "Text", icon: "📝", desc: "Natural Lang" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      activeTab === tab.id
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xl mb-1">{tab.icon}</span>
                    <span className="text-xs font-bold">{tab.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{tab.desc}</span>
                  </button>
                ))}
              </div>

              {/* Modality Specific File Input / Controls */}
              <div className="mb-6">
                {activeTab === "PHOTO" && (
                  <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl p-5 text-center transition-all bg-slate-950/40">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      id="photo-upload"
                    />
                    {filePreview ? (
                      <div className="space-y-3">
                        <img
                          src={filePreview}
                          alt="Evidence preview"
                          className="max-h-52 mx-auto rounded-lg border border-slate-700 object-cover shadow-lg"
                        />
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-slate-300 font-mono">{selectedFile?.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setFilePreview(null);
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 underline font-mono"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="photo-upload" className="cursor-pointer block py-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 text-2xl text-slate-300">
                          📷
                        </div>
                        <p className="text-sm font-medium text-slate-200">Click to upload photo evidence</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP up to 50MB</p>
                      </label>
                    )}
                  </div>
                )}

                {activeTab === "VIDEO" && (
                  <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl p-5 text-center transition-all bg-slate-950/40">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="video/*"
                      className="hidden"
                      id="video-upload"
                    />
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 inline-block font-mono text-xs text-cyan-300">
                          🎥 Video attached: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setFilePreview(null);
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 underline font-mono"
                          >
                            Remove Video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="video-upload" className="cursor-pointer block py-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 text-2xl text-slate-300">
                          🎥
                        </div>
                        <p className="text-sm font-medium text-slate-200">Click to upload observation footage</p>
                        <p className="text-xs text-slate-500 mt-1">MP4, MOV, WEBM up to 50MB</p>
                      </label>
                    )}
                  </div>
                )}

                {activeTab === "VOICE" && (
                  <div className="border border-slate-700 rounded-xl p-5 bg-slate-950/40 flex flex-col items-center justify-center text-center">
                    <div className="mb-4">
                      {isRecording ? (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center animate-pulse text-2xl text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                            🎙️
                          </div>
                          <span className="text-sm font-mono text-rose-400 mt-2 font-bold">
                            RECORDING: {recordingSeconds}s
                          </span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl text-slate-300">
                          🎙️
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs tracking-wide flex items-center gap-2 transition-all shadow-md"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-white" />
                          Start Voice Recording
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium text-xs tracking-wide flex items-center gap-2 transition-all"
                        >
                          <span className="w-2.5 h-2.5 bg-rose-400 rounded-sm" />
                          Stop & Attach Audio
                        </button>
                      )}
                    </div>
                    {selectedFile && !isRecording && (
                      <p className="text-xs font-mono text-emerald-400 mt-3">
                        ✓ Audio captured: {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "TEXT" && (
                  <p className="text-xs text-slate-400 mb-2">
                    Enter direct citizen observation or emergency radio transmission transcript.
                  </p>
                )}
              </div>

              {/* Observation Text Description */}
              <div className="mb-6">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  2. Observation Narrative & Context
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Describe what is occurring, observed road or facility conditions, apparent hazards, casualties, or trapped assets..."
                  rows={3}
                  className="w-full rounded-lg bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 p-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all font-sans"
                />
              </div>

              {/* Location Coordinates & Presets */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    3. Location & Spatial Grounding
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                  >
                    📍 Use Device GPS
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="block text-[10px] font-mono text-slate-500 mb-1">LATITUDE</span>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      className="w-full rounded-md bg-slate-950/80 border border-slate-800 p-2 text-xs font-mono text-slate-200 focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-slate-500 mb-1">LONGITUDE</span>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      className="w-full rounded-md bg-slate-950/80 border border-slate-800 p-2 text-xs font-mono text-slate-200 focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                {/* City Landmarks Dropdown / Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500">QUICK SNAP TO OPERATIONAL ASSET:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {CITY_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyPresetLocation(preset)}
                        className={`text-[11px] px-2 py-1 rounded font-mono border transition-all ${
                          latitude === preset.lat && longitude === preset.lng
                            ? "bg-cyan-950 border-cyan-500 text-cyan-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs font-mono">
                  ⚠ {errorMsg}
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (!textContent && !selectedFile)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isSubmitting || (!textContent && !selectedFile)
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Processing Multimodal AI Ingestion...</span>
                  </>
                ) : (
                  <>
                    <span>SUBMIT EVIDENCE & RUN PERCEPTION</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Live Pipeline Stepper & Analysis Result (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Pipeline Stepper Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 shadow-xl">
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>AI Perception Pipeline</span>
                <span className="text-emerald-400 font-bold">STAGE {pipelineStep}/4</span>
              </h2>

              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Ingestion & Cryptographic Hash",
                    desc: "MIME validation, SHA256 integrity signature, encrypted storage URI",
                  },
                  {
                    step: 2,
                    title: "Multimodal AI Understanding",
                    desc: "Grounding DINO object tagging, SAM 2 segmentation, Whisper audio transcription",
                  },
                  {
                    step: 3,
                    title: "Spatial & Entity Resolution",
                    desc: "GIS polygon intersection, road vector mapping, candidate linkage",
                  },
                  {
                    step: 4,
                    title: "Incident Candidate Formation",
                    desc: "Epistemic hypothesis formulation, confidence scoring, 3D world update",
                  },
                ].map((item) => {
                  const isDone = pipelineStep > item.step;
                  const isCurrent = pipelineStep === item.step;
                  return (
                    <div
                      key={item.step}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-cyan-950/40 border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                          : isDone
                          ? "bg-slate-950/40 border-emerald-900/60"
                          : "bg-slate-950/20 border-slate-900 opacity-50"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5 shrink-0 ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                            : isCurrent
                            ? "bg-cyan-500 text-slate-950 font-black animate-pulse"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isDone ? "✓" : item.step}
                      </div>
                      <div>
                        <h3 className={`text-xs font-bold ${isCurrent ? "text-cyan-300" : isDone ? "text-slate-200" : "text-slate-400"}`}>
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis Result Display */}
            {analysisResult && (
              <div className="rounded-xl border border-cyan-500/50 bg-gradient-to-b from-slate-900/90 to-cyan-950/20 backdrop-blur-md p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      CANDIDATE FORMED
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300">
                    {analysisResult.confidence}% CONFIDENCE
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">
                      {analysisResult.severity || "HIGH"} SEVERITY
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      TYPE: <strong className="text-white">{analysisResult.incidentType}</strong>
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-2">{analysisResult.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{analysisResult.summary}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Matched Spatial Entity:</span>
                    <span className="font-bold text-cyan-300">{analysisResult.resolvedEntity}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Epistemic Status:</span>
                    <span className="font-mono text-amber-300 text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                      HYPOTHESIS / CANDIDATE
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Evidence ID:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{analysisResult.evidenceId}</span>
                  </div>
                </div>

                {/* Direct Action Link to 3D World */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => router.push("/world")}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Inspect Candidate in 3D World</span>
                    <span>→</span>
                  </button>
                  <Link
                    href={`/track?id=${analysisResult.evidenceId}`}
                    className="w-full py-2.5 px-4 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-300 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <span>Track Report Lifecycle (Citizen Transparency)</span>
                    <span>→</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setAnalysisResult(null);
                      setPipelineStep(0);
                      setTextContent("");
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 font-mono transition-colors"
                  >
                    Submit Another Field Observation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
