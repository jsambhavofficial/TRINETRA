"use client";

import React from "react";
import Link from "next/link";

interface AegisLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

export const AegisLogo: React.FC<AegisLogoProps> = ({ size = "md", showSubtitle = true }) => {
  const iconSize = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const titleSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <Link href="/world" className="flex items-center gap-2.5 group select-none">
      {/* TRINETRA State Governance Emblem Shield */}
      <div className={`relative ${iconSize} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full drop-shadow-[0_0_10px_rgba(14,165,233,0.35)] group-hover:drop-shadow-[0_0_15px_rgba(14,165,233,0.6)] transition-all"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagonal Governance Shield */}
          <path
            d="M20 3L35 9V20C35 29.5 28.5 35.8 20 38C11.5 35.8 5 29.5 5 20V9L20 3Z"
            fill="url(#trinetra-shield-grad)"
            stroke="#0284C7"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Trinetra Third-Eye Symbol: Three concentric intelligence arcs */}
          <path
            d="M12 20C12 16 16 13 20 13C24 13 28 16 28 20C28 24 24 27 20 27C16 27 12 24 12 20Z"
            stroke="#38BDF8"
            strokeWidth="1.4"
            fill="#082F49"
          />
          {/* Inner Intelligence Pupil / Iris */}
          <circle cx="20" cy="20" r="3.2" fill="#38BDF8" />
          <circle cx="20" cy="20" r="1.2" fill="#FFFFFF" />

          {/* Gradients */}
          <defs>
            <linearGradient id="trinetra-shield-grad" x1="5" y1="3" x2="35" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0369A1" stopOpacity="0.5" />
              <stop stopColor="#0F172A" stopOpacity="0.95" />
              <stop stopColor="#0284C7" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
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
