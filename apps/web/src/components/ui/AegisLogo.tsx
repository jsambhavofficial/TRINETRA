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
        <svg
          viewBox="0 0 44 44"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.55)] group-hover:drop-shadow-[0_0_18px_rgba(245,158,11,0.65)] transition-all duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background Shield Gradient */}
            <linearGradient id="tn-shield-bg" x1="6" y1="2" x2="38" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0B132B" stopOpacity="0.95" />
              <stop stopColor="#071E3D" stopOpacity="0.98" />
              <stop stopColor="#020B18" stopOpacity="1" />
            </linearGradient>

            {/* Border Glow Gradient */}
            <linearGradient id="tn-border-grad" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop stopColor="#0284C7" />
              <stop stopColor="#F59E0B" />
            </linearGradient>

            {/* Gold/Amber Divine Flame Gradient */}
            <linearGradient id="tn-gold-grad" x1="22" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE68A" />
              <stop stopColor="#F59E0B" />
              <stop stopColor="#D97706" />
            </linearGradient>

            {/* Cyan Electric Eye Gradient */}
            <linearGradient id="tn-cyan-grad" x1="14" y1="12" x2="30" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop stopColor="#38BDF8" />
              <stop stopColor="#0369A1" />
            </linearGradient>

            {/* Radial Iris Glow */}
            <radialGradient id="tn-iris-glow" cx="22" cy="22.5" r="6" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="0.6" stopColor="#0284C7" />
              <stop offset="1" stopColor="#082F49" />
            </radialGradient>
          </defs>

          {/* Outer Hexagonal Tactical Shield */}
          <path
            d="M22 2.5L38.5 9V22.5C38.5 32.5 31.5 39.5 22 42C12.5 39.5 5.5 32.5 5.5 22.5V9L22 2.5Z"
            fill="url(#tn-shield-bg)"
            stroke="url(#tn-border-grad)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />

          {/* Three Horizontal Tripundra Wisdom Lines (Telemetry Arcs) */}
          <path
            d="M11 18.5Q22 16.5 33 18.5"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <path
            d="M9 22.5Q22 20.5 35 22.5"
            stroke="#F59E0B"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          <path
            d="M11 26.5Q22 24.5 33 26.5"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />

          {/* Trishula Outer Prongs (Curving up gracefully) */}
          <path
            d="M13.5 14C12 21 16 31 22 35C28 31 32 21 30.5 14"
            stroke="url(#tn-border-grad)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Trident Left Hook */}
          <path
            d="M11.5 15.5C12.8 13 14.5 11.5 16 11.5"
            stroke="#38BDF8"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          {/* Trident Right Hook */}
          <path
            d="M32.5 15.5C31.2 13 29.5 11.5 28 11.5"
            stroke="#38BDF8"
            strokeWidth="1.3"
            strokeLinecap="round"
          />

          {/* Central Vertical Third Eye (Trinetra) */}
          <path
            d="M22 10C27 16 27 29 22 35C17 29 17 16 22 10Z"
            fill="#082F49"
            stroke="url(#tn-cyan-grad)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Inner Eye Contour */}
          <path
            d="M22 13C25.5 17.5 25.5 27.5 22 32C18.5 27.5 18.5 17.5 22 13Z"
            fill="#021E36"
            stroke="#38BDF8"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />

          {/* The Omniscient Glowing Iris */}
          <circle cx="22" cy="22.5" r="4.2" fill="url(#tn-iris-glow)" stroke="#67E8F9" strokeWidth="0.8" />

          {/* Focused Intelligence Pupil & Core Spark */}
          <circle cx="22" cy="22.5" r="1.8" fill="#0B132B" />
          <circle cx="22" cy="22.5" r="0.9" fill="#FFFFFF" />

          {/* Top Vertical Divine Flame (Agni / Third Eye Spark of Shiva) */}
          <path
            d="M22 5.5C23.2 7.2 23.5 8.5 22 10C20.5 8.5 20.8 7.2 22 5.5Z"
            fill="url(#tn-gold-grad)"
          />
          <circle cx="22" cy="6" r="0.8" fill="#FFFBEB" />

          {/* Tactical Crosshair Dots at Cardinal Points */}
          <circle cx="22" cy="38" r="0.8" fill="#38BDF8" />
          <circle cx="9" cy="22.5" r="0.7" fill="#F59E0B" />
          <circle cx="35" cy="22.5" r="0.7" fill="#F59E0B" />
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
