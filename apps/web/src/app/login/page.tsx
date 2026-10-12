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
} from "lucide-react";
import { AegisLogo } from "@/components/ui/AegisLogo";
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
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-4 sm:p-6 select-none font-sans text-slate-100">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <AegisLogo size="lg" showSubtitle={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>TRINETRA</span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono font-normal">
              HARYANA
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            State Governance Intelligence & Citizen Grievance Redressal System | त्रिनेत्र हरियाणा शासन पोर्टल
          </p>
        </div>

        {/* Portal Gateway Switcher: Citizen vs Official */}
        <div className="grid grid-cols-2 rounded-xl bg-slate-900/90 p-1.5 border border-slate-800 text-xs font-bold shadow-lg">
          <button
            onClick={() => {
              setPortalMode("CITIZEN");
              setErrorMsg(null);
            }}
            className={`py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              portalMode === "CITIZEN"
                ? "bg-emerald-600 text-black shadow-md font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>CITIZEN PORTAL / नागरिक</span>
          </button>
          <button
            onClick={() => {
              setPortalMode("OFFICIAL");
              setErrorMsg(null);
            }}
            className={`py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              portalMode === "OFFICIAL"
                ? "bg-sky-600 text-white shadow-md font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>OFFICIALS / प्रशासनिक</span>
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CITIZEN PORTAL SECTION */}
        {portalMode === "CITIZEN" && (
          <div className="space-y-4">
            {/* 1-Click Demo Citizen Access */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-300">Fast Demo Access (Verified Citizen)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Log in instantly as <strong>Rohit Verma</strong> (Gurugram Resident) to lodge complaints & track live progress.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => quickDemoLogin("citizen.rohit@trinetra.gov.in", "Citizen@2026")}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow transition-all shrink-0 flex items-center gap-1.5 justify-center"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Citizen Login</span>
              </button>
            </div>

            {/* Citizen Tabs: Sign In / Register */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex border-b border-slate-800 pb-3 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCitizenTab("SIGNIN")}
                  className={`pb-1 border-b-2 transition-all ${
                    citizenTab === "SIGNIN"
                      ? "border-emerald-500 text-emerald-400 font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Citizen Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setCitizenTab("REGISTER")}
                  className={`pb-1 border-b-2 transition-all ${
                    citizenTab === "REGISTER"
                      ? "border-emerald-500 text-emerald-400 font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Register New Account
                </button>
              </div>

              {citizenTab === "SIGNIN" ? (
                <form onSubmit={handleLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Email Address / User ID</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rohit.verma@example.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-black transition-all shadow flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Authenticating..." : "Sign In to Citizen Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Rohit Verma"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. rohit.verma@example.com"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Mobile (Optional)</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91-98100-11223"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Haryana District</label>
                      <select
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-emerald-500"
                      >
                        {HARYANA_DISTRICTS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-black transition-all shadow flex items-center justify-center gap-2"
                    >
                      <span>{loading ? "Registering..." : "Create Citizen Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Public Quick Tracking Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Want to track an existing grievance without signing in?</span>
              </div>
              <Link
                href="/track"
                className="text-emerald-400 hover:text-emerald-300 font-bold underline font-mono text-[11px]"
              >
                Public Tracker →
              </Link>
            </div>
          </div>
        )}

        {/* OFFICIALS GATEWAY SECTION */}
        {portalMode === "OFFICIAL" && (
          <div className="space-y-4">
            {/* Quick 1-Click Role Login Grid */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span>1-Click Verified Role Login (Haryana Administration)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click any official role to authenticate instantly with verified state credentials:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* State Leadership */}
                <button
                  type="button"
                  onClick={() => quickDemoLogin("leadership@trinetra.gov.in", "Leadership@2026")}
                  className="p-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-xs">State Leadership</span>
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">CM Office / Chief Secretary Apex Dashboard</p>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">leadership@trinetra.gov.in</span>
                </button>

                {/* District Admin */}
                <button
                  type="button"
                  onClick={() => quickDemoLogin("dc.gurugram@trinetra.gov.in", "District@2026")}
                  className="p-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-xs">District Admin</span>
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Deputy Commissioner, Gurugram District</p>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">dc.gurugram@trinetra.gov.in</span>
                </button>

                {/* Department Head */}
                <button
                  type="button"
                  onClick={() => quickDemoLogin("health.lead@trinetra.gov.in", "Department@2026")}
                  className="p-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 hover:border-indigo-400 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 text-xs">Department Head</span>
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Line Department (Assign & Verify Proof)</p>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">health.lead@trinetra.gov.in</span>
                </button>

                {/* Field Officer */}
                <button
                  type="button"
                  onClick={() => quickDemoLogin("field.amb01@trinetra.gov.in", "Field@2026")}
                  className="p-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 text-xs">Field Officer</span>
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Field Unit AMB-01 (SOP & Proof Submission)</p>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">field.amb01@trinetra.gov.in</span>
                </button>

                {/* 3D Spatial Digital Twin */}
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("trinetra_user", JSON.stringify({
                      id: "usr-cm-haryana",
                      email: "leadership@trinetra.gov.in",
                      display_name: "Apex Commander",
                      role: "COMMANDER",
                      district_id: "HR-ALL"
                    }));
                    router.push("/world");
                  }}
                  className="sm:col-span-2 p-2.5 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 hover:border-sky-400 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="font-bold text-sky-300 text-xs">3D Spatial Digital Twin Command Center</span>
                      <p className="text-[10px] text-slate-400">CesiumJS 3D + Mapbox GIS live operational twin of Haryana</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>
            </div>

            {/* Standard Officer Login Form */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <h2 className="text-xs font-bold text-slate-300">Official Government Credentials Sign In</h2>
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Official Gov Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. officer@trinetra.gov.in"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Secure Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold transition-all shadow flex items-center justify-center gap-2"
                >
                  <span>{loading ? "Authenticating..." : "Sign In to Official Terminal"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
