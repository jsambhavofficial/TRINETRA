"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  Activity,
  Truck,
  Landmark,
  CheckCircle2,
  KeyRound,
  Compass,
  FileText,
  Search,
  Sparkles,
  Zap,
  Globe2,
  Eye,
  EyeOff,
  Phone,
  Radio,
  CheckCircle,
  TrendingUp,
  Clock,
  Shield,
  Layers,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { HARYANA_DISTRICTS } from "@/lib/haryana";

export default function LoginPage() {
  const router = useRouter();

  // Mode: "CITIZEN" | "OFFICIAL"
  const [portalMode, setPortalMode] = useState<"CITIZEN" | "OFFICIAL">("CITIZEN");
  // Citizen tab: "SIGNIN" | "REGISTER"
  const [citizenTab, setCitizenTab] = useState<"SIGNIN" | "REGISTER">("SIGNIN");

  // Sign In Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register Form State (Citizen only)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDistrict, setRegDistrict] = useState("HR-GU");

  const routeByRole = (role: string) => {
    switch (role) {
      case "STATE_LEADERSHIP":
      case "PLATFORM_ADMIN":
      case "COMMANDER":
        return "/portal/state-leadership";
      case "DISTRICT_ADMIN":
      case "REGIONAL_OPERATOR":
        return "/portal/district-admin";
      case "DEPARTMENT":
      case "FACILITY_MANAGER":
        return "/portal/department";
      case "FIELD_OFFICER":
      case "FIELD_RESPONDER":
        return "/portal/field-officer";
      case "CITIZEN":
      default:
        return "/portal/citizen";
    }
  };

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("बैकएंड से कनेक्शन नहीं हो सका (Backend Not Connected)। कृपया Vercel Environment Variables में API_BACKEND_URL सही सेट करें।");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || errData?.detail || "Invalid email or password");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("trinetra_token", data.access_token);
      localStorage.setItem("trinetra_user", JSON.stringify(data.user));

      router.push(routeByRole(data.user.role));
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone || undefined,
          district_id: regDistrict,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || errData?.detail || "Registration failed");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("trinetra_token", data.access_token);
      localStorage.setItem("trinetra_user", JSON.stringify(data.user));

      router.push("/portal/citizen");
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between bg-[#F8FAFC] select-none font-sans text-slate-800 relative overflow-x-hidden">
      {/* Decorative background illustrations */}
      {portalMode === "CITIZEN" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/haryana_heritage_banner.jpg"
          alt="Haryana Heritage"
          className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 opacity-20 lg:opacity-25 object-cover pointer-events-none mix-blend-multiply [mask-image:linear-gradient(to_left,black_60%,transparent_100%)]"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/haryana_secretariat.jpg"
          alt="Haryana Secretariat"
          className="absolute right-0 bottom-0 w-full lg:w-1/2 opacity-20 lg:opacity-25 object-cover pointer-events-none mix-blend-multiply [mask-image:linear-gradient(to_top,black_50%,transparent_100%)]"
        />
      )}

      {/* Top Slogan Tag */}
      <div className="absolute top-5 left-6 sm:left-10 z-10 flex flex-col items-start gap-0.5 pointer-events-none">
        <div className="text-xs sm:text-sm font-black text-[#1E3A8A] tracking-tight">स्वच्छ हरियाणा</div>
        <div className="text-xs sm:text-sm font-black text-[#16A34A] tracking-tight">सशक्त हरियाणा</div>
        <svg className="w-18 sm:w-22 h-2" viewBox="0 0 100 10" fill="none">
          <path d="M0 5C25 1 35 9 60 5C85 1 95 9 100 5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Main Form Center Box */}
      <div className="w-full max-w-xl px-4 py-8 sm:py-10 z-10 space-y-6">
        {/* Header Logo & Title */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center gap-2.5 mb-1">
            <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/trinetra_logo.png"
                alt="TRINETRA Logo"
                className="w-full h-full object-cover rounded-xl shadow-md border border-slate-700/60 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-wider text-slate-900">TRINETRA</span>
              <span className="text-xs text-white font-bold px-2 py-0.5 rounded bg-blue-600 tracking-wide">
                HARYANA
              </span>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">
            State Governance Intelligence & Citizen Grievance Redressal System
          </p>
          <p className="text-xs font-bold text-blue-700">हरियाणा शासन पोर्टल</p>
        </div>

        {/* Portal Switcher Tabs (Matches Screenshot) */}
        <div className="flex justify-center">
          <div className="bg-white border border-slate-200/90 p-1 rounded-2xl shadow-xs inline-flex w-full max-w-md">
            <button
              onClick={() => {
                setPortalMode("CITIZEN");
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                portalMode === "CITIZEN"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-4 h-4" />
              <div className="text-left leading-tight">
                <div>CITIZEN PORTAL</div>
                <div className="text-[10px] font-normal opacity-90">नागरिक</div>
              </div>
            </button>

            <button
              onClick={() => {
                setPortalMode("OFFICIAL");
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                portalMode === "OFFICIAL"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <div className="text-left leading-tight">
                <div>OFFICIALS</div>
                <div className="text-[10px] font-normal opacity-90">प्रशासनिक</div>
              </div>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CITIZEN MODE (Matches Left Screenshot View) */}
        {/* ========================================================================= */}
        {portalMode === "CITIZEN" && (
          <div className="space-y-4">
            {/* Fast Demo Access Card */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Fast Demo Access (Verified Citizen)
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Log in instantly as <strong>Rohit Verma</strong> (Gurugram Resident) to lodge complaints & track live progress.
                  </p>
                </div>
              </div>

              <button
                onClick={() => quickDemoLogin("citizen.rohit@trinetra.gov.in", "Citizen@2026")}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-emerald-200/80 hover:bg-emerald-300 text-emerald-950 font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
              >
                <span>→ 1-Click Citizen Login</span>
              </button>
            </div>

            {/* Main Form Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-5">
              {/* Tabs inside card */}
              <div className="flex border-b border-slate-100 pb-3 gap-6 text-xs sm:text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setCitizenTab("SIGNIN")}
                  className={`pb-2 relative ${
                    citizenTab === "SIGNIN" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span>Citizen Sign In</span>
                  <div className="text-[10px] font-medium text-slate-400">नागरिक लॉगिन</div>
                  {citizenTab === "SIGNIN" && (
                    <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCitizenTab("REGISTER")}
                  className={`pb-2 relative ${
                    citizenTab === "REGISTER" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span>Register New Account</span>
                  <div className="text-[10px] font-medium text-slate-400">नया खाता बनाएं</div>
                  {citizenTab === "REGISTER" && (
                    <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              </div>

              {citizenTab === "SIGNIN" ? (
                <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Email Address / User ID
                      <span className="text-[10px] font-normal text-slate-400 ml-1">ईमेल पता / उपयोगकर्ता आईडी</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rohit.verma@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs sm:text-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Password
                      <span className="text-[10px] font-normal text-slate-400 ml-1">पासवर्ड</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs sm:text-sm font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>Remember me (मुझे याद रखें)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => alert("कृपया डेमो पासवर्ड उपयोग करें: Citizen@2026")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Forgot Password? (पासवर्ड भूल गए?)
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex flex-col items-center justify-center leading-tight active:scale-98"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{loading ? "प्रमाणीकरण हो रहा है..." : "Sign In to Citizen Portal"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-normal text-blue-100">नागरिक पोर्टल में लॉगिन करें</span>
                  </button>

                  {/* Social buttons */}
                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-slate-400 font-medium mb-3">
                      or continue with / या इसके साथ जारी रखें
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => quickDemoLogin("citizen.rohit@trinetra.gov.in", "Citizen@2026")}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <span>🌐</span>
                        <span>Google से जारी रखें</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => quickDemoLogin("citizen.rohit@trinetra.gov.in", "Citizen@2026")}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <span>📱</span>
                        <span>Mobile OTP से जारी रखें</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">पूरा नाम (Full Name)</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Rohit Verma"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ईमेल पता (Email)</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="rohit@example.com"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">पासवर्ड (Password)</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="कम से कम 6 अक्षर"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर</label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91-98100-11223"
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">जिला (District)</label>
                      <select
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none text-xs"
                      >
                        {HARYANA_DISTRICTS.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    {loading ? "पंजीकरण हो रहा है..." : "खाता बनाएं और लॉगिन करें"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OFFICIALS MODE (Matches Right Screenshot View) */}
        {/* ========================================================================= */}
        {portalMode === "OFFICIAL" && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  1-Click Verified Role Login (Haryana Administration)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Click any official role to authenticate instantly with verified state credentials:
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Card 1: State Leadership */}
              <button
                onClick={() => quickDemoLogin("leadership@trinetra.gov.in", "Leadership@2026")}
                className="w-full p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-100/60 hover:border-amber-300 transition-all text-left flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-800">
                      State Leadership
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      CM Office / Chief Secretary Apex Dashboard
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Card 2: District Admin */}
              <button
                onClick={() => quickDemoLogin("dc.gurugram@trinetra.gov.in", "District@2026")}
                className="w-full p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-100/60 hover:border-emerald-300 transition-all text-left flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
                      District Admin
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Deputy Commissioner Gurugram District
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Card 3: Department Head */}
              <button
                onClick={() => quickDemoLogin("pwd.lead@trinetra.gov.in", "Department@2026")}
                className="w-full p-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-300 transition-all text-left flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-800">
                      Department Head
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Line Department (Assign & Verify Proof)
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Card 4: Field Officer */}
              <button
                onClick={() => quickDemoLogin("field.amb01@trinetra.gov.in", "Field@2026")}
                className="w-full p-3.5 rounded-2xl border border-purple-200/80 bg-purple-50/40 hover:bg-purple-100/60 hover:border-purple-300 transition-all text-left flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-800">
                      Field Officer
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Field Unit AMB-01 (SOP & Proof Submission)
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Card 5: 3D Spatial Digital Twin Command Center */}
              <button
                onClick={() => router.push("/world")}
                className="w-full p-3.5 rounded-2xl border border-cyan-200/80 bg-cyan-50/40 hover:bg-cyan-100/60 hover:border-cyan-300 transition-all text-left flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-cyan-800">
                      3D Spatial Digital Twin Command Center
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      CesiumJS 3D + Mapbox GIS live operational twin of Haryana
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom 4 Feature Badges (Matches Bottom Row in Screenshots) */}
      <div className="w-full max-w-5xl px-4 pb-6 z-10">
        <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-4 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          {portalMode === "CITIZEN" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">शिकायत दर्ज करें</h5>
                  <p className="text-[10px] text-slate-400">Lodge Complaint</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">स्थिति देखें</h5>
                  <p className="text-[10px] text-slate-400">Track Status</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">समाधान पाएं</h5>
                  <p className="text-[10px] text-slate-400">Get Resolution</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">बेहतर शहर बनाएं</h5>
                  <p className="text-[10px] text-slate-400">Build Better Cities</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">Real-time Monitoring</h5>
                  <p className="text-[10px] text-slate-400">वास्तविक समय निगरानी</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">Data Driven Decisions</h5>
                  <p className="text-[10px] text-slate-400">डेटा आधारित निर्णय</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">Faster Resolution</h5>
                  <p className="text-[10px] text-slate-400">तेज समाधान</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">Accountability & Transparency</h5>
                  <p className="text-[10px] text-slate-400">जिम्मेदारी और पारदर्शिता</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
