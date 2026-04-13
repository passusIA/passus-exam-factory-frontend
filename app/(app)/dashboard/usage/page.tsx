"use client";

import { useEffect, useState } from "react";
import { api, Exam, ExamUsage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BarChart2, Loader2, XCircle, ChevronDown, ChevronRight,
  Coins, Cpu, TrendingUp, AlertCircle,
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("es-CL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${fmt(n / 1_000_000, 1)}M`;
  if (n >= 1_000) return `${fmt(n / 1_000, 1)}K`;
  return String(n);
}

function fmtCost(usd: number) {
  if (usd < 0.01) return `< $0.01`;
  return `$${fmt(usd, 4)}`;
}

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-background p-4",
      accent && "border-primary/30 bg-primary/5"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className={cn("text-2xl font-bold mt-1", accent ? "text-primary" : "text-foreground")}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
          accent ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} />
        </div>
      </div>
    </div>
  );
}

// ── Exam Usage Row ───────────────────────────────────────────────────────────

function ExamUsageRow({
  exam, maxCost,
}: {
  exam: Exam & { usage: ExamUsage | null };
  maxCost: number;
}) {
  const [open, setOpen] = useState(false);
  const u = exam.usage;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="shrink-0">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{exam.name}</span>
            <span className={cn(
              "shrink-0 text-xs px-2 py-0.5 rounded-full",
              exam.status === "done" ? "bg-green-50 text-green-700" :
              exam.status === "failed" ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"
            )}>{exam.status}</span>
          </div>
          {u && (
            <div className="mt-1.5">
              <ProgressBar value={u.total_cost_usd} max={maxCost} color="bg-primary" />
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          {u ? (
            <>
              <p className="text-sm font-semibold text-foreground">{fmtCost(u.total_cost_usd)}</p>
              <p className="text-xs text-muted-foreground">{fmtTokens(u.total_tokens)} tok</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          )}
        </div>
      </button>

      {/* Expanded: per-agent breakdown */}
      {open && u && u.by_agent.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">Agente</th>
                <th className="text-left pb-2 font-medium">Modelo</th>
                <th className="text-right pb-2 font-medium">Tokens entrada</th>
                <th className="text-right pb-2 font-medium">Tokens salida</th>
                <th className="text-right pb-2 font-medium">Costo USD</th>
                <th className="text-right pb-2 font-medium">Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {u.by_agent.map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 font-medium text-foreground">{row.agent}</td>
                  <td className="py-1.5 text-muted-foreground font-mono">{row.model_id}</td>
                  <td className="py-1.5 text-right">{row.tokens_input.toLocaleString()}</td>
                  <td className="py-1.5 text-right">{row.tokens_output.toLocaleString()}</td>
                  <td className="py-1.5 text-right font-semibold">{fmtCost(row.cost_usd)}</td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {row.duration_ms >= 1000 ? `${(row.duration_ms / 1000).toFixed(1)}s` : `${row.duration_ms}ms`}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold text-foreground">
                <td className="pt-2" colSpan={2}>Total</td>
                <td className="pt-2 text-right">{u.total_tokens_input.toLocaleString()}</td>
                <td className="pt-2 text-right">{u.total_tokens_output.toLocaleString()}</td>
                <td className="pt-2 text-right">{fmtCost(u.total_cost_usd)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {open && u && u.by_agent.length === 0 && (
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Sin datos de agentes para este examen.
        </div>
      )}
      {open && !u && (
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          No se encontraron registros de uso para este examen.
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

type ExamWithUsage = Exam & { usage: ExamUsage | null };

export default function UsagePage() {
  const [data, setData] = useState<ExamWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const exams = await api.listExams();
        // Only fetch usage for exams that have run (not draft)
        const withUsage = await Promise.all(
          exams.map(async (exam): Promise<ExamWithUsage> => {
            if (exam.status === "draft") return { ...exam, usage: null };
            try {
              const usage = await api.getExamUsage(exam.id);
              return { ...exam, usage };
            } catch {
              return { ...exam, usage: null };
            }
          })
        );
        // Sort by cost desc
        withUsage.sort((a, b) => (b.usage?.total_cost_usd ?? 0) - (a.usage?.total_cost_usd ?? 0));
        setData(withUsage);
        setError(null);
      } catch (e: any) {
        setError(e.message ?? "Error al cargar datos de uso");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalCost = data.reduce((s, e) => s + (e.usage?.total_cost_usd ?? 0), 0);
  const totalTokens = data.reduce((s, e) => s + (e.usage?.total_tokens ?? 0), 0);
  const totalTokensIn = data.reduce((s, e) => s + (e.usage?.total_tokens_input ?? 0), 0);
  const totalTokensOut = data.reduce((s, e) => s + (e.usage?.total_tokens_output ?? 0), 0);
  const examsWithUsage = data.filter((e) => e.usage !== null).length;
  const maxCost = Math.max(...data.map((e) => e.usage?.total_cost_usd ?? 0), 0.0001);

  const avgCost = examsWithUsage > 0 ? totalCost / examsWithUsage : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Uso y costos</h1>
            <p className="text-sm text-muted-foreground">Consumo de tokens y costos por proyecto</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <XCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KpiCard
                label="Costo total"
                value={fmtCost(totalCost)}
                sub="todos los proyectos"
                icon={Coins}
                accent
              />
              <KpiCard
                label="Tokens totales"
                value={fmtTokens(totalTokens)}
                sub={`${fmtTokens(totalTokensIn)} entrada / ${fmtTokens(totalTokensOut)} salida`}
                icon={Cpu}
              />
              <KpiCard
                label="Proyectos con uso"
                value={String(examsWithUsage)}
                sub={`de ${data.length} en total`}
                icon={TrendingUp}
              />
              <KpiCard
                label="Costo promedio"
                value={fmtCost(avgCost)}
                sub="por proyecto ejecutado"
                icon={BarChart2}
              />
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Los costos mostrados son estimaciones basadas en precios públicos de los modelos.
                Pueden diferir de la facturación real del proveedor.
              </p>
            </div>

            {/* Per-exam breakdown */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Desglose por proyecto</h2>
              {data.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No hay datos de uso todavía.
                </p>
              ) : (
                data.map((exam) => (
                  <ExamUsageRow key={exam.id} exam={exam} maxCost={maxCost} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
