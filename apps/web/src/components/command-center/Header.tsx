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
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
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
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
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
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
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
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
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
    badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
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

  const isCitizenPortal = pathname === "/portal/citizen" || pathname === "/track" || pathname === "/report";

  // Current active role match
  const currentRoleMatch = AUTHORITY_ROLES.find((r) => r.path === pathname) || AUTHORITY_ROLES[2];

  // -------------------------------------------------------------
  // 1. CITIZEN PORTAL HEADER (Clean, public-safe, zero authority access)
  // -------------------------------------------------------------
  if (isCitizenPortal) {
    return (
      <header className="h-14 min-h-[56px] border-b border-surface-border bg-slate-950/95 backdrop-blur px-3 sm:px-6 flex items-center justify-between shrink-0 select-none z-30 gap-2">
        <div className="flex items-center gap-3">
          <AegisLogo />
          <div className="h-5 w-px bg-surface-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">
              नागरिक जन-संवाद <span className="text-emerald-400 font-mono">TRINETRA</span>
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              CITIZEN PORTAL • HARYANA
            </span>
          </div>
        </div>

        {/* Citizen Center Links */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <Link
            href="/portal/citizen"
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium"
          >
            Lodge Grievance / शिकायत दर्ज करें
          </Link>
          <Link
            href="/track"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-elevated font-medium transition-colors"
          >
            Track Status / स्थिति जांचें
          </Link>
        </div>

        {/* Citizen Session Status & Logout */}
        <div className="flex items-center gap-2">
          {authUser ? (
            <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-[10px] font-bold">
                {authUser.display_name ? authUser.display_name.slice(0, 2).toUpperCase() : "CZ"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-slate-200 font-bold leading-tight">{authUser.display_name}</span>
                <span className="text-[10px] text-emerald-400 font-mono leading-tight">नागरिक / Citizen</span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition-all shadow"
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
  // 2. AUTHORITY OPERATIONAL COMMAND HEADER (Clean top bar, Role Switcher in dropdown)
  // -------------------------------------------------------------
  return (
    <header className="h-14 min-h-[56px] border-b border-surface-border bg-surface-base/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 gap-2">
      {/* Brand & Authority Badge (Clean: Top role tabs removed) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <AegisLogo />
        <div className="h-6 w-px bg-surface-border hidden sm:block" />

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
              currentRoleMatch.badgeColor
            } hover:brightness-125 cursor-pointer`}
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
            <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl p-1.5 z-50">
              <div className="px-2.5 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Switch Authority Role</span>
                <span className="text-purple-400 font-mono">5 ROLES</span>
              </div>
              <div className="space-y-1 mt-1">
                {AUTHORITY_ROLES.map((roleObj) => {
                  const Icon = roleObj.icon;
                  const isActive = pathname === roleObj.path;
                  return (
                    <button
                      key={roleObj.roleKey}
                      onClick={() => handleSwitchAuthorityRole(roleObj)}
                      disabled={switchingRole}
                      className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        isActive
                          ? "bg-slate-800 text-white font-bold border border-slate-700"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="text-xs">{roleObj.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal leading-tight">
                            {roleObj.desc}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/60 hover:bg-sky-500/30 text-sky-200 text-xs font-bold font-mono tracking-wider transition-all cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5 text-sky-300" />
          <span className="hidden md:inline">VOICE</span>
        </button>

        <div className="h-5 w-px bg-surface-border hidden sm:block" />

        {/* Authenticated Officer Badge & Logout */}
        {authUser ? (
          <div className="flex items-center gap-2 glass-panel px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 text-[10px] font-bold">
              {authUser.display_name ? authUser.display_name.slice(0, 2).toUpperCase() : "OF"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[11px] font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                {authUser.display_name}
              </span>
              <span className="text-[9px] text-purple-400 font-mono leading-tight">
                {authUser.role} {authUser.district_id ? `(${authUser.district_id})` : ""}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Secure Officer Logout"
              className="ml-1 p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Officer Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};
