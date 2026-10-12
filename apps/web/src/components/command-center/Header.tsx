"use client";

import React, { useEffect, useState, useRef } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Building2,
  ChevronDown,
  Globe2,
  Mic,
  Truck,
  User,
  LogOut,
  LogIn,
  Landmark,
  ShieldCheck,
  Check,
  Bell,
  Home,
  FileText,
  Search,
} from "lucide-react";
import Link from "next/link";
import { AegisLogo } from "@/components/ui/AegisLogo";

export const AUTHORITY_ROLES = [
  {
    roleKey: "STATE_LEADERSHIP",
    label: "State Leadership",
    shortLabel: "Apex / CM",
    icon: Landmark,
    path: "/portal/state-leadership",
    email: "leadership@trinetra.gov.in",
    pass: "Leadership@2026",
    badgeColor: "text-amber-700 bg-amber-50 border-amber-200",
    desc: "CM Office & Apex Statewide Governance",
  },
  {
    roleKey: "DISTRICT_ADMIN",
    label: "District Magistrate",
    shortLabel: "DC Gurugram",
    icon: Building2,
    path: "/portal/district-admin",
    email: "dc.gurugram@trinetra.gov.in",
    pass: "District@2026",
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    desc: "District Coordination & SLA Tracking",
  },
  {
    roleKey: "DEPARTMENT",
    label: "Department Head",
    shortLabel: "Department",
    icon: Activity,
    path: "/portal/department",
    email: "pwd.lead@trinetra.gov.in",
    pass: "Department@2026",
    badgeColor: "text-blue-700 bg-blue-50 border-blue-200",
    desc: "Line Dept Ops & Clustered Missions",
  },
  {
    roleKey: "FIELD_OFFICER",
    label: "Field Unit Officer",
    shortLabel: "Field Ops",
    icon: Truck,
    path: "/portal/field-officer",
    email: "field.amb01@trinetra.gov.in",
    pass: "Field@2026",
    badgeColor: "text-cyan-700 bg-cyan-50 border-cyan-200",
    desc: "Ground Response & Photo Proof SOP",
  },
  {
    roleKey: "SPATIAL_TWIN",
    label: "3D Spatial Twin",
    shortLabel: "3D Twin",
    icon: Globe2,
    path: "/world",
    email: "leadership@trinetra.gov.in",
    pass: "Leadership@2026",
    badgeColor: "text-sky-700 bg-sky-50 border-sky-200",
    desc: "Digital Twin 3D Operational View",
  },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleVoiceModal } = useWorldStore();
  const [authUser, setAuthUser] = useState<any>(null);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check current session from localStorage / backend
  useEffect(() => {
    try {
      const stored = localStorage.getItem("trinetra_user");
      if (stored) {
        setAuthUser(JSON.parse(stored));
      } else {
        setAuthUser(null);
      }
    } catch (e) {
      // ignore
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("trinetra_user");
    localStorage.removeItem("trinetra_token");
    localStorage.removeItem("token");
    setAuthUser(null);
    router.push("/login");
  };

  const handleSwitchAuthorityRole = async (roleObj: typeof AUTHORITY_ROLES[0]) => {
    setSwitchingRole(true);
    setShowRoleMenu(false);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: roleObj.email, password: roleObj.pass }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("trinetra_token", data.access_token);
        localStorage.setItem("trinetra_user", JSON.stringify(data.user));
        setAuthUser(data.user);
      }
    } catch (err) {
      console.error("Role switch error:", err);
    } finally {
      setSwitchingRole(false);
    }
    router.push(roleObj.path);
  };

  const isWorld = pathname === "/world";
  const isCitizenPortal = pathname === "/portal/citizen" || pathname === "/track" || pathname === "/report";
  const currentRoleMatch = AUTHORITY_ROLES.find((r) => r.path === pathname) || AUTHORITY_ROLES[2];

  // -------------------------------------------------------------
  // 1. CITIZEN PORTAL / PUBLIC HEADER (Light government theme)
  // -------------------------------------------------------------
  if (isCitizenPortal) {
    return (
      <header className="h-16 min-h-[64px] border-b border-slate-200/90 bg-white sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none shadow-xs">
        <div className="flex items-center gap-3">
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
                <span className="font-extrabold text-base tracking-wider text-slate-900">TRINETRA</span>
                <span className="text-[10px] text-white font-bold px-1.5 py-0.2 rounded bg-blue-600">HARYANA</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">State Governance Intelligence Platform</p>
            </div>
          </Link>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="hidden md:flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-tight">नागरिक जन-संवाद</span>
            <span className="text-xs font-extrabold text-teal-600 tracking-wider leading-tight">TRINETRA</span>
          </div>
        </div>

        {/* Center Links */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <Link
            href="/portal/citizen"
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold shadow-xs flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>नागरिक पोर्टल</span>
          </Link>
          <Link
            href="/track"
            className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>शिकायत की स्थिति जांचें</span>
          </Link>
        </div>

        {/* Citizen Session Status & Logout */}
        <div className="flex items-center gap-2">
          {authUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {authUser.display_name ? authUser.display_name.slice(0, 2).toUpperCase() : "CZ"}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-slate-900 font-bold">{authUser.display_name}</span>
                <span className="text-[10px] text-slate-400">नागरिक / Citizen</span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Citizen Sign In</span>
            </Link>
          )}
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------
  // 2. WORLD DIGITAL TWIN (Dark Tactical Header)
  // -------------------------------------------------------------
  if (isWorld) {
    return (
      <header className="h-14 min-h-[56px] border-b border-surface-border bg-slate-950/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 gap-2 text-slate-100">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AegisLogo />
          <div className="h-6 w-px bg-surface-border hidden sm:block" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="tracking-wider">SPATIAL COMMAND 3D</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/portal/department"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
          >
            Department Portal
          </Link>
          <button
            onClick={() => toggleVoiceModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/60 hover:bg-sky-500/30 text-sky-200 text-xs font-bold font-mono tracking-wider"
          >
            <Mic className="w-3.5 h-3.5 text-sky-300" />
            <span>VOICE</span>
          </button>
          {authUser && (
            <button
              onClick={handleLogout}
              className="p-1 rounded text-slate-400 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------
  // 3. AUTHORITY OPERATIONAL COMMAND HEADER (Light Government Theme)
  // -------------------------------------------------------------
  return (
    <header className="h-16 min-h-[64px] border-b border-slate-200/90 bg-white sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none shadow-xs text-slate-800">
      {/* Brand & Authority Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/world" className="flex items-center gap-2.5 select-none">
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
              <span className="font-extrabold text-base tracking-wider text-slate-900">TRINETRA</span>
              <span className="text-[10px] text-white font-bold px-1.5 py-0.2 rounded bg-blue-600">HARYANA</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">State Governance Intelligence Platform</p>
          </div>
        </Link>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="tracking-wider">AUTHORITY COMMAND</span>
        </div>
      </div>

      {/* Right Controls: Role Switcher Dropdown, Voice Ops, Profile & Logout */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* AUTHORITY ROLE SWITCHER DROPDOWN */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            disabled={switchingRole}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${currentRoleMatch.badgeColor} hover:brightness-95 cursor-pointer`}
            title="Click to Switch Authority Command Role"
          >
            <currentRoleMatch.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{currentRoleMatch.label}</span>
            <span className="sm:hidden">{currentRoleMatch.shortLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showRoleMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-68 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in">
              <div className="px-2.5 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Switch Authority Role</span>
                <span className="text-blue-600 font-mono">5 ROLES</span>
              </div>
              <div className="space-y-1 mt-1.5">
                {AUTHORITY_ROLES.map((roleObj) => {
                  const Icon = roleObj.icon;
                  const isActive = pathname === roleObj.path;
                  return (
                    <button
                      key={roleObj.roleKey}
                      onClick={() => handleSwitchAuthorityRole(roleObj)}
                      disabled={switchingRole}
                      className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-800 font-bold border border-blue-200"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">{roleObj.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal leading-tight">
                            {roleObj.desc}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Voice Ops Button */}
        <button
          onClick={() => toggleVoiceModal(true)}
          title="Open Voice Command Center"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden md:inline">VOICE</span>
        </button>

        {/* Authenticated Officer Badge & Logout */}
        {authUser ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {authUser.display_name ? authUser.display_name.slice(0, 2).toUpperCase() : "OF"}
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {authUser.display_name}
              </span>
              <span className="text-[10px] text-blue-600 font-medium truncate">
                {authUser.role} {authUser.district_id ? `(${authUser.district_id})` : ""}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Secure Officer Logout"
              className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Officer Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};
