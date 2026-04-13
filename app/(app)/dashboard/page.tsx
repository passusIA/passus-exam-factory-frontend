"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Exam } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Layers, AlertCircle, CheckCircle2, Clock, Zap,
  DollarSign, BarChart2, TrendingUp, RefreshCw, ChevronRight,
  GitBranch, XCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TenantStats {
  exams_active: number;
  exams_review: number;
  exams_done: number;
  exams_failed: number;
  exams_total: number;
  cost_month_usd: number;
  tokens_month: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PIPELINE_STATUSES = new Set([
  "ingesting","analyzing","blueprinting","generating",
  "validating","reviewing","bias_check","coverage","qa_review","publishing",
]);

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", ingesting: "Ingiriendo", analyzing: "Analizando",
  blueprinting: "Diseñando", generating: "Generando", validating: "Validando",
  reviewing: "Revisando", bias_check: "Sesgo", coverage: "Cobertura",
  qa_review: "QA", awaiting_review: "En revisión", publishing: "Publicando",
  done: "Publicado", failed: "Error", cancelled: "Cancelado",
};

function statusColor(status: string) {
  if (PIPELINE_STATUSES.has(status)) return "text-blue-600 bg-blue-50 border-blue-200";
  if (status === "awaiting_review") return "text-amber-600 bg-amber-50 border-amber-200";
  if (status === "done") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (status === "failed") return "text-red-600 bg-red-50 border-red-200";
  if (status === "cancelled") return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-gray-500 bg-gray-50 border-gray-200";
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent ?? "bg-muted"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ProjectCard({ exam }: { exam: Exam }) {
  const running = PIPELINE_STATUSES.has(exam.status);
  const pct = exam.pipeline_log_json
    ? Math.min(100, Math.round((exam.pipeline_log_json.filter(s => s.status === "ok").length / 9) * 100))
    : 0;

  return (
    <Link href={`/dashboard/exams/${exam.id}`} className="block group">
      <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {exam.name}
            </p>
            {exam.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{exam.description}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${statusColor(exam.status)}`}>
            {STATUS_LABEL[exam.status] ?? exam.status}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {exam.total_questions} preguntas
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {exam.duration_minutes} min
          </span>
          <span className="ml-auto">{relativeTime(exam.updated_at ?? exam.created_at)}</span>
        </div>

        {/* Progress bar */}
        {(running || exam.status === "done") && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {running
                  ? <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-blue-500 animate-pulse" />{STATUS_LABEL[exam.status]}</span>
                  : "Completado"}
              </span>
              <span className="font-medium text-foreground">{exam.status === "done" ? 100 : pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${exam.status === "done" ? "bg-emerald-500" : "bg-blue-500"} ${running ? "animate-pulse" : ""}`}
                style={{ width: `${exam.status === "done" ? 100 : Math.max(pct, 8)}%` }}
              />
            </div>
          </div>
        )}

        {exam.status === "awaiting_review" && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-md px-2 py-1.5 border border-amber-200">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Requiere revisión humana
          </div>
        )}

        {exam.status === "failed" && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-md px-2 py-1.5 border border-red-200">
            <XCircle className="h-3 w-3 shrink-0" />
            Pipeline falló
          </div>
        )}
      </div>
    </Link>
  );
}

