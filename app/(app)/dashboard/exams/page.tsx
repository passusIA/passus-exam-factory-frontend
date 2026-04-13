"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Exam } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Plus, Search, Filter, Layers, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, MoreHorizontal, Play,
  Trash2, Eye, RefreshCw,
} from "lucide-react";

// ── Status helpers ──────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:          { label: "Borrador",     color: "text-muted-foreground bg-muted",          icon: Layers },
  ingesting:      { label: "Ingiriendo",   color: "text-blue-700 bg-blue-50",                icon: Loader2 },
  analyzing:      { label: "Analizando",   color: "text-blue-700 bg-blue-50",                icon: Loader2 },
  blueprinting:   { label: "Blueprint",    color: "text-violet-700 bg-violet-50",            icon: Loader2 },
  generating:     { label: "Generando",    color: "text-violet-700 bg-violet-50",            icon: Loader2 },
  validating:     { label: "Validando",    color: "text-violet-700 bg-violet-50",            icon: Loader2 },
  reviewing:      { label: "Revisando IA", color: "text-amber-700 bg-amber-50",              icon: Loader2 },
  bias_check:     { label: "Bias check",   color: "text-amber-700 bg-amber-50",              icon: Loader2 },
  coverage:       { label: "Cobertura",    color: "text-amber-700 bg-amber-50",              icon: Loader2 },
  qa_review:      { label: "QA Review",    color: "text-amber-700 bg-amber-50",              icon: Loader2 },
  awaiting_review:{ label: "Rev. humana",  color: "text-orange-700 bg-orange-50",            icon: Clock },
  publishing:     { label: "Publicando",   color: "text-green-700 bg-green-50",              icon: Loader2 },
  done:           { label: "Publicado",    color: "text-green-700 bg-green-50",              icon: CheckCircle2 },
  failed:         { label: "Fallido",      color: "text-red-700 bg-red-50",                  icon: XCircle },
  cancelled:      { label: "Cancelado",    color: "text-muted-foreground bg-muted",          icon: XCircle },
};

const RUNNING_STATUSES = new Set([
  "ingesting","analyzing","blueprinting","generating",
  "validating","reviewing","bias_check","coverage","qa_review","publishing",
]);

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "text-muted-foreground bg-muted", icon: AlertCircle };
  const Icon = meta.icon;
  const spinning = RUNNING_STATUSES.has(status);
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", meta.color)}>
      <Icon className={cn("h-3 w-3", spinning && "animate-spin")} />
      {meta.label}
    </span>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

// ── Filter tabs ─────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "all",      label: "Todos" },
  { key: "running",  label: "En ejecución" },
  { key: "review",   label: "En revisión" },
  { key: "done",     label: "Publicados" },
  { key: "failed",   label: "Fallidos" },
  { key: "draft",    label: "Borradores" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

function applyFilter(exams: Exam[], filter: FilterKey): Exam[] {
  switch (filter) {
    case "running":  return exams.filter((e) => RUNNING_STATUSES.has(e.status));
    case "review":   return exams.filter((e) => e.status === "awaiting_review");
    case "done":     return exams.filter((e) => e.status === "done");
    case "failed":   return exams.filter((e) => e.status === "failed" || e.status === "cancelled");
    case "draft":    return exams.filter((e) => e.status === "draft");
    default:         return exams;
  }
}

// ── ExamRow ─────────────────────────────────────────────────────────────────

function ExamRow({ exam, onRefresh }: { exam: Exam; onRefresh: () => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const lastStep = exam.pipeline_log_json?.at(-1);

  async function handleStart(e: React.MouseEvent) {
    e.stopPropagation();
    setStarting(true);
    try {
      await api.startExam(exam.id);
      onRefresh();
    } finally {
      setStarting(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`¿Eliminar "${exam.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await api.deleteExam(exam.id);
      onRefresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <tr
      className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors"
      onClick={() => router.push(`/dashboard/exams/${exam.id}`)}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="font-medium text-sm text-foreground truncate max-w-[280px]">{exam.name}</div>
        {exam.description && (
          <div className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5">{exam.description}</div>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={exam.status} />
      </td>

      {/* Last step */}
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {lastStep ? (
          <span className={lastStep.status === "error" ? "text-red-600" : ""}>
            {lastStep.step}
            {lastStep.status === "error" && " ✗"}
          </span>
        ) : "—"}
      </td>

      {/* Questions */}
      <td className="px-4 py-3 text-sm text-center text-muted-foreground">
        {exam.total_questions ?? "—"}
      </td>

      {/* Score */}
      <td className="px-4 py-3 text-sm text-center">
        {exam.quality_score != null ? (
          <span className={cn(
            "font-semibold",
            exam.quality_score >= 80 ? "text-green-600" :
            exam.quality_score >= 60 ? "text-amber-600" : "text-red-600"
          )}>
            {exam.quality_score}%
          </span>
        ) : "—"}
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {relativeTime(exam.created_at)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 justify-end">
          {exam.status === "draft" && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {starting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Iniciar
            </button>
          )}
          <Link
            href={`/dashboard/exams/${exam.id}`}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Ver detalle"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-background border border-border rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={(e) => { handleDelete(e); setMenuOpen(false); }}
                    disabled={deleting}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await api.listExams();
      setExams(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Error al cargar proyectos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Auto-refresh while any exam is running
  useEffect(() => {
    const hasRunning = exams.some((e) => RUNNING_STATUSES.has(e.status));
    if (!hasRunning) return;
    const t = setInterval(() => load(true), 8000);
    return () => clearInterval(t);
  }, [exams]);

  const filtered = applyFilter(exams, filter).filter((e) =>
    search ? e.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  // Count badges
  const counts: Record<FilterKey, number> = {
    all:     exams.length,
    running: exams.filter((e) => RUNNING_STATUSES.has(e.status)).length,
    review:  exams.filter((e) => e.status === "awaiting_review").length,
    done:    exams.filter((e) => e.status === "done").length,
    failed:  exams.filter((e) => e.status === "failed" || e.status === "cancelled").length,
    draft:   exams.filter((e) => e.status === "draft").length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Proyectos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {exams.length} examen{exams.length !== 1 ? "es" : ""} en total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>
            <Link
              href="/dashboard/exams/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                filter === f.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-normal",
                  filter === f.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <XCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={() => load()} className="text-sm text-primary hover:underline">Reintentar</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "Sin resultados para tu búsqueda" : "No hay proyectos aún"}
            </p>
            {!search && (
              <Link
                href="/dashboard/exams/new"
                className="text-sm text-primary hover:underline"
              >
                Crear tu primer proyecto
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Último paso</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Preguntas</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Score QA</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Creado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((exam) => (
                <ExamRow key={exam.id} exam={exam} onRefresh={() => load(true)} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {!loading && !error && filtered.length > 0 && (
        <div className="border-t border-border px-6 py-2 shrink-0 bg-background">
          <p className="text-xs text-muted-foreground">
            Mostrando {filtered.length} de {exams.length} proyectos
          </p>
        </div>
      )}
    </div>
  );
}
