"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Building2,
  ChevronDown,
  Globe2,
  Landmark,
  ShieldCheck,
  Truck,
  User,
  Check,
  Sparkles,
} from "lucide-react";

export const AUTHORITY_ROLES = [
  {
    roleKey: "CITIZEN",
    label: "Citizen Portal",
    shortLabel: "Citizen",
    icon: User,
    path: "/portal/citizen",
    email: "citizen.rohtak@trinetra.gov.in",
    pass: "Citizen@2026",
    badgeColor: "text-blue-800 bg-blue-50 border-blue-200 hover:bg-blue-100/80",
    desc: "Citizen Voice & Grievance Lodging",
  },
  {
    roleKey: "FIELD_OFFICER",
    label: "Field Unit Officer",
    shortLabel: "Field Ops",
    icon: Truck,
    path: "/portal/field-officer",
    email: "field.amb01@trinetra.gov.in",
    pass: "Field@2026",
    badgeColor: "text-teal-800 bg-teal-50 border-teal-200 hover:bg-teal-100/80",
    desc: "Ground Response & Photo Proof SOP",
  },
  {
    roleKey: "DEPARTMENT",
    label: "Department Head",
    shortLabel: "Department",
    icon: Activity,
    path: "/portal/department",
    email: "pwd.lead@trinetra.gov.in",
    pass: "Department@2026",
    badgeColor: "text-indigo-800 bg-indigo-50 border-indigo-200 hover:bg-indigo-100/80",
    desc: "Line Dept Ops & Clustered Missions",
  },
  {
    roleKey: "DISTRICT_ADMIN",
    label: "District Magistrate",
    shortLabel: "DC Gurugram",
    icon: Building2,
    path: "/portal/district-admin",
    email: "dc.gurugram@trinetra.gov.in",
    pass: "District@2026",
    badgeColor: "text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80",
    desc: "District Coordination & SLA Tracking",
  },
  {
    roleKey: "STATE_LEADERSHIP",
    label: "State Leadership",
    shortLabel: "Apex / CM",
    icon: Landmark,
    path: "/portal/state-leadership",
    email: "leadership@trinetra.gov.in",
    pass: "Leadership@2026",
    badgeColor: "text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100/80",
    desc: "CM Office & Apex Statewide Governance",
  },
  {
    roleKey: "SPATIAL_TWIN",
    label: "3D Spatial Twin",
    shortLabel: "3D Twin",
    icon: Globe2,
    path: "/world",
    email: "leadership@trinetra.gov.in",
    pass: "Leadership@2026",
    badgeColor: "text-sky-800 bg-sky-50 border-sky-200 hover:bg-sky-100/80",
    desc: "Digital Twin 3D Operational View",
  },
];

interface AuthorityRoleSwitcherProps {
  className?: string;
  onRoleChanged?: (roleKey: string) => void;
}

export const AuthorityRoleSwitcher: React.FC<AuthorityRoleSwitcherProps> = ({
  className = "",
  onRoleChanged,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current active role from pathname
  const currentRole = React.useMemo(() => {
    if (pathname === "/portal/field-officer") return AUTHORITY_ROLES[1];
    if (pathname.startsWith("/portal/department")) return AUTHORITY_ROLES[2];
    if (pathname === "/portal/district-admin") return AUTHORITY_ROLES[3];
    if (pathname === "/portal/state-leadership") return AUTHORITY_ROLES[4];
    if (pathname === "/world") return AUTHORITY_ROLES[5];
    if (pathname === "/portal/citizen" || pathname === "/track" || pathname === "/report")
      return AUTHORITY_ROLES[0];
    return AUTHORITY_ROLES[2]; // Default to Department
  }, [pathname]);

  const handleSwitchRole = async (roleObj: (typeof AUTHORITY_ROLES)[0]) => {
    if (roleObj.path === pathname) {
      setShowRoleMenu(false);
      return;
    }
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
      }
      if (onRoleChanged) onRoleChanged(roleObj.roleKey);
    } catch (err) {
      console.error("Role switch error:", err);
    } finally {
      setSwitchingRole(false);
    }
    router.push(roleObj.path);
  };

  const CurrentIcon = currentRole.icon;

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowRoleMenu((prev) => !prev)}
        disabled={switchingRole}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-xs cursor-pointer select-none ${currentRole.badgeColor}`}
        title="Switch Trinetra Operational Role"
      >
        <CurrentIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline font-semibold">{currentRole.label}</span>
        <span className="sm:hidden font-semibold">{currentRole.shortLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            showRoleMenu ? "rotate-180" : ""
          }`}
        />
      </button>

      {showRoleMenu && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Authority Role
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
              6 ROLES
            </span>
          </div>

          <div className="space-y-1 mt-1.5">
            {AUTHORITY_ROLES.map((roleObj) => {
              const Icon = roleObj.icon;
              const isActive = currentRole.roleKey === roleObj.roleKey;
              return (
                <button
                  key={roleObj.roleKey}
                  type="button"
                  onClick={() => handleSwitchRole(roleObj)}
                  disabled={switchingRole}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-900 font-bold border border-blue-200"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{roleObj.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal leading-tight truncate">
                        {roleObj.desc}
                      </div>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