function ActivityItem({ exam }: { exam: Exam }) {
  const lastLog = exam.pipeline_log_json?.slice(-1)[0];
  if (!lastLog) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
        lastLog.status === "ok" ? "bg-emerald-100"
        : lastLog.status === "error" ? "bg-red-100"
        : "bg-blue-100"
      }`}>
        {lastLog.status === "ok"
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          : lastLog.status === "error"
          ? <XCircle className="h-3.5 w-3.5 text-red-600" />
          : <Zap className="h-3.5 w-3.5 text-blue-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate font-medium">{exam.name}</p>
        <p className="text-xs text-muted-foreground">
          {STATUS_LABEL[lastLog.step] ?? lastLog.step} — {lastLog.status === "ok" ? "completado" : lastLog.status}
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{relativeTime(lastLog.ts)}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.listExams(),
      fetch("/api/v1/tenants/me/stats", {
        headers: { "Content-Type": "application/json" },
      }).then(r => r.json()).catch(() => null),
    ])
      .then(([examList, statsData]) => {
        setExams(examList);
        setStats(statsData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Derive stats from exams if API stats unavailable
  const kpis = stats ?? {
    exams_active: exams.filter(e => PIPELINE_STATUSES.has(e.status)).length,
    exams_review: exams.filter(e => e.status === "awaiting_review").length,
    exams_done: exams.filter(e => e.status === "done").length,
    exams_failed: exams.filter(e => e.status === "failed").length,
    exams_total: exams.length,
    cost_month_usd: 0,
    tokens_month: 0,
  };

  const activeExams = exams.filter(e => PIPELINE_STATUSES.has(e.status));
  const reviewExams = exams.filter(e => e.status === "awaiting_review");
  const failedExams = exams.filter(e => e.status === "failed");
  const recentExams = [...exams].sort(
    (a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()
  ).slice(0, 8);
  const withLogs = exams.filter(e => e.pipeline_log_json?.length > 0)
    .sort((a, b) => {
      const ta = a.pipeline_log_json?.slice(-1)[0]?.ts ?? a.created_at;
      const tb = b.pipeline_log_json?.slice(-1)[0]?.ts ?? b.created_at;
      return new Date(tb).getTime() - new Date(ta).getTime();
    }).slice(0, 6);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Passus Exam Factory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? "Cargando..."
              : `${kpis.exams_active} proyecto${kpis.exams_active !== 1 ? "s" : ""} en ejecución · ${kpis.exams_review} en revisión`
            }
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/dashboard/exams">
            <Button variant="outline" size="sm" className="gap-1.5">
              <GitBranch className="h-4 w-4" />
              Ver proyectos
            </Button>
          </Link>
          <Link href="/dashboard/exams/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="En ejecución"    value={kpis.exams_active}  icon={Zap}        accent="bg-blue-100 text-blue-600" />
          <KpiCard label="En revisión"     value={kpis.exams_review}  icon={AlertCircle} accent="bg-amber-100 text-amber-600" />
          <KpiCard label="Publicados"      value={kpis.exams_done}    icon={CheckCircle2} accent="bg-emerald-100 text-emerald-600" />
          <KpiCard label="Fallidos"        value={kpis.exams_failed}  icon={XCircle}     accent="bg-red-100 text-red-600" />
          <KpiCard
            label="Costo del mes"
            value={kpis.cost_month_usd > 0 ? `$${kpis.cost_month_usd.toFixed(3)}` : "$0.00"}
            sub="USD estimado"
            icon={DollarSign}
            accent="bg-purple-100 text-purple-600"
          />
          <KpiCard
            label="Tokens del mes"
            value={kpis.tokens_month > 0 ? (kpis.tokens_month / 1000).toFixed(1) + "K" : "0"}
            sub="total consumidos"
            icon={BarChart2}
            accent="bg-orange-100 text-orange-600"
          />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Projects in progress — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Proyectos recientes</h2>
            <Link href="/dashboard/exams" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          ) : recentExams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Layers className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">Sin proyectos todavía</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Crea tu primer proyecto para empezar</p>
              <Link href="/dashboard/exams/new">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Nuevo proyecto
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentExams.map(e => <ProjectCard key={e.id} exam={e} />)}
            </div>
          )}
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">

          {/* Alerts */}
          {(reviewExams.length > 0 || failedExams.length > 0) && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Alertas</h2>
              <div className="space-y-2">
                {reviewExams.map(e => (
                  <Link key={e.id} href={`/dashboard/exams/${e.id}`}>
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 hover:border-amber-400 transition-colors">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-800 truncate">{e.name}</p>
                        <p className="text-xs text-amber-700">Requiere aprobación humana</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {failedExams.map(e => (
                  <Link key={e.id} href={`/dashboard/exams/${e.id}`}>
                    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 hover:border-red-400 transition-colors">
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-red-800 truncate">{e.name}</p>
                        <p className="text-xs text-red-700">Pipeline falló — revisar logs</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Activity feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Actividad reciente</h2>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : withLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin actividad reciente</p>
            ) : (
              <div className="rounded-xl border border-border bg-card p-3">
                {withLogs.map(e => <ActivityItem key={e.id} exam={e} />)}
              </div>
            )}
          </div>

          {/* Quick link to usage */}
          <Link href="/dashboard/usage">
            <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BarChart2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Uso y costos</p>
                    <p className="text-xs text-muted-foreground">Tokens y gasto por proyecto</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
