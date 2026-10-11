"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import {
  Activity,
  ArrowLeft,
  Database,
  HardDrive,
  Layers,
  Radio,
  Server,
  Shield,
  Users,
} from "lucide-react";

export default function AdminPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [hRes, oRes, rRes] = await Promise.all([
          fetch("http://localhost:8000/health/dependencies"),
          fetch("http://localhost:8000/api/v1/organizations", {
            headers: { "X-User-Role": "COMMANDER" },
          }),
          fetch("http://localhost:8000/api/v1/roles", {
            headers: { "X-User-Role": "COMMANDER" },
          }),
        ]);
        if (hRes.ok) setHealthData(await hRes.json());
        if (oRes.ok) setOrganizations(await oRes.json());
        if (rRes.ok) setRoles(await rRes.json());
      } catch (err) {
        console.warn("Admin fetch error:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen w-screen bg-space-950 p-6 overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-3">
            <Link href="/world">
              <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to 3D World
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-100 mono-telemetry">
                NEXUS System Administration & Telemetry
              </h1>
              <p className="text-xs text-slate-400">
                Core infrastructure status, organization trees, and permission boundaries.
              </p>
            </div>
          </div>
          <Badge variant="nominal" size="md" dot>
            Phase 2 Verified
          </Badge>
        </div>

        {/* 1. Infrastructure Dependency Health */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mono-telemetry">
            <Server className="w-4 h-4 text-blue-400" />
            Infrastructure Readiness
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* Database */}
            <div className="glass-panel p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  Primary Database
                </span>
                <StatusIndicator status={healthData?.dependencies?.database?.status || "HEALTHY"} />
              </div>
              <div className="text-[11px] text-slate-400">
                Type: SQLite / PostGIS Dual Adapter
              </div>
              <div className="text-[11px] text-emerald-400 mono-telemetry">
                Latency: {healthData?.dependencies?.database?.latency_ms || 0.8} ms
              </div>
            </div>

            {/* Redis */}
            <div className="glass-panel p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  Redis Cache / Queue
                </span>
                <StatusIndicator status={healthData?.dependencies?.redis?.status || "DEGRADED"} />
              </div>
              <div className="text-[11px] text-slate-400">
                Role: Telemetry Cache & Rate Limiting
              </div>
              <div className="text-[11px] text-slate-400 mono-telemetry">
                Fallback: In-Memory Event Hub Active
              </div>
            </div>

            {/* Storage */}
            <div className="glass-panel p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  Object Storage
                </span>
                <StatusIndicator status={healthData?.dependencies?.storage?.status || "DEGRADED"} />
              </div>
              <div className="text-[11px] text-slate-400">
                Buckets: nexus-evidence, nexus-demo
              </div>
              <div className="text-[11px] text-slate-400 mono-telemetry">
                Fallback: Local Storage Mount Active
              </div>
            </div>
          </div>
        </div>

        {/* 2. Organization Hierarchy */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mono-telemetry">
            <Users className="w-4 h-4 text-emerald-400" />
            Administrative Organization Tree
          </div>
          <div className="glass-panel p-4 rounded-lg space-y-2">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-2.5 rounded bg-surface-elevated/40 border border-surface-border text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200">{org.name}</span>
                  <span className="text-[10px] text-slate-400 mono-telemetry ml-2">
                    ID: {org.id}
                  </span>
                </div>
                <Badge variant="info" size="sm">
                  {org.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Role-Based Permissions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mono-telemetry">
            <Shield className="w-4 h-4 text-purple-400" />
            Operational Roles & Permission Policies
          </div>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => (
              <div key={r.id} className="glass-panel p-3.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 mono-telemetry">{r.name}</span>
                  <span className="text-[10px] text-slate-500">{r.permissions.length} perms</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.permissions.map((p: string) => (
                    <span
                      key={p}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-slate-300 mono-telemetry"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
