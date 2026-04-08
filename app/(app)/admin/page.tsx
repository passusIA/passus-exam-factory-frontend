"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { api, type AdminKpis, type AdminTenant } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, FileText, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

// ── KPI Card (hoisted) ────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, sub }: {
  label: string; value: string | number; icon: React.ElementType; sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", trial: "secondary", suspended: "destructive", cancelled: "outline",
};

export default function AdminPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) { router.replace("/dashboard"); return; }

    Promise.all([api.getKpis(), api.listAdminTenants()])
      .then(([k, t]) => { setKpis(k); setTenants(t); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isSuperAdmin, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" /> {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vista global de la plataforma</p>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Tenants" value={kpis.total_tenants} icon={Users} />
          <KpiCard label="Exámenes hoy" value={kpis.exams_today} icon={FileText} />
          <KpiCard label="Exámenes mes" value={kpis.exams_this_month} icon={TrendingUp} />
          <KpiCard
            label="Costo LLM mes"
            value={`$${Number(kpis.llm_cost_month).toFixed(2)}`}
            icon={DollarSign}
            sub="USD"
          />
        </div>
      )}

      {/* Top tenants */}
      {kpis?.top_tenants && kpis.top_tenants.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">Top tenants por costo LLM</h2>
          <div className="space-y-2">
            {kpis.top_tenants.map((t, i) => (
              <div key={t.tenant_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="font-medium">{t.tenant_name}</span>
                </div>
                <span className="text-muted-foreground">${Number(t.cost).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenants table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Tenants ({tenants.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Slug</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{t.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{t.slug}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.plan_name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_VARIANT[t.status] ?? "outline"}>{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
