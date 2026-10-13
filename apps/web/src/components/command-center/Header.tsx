"use client";

import React, { useEffect, useState } from "react";
import { useWorldStore } from "@/store/useWorldStore";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  LogIn,
  Mic,
  ShieldCheck,
  Home,
  Search,
} from "lucide-react";
import Link from "next/link";
import { AegisLogo } from "@/components/ui/AegisLogo";
import { AuthorityRoleSwitcher, AUTHORITY_ROLES } from "./AuthorityRoleSwitcher";

export { AUTHORITY_ROLES };

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleVoiceModal } = useWorldStore();
  const [authUser, setAuthUser] = useState<any>(null);

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

  const isWorld = pathname === "/world";
  const isCitizenPortal = pathname === "/portal/citizen" || pathname === "/track" || pathname === "/report";

  // -------------------------------------------------------------
  // 1. CITIZEN PORTAL / PUBLIC HEADER (Light government theme)
  // -------------------------------------------------------------
  if (isCitizenPortal) {
    return (
      <header className="h-16 min-h-[64px] border-b border-slate-200/90 bg-white sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/world" className="flex items-center gap-2.5 group select-none">
            <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/trinetra_logo.png"
                alt="TRINETRA Logo"
                className="w-full h-full object-cover rounded-xl shadow-md border border-slate-700/60 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]"
              />
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

        {/* Right Controls: Role Switcher & Citizen Session Status */}
        <div className="flex items-center gap-2.5">
          <AuthorityRoleSwitcher />

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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
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
          <AuthorityRoleSwitcher />
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
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/trinetra_logo.png"
              alt="TRINETRA Logo"
              className="w-full h-full object-cover rounded-xl shadow-md border border-slate-700/60 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]"
            />
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
        {/* AUTHORITY ROLE SWITCHER */}
        <AuthorityRoleSwitcher />

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

