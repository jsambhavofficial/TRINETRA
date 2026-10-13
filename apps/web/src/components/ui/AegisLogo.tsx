"use client";

import React from "react";
import Link from "next/link";

interface AegisLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  className?: string;
}

export const AegisLogo: React.FC<AegisLogoProps> = ({ size = "md", showSubtitle = true, className = "" }) => {
  const iconSize = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const titleSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <Link href="/world" className="flex items-center gap-2.5 group select-none">
      {/* TRINETRA State Governance Emblem Shield */}
      <div className={`relative ${iconSize} flex items-center justify-center shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/trinetra_logo.png"
          alt="TRINETRA Cyber Emblem"
          className="w-full h-full object-cover rounded-xl shadow-lg border border-sky-500/30 drop-shadow-[0_0_12px_rgba(56,189,248,0.55)] group-hover:drop-shadow-[0_0_18px_rgba(56,189,248,0.85)] group-hover:scale-105 transition-all duration-300"
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center py-0.5">
        <div className="flex items-center gap-1.5 leading-tight">
          <span className={`font-black tracking-widest text-slate-100 mono-telemetry ${titleSize}`}>
            TRINETRA
          </span>
          <span className="text-[8px] text-sky-400 font-bold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/80 mono-telemetry">
            HARYANA
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[9px] text-slate-400 font-medium tracking-tight leading-tight mt-0.5">
            State Governance Intelligence Platform
          </p>
        )}
      </div>
    </Link>
  );
};
