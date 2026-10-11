"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Shield, User, Globe2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const personas = [
    {
      role: "COMMANDER",
      name: "Commander Vikram Malhotra",
      org: "NEXUS Operations Command",
      desc: "Full operational authority. Can view incidents, simulate scenarios, generate response plans, and approve actions.",
      badgeVariant: "critical" as const,
    },
    {
      role: "REGIONAL_OPERATOR",
      name: "Operator Priya Sharma",
      org: "North Operational Sector",
      desc: "Regional monitoring, sector entity management, and scenario testing.",
      badgeVariant: "warning" as const,
    },
    {
      role: "FACILITY_MANAGER",
      name: "Dr. Aarav Mehta",
      org: "Central Memorial Hospital",
      desc: "Facility capacity, bed occupancy, ambulance reception, and perimeter security.",
      badgeVariant: "info" as const,
    },
    {
      role: "FIELD_RESPONDER",
      name: "Lieutenant Kabir Singh",
      org: "Rapid Rescue Alpha",
      desc: "On-scene task updates, telemetry streaming, and navigation access.",
      badgeVariant: "nominal" as const,
    },
    {
      role: "VIEWER",
      name: "Observer Public View",
      org: "Municipal Agency Observer",
      desc: "Read-only situational awareness without authorization access.",
      badgeVariant: "neutral" as const,
    },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-space-950 p-6 select-none">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mono-telemetry mb-2">
            <Globe2 className="w-3.5 h-3.5" />
            NEXUS OPERATIONAL SECURITY GATEWAY
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mono-telemetry">
            Select Operational Persona
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Development Authentication Engine. Choose a seeded operational role to explore role-bounded permissions.
          </p>
        </div>

        {/* Persona Cards */}
        <div className="space-y-3">
          {personas.map((p) => (
            <div
              key={p.role}
              onClick={() => {
                // Save active role to localStorage or cookie
                if (typeof window !== "undefined") {
                  localStorage.setItem("nexus_active_role", p.role);
                }
                router.push("/world");
              }}
              className="glass-panel p-4 rounded-lg cursor-pointer hover:border-surface-borderHover hover:bg-surface-elevated/70 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">{p.name}</span>
                  <Badge variant={p.badgeVariant} size="sm">
                    {p.role}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400 mono-telemetry">{p.org}</div>
                <div className="text-[11px] text-slate-500">{p.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/world")}>
            Skip to Command Center as Commander
          </Button>
        </div>
      </div>
    </div>
  );
}
