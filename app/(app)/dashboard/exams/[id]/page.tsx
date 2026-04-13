"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type Exam, type Question, type ExamUsage } from "@/lib/api";
import { useRightPanel } from "@/components/layout/RightPanelContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Play, CheckCircle2, XCircle, Star, AlertCircle,
  Loader2, ChevronDown, ChevronUp, ThumbsUp, Square, Zap, DollarSign,
  Clock, FileText, Brain, Sparkles, ShieldCheck, UserCheck, Send,
  RotateCcw, Download,
} from "lucide-react";
import Link from "next/link";

// ── Stage definitions ─────────────────────────────────────────────────────────

const STAGE_GROUPS = [
  {
    id: "inputs",   label: "Insumos",     icon: FileText,   color: "blue",
    desc: "Carga y procesamiento del material de estudio",
    techStatuses: ["ingesting"],
    agents: ["IngestionAgent"],
  },
  {
    id: "analysis", label: "Análisis",    icon: Brain,      color: "indigo",
    desc: "Mapa de conocimiento y diseño del blueprint",
    techStatuses: ["analyzing", "blueprinting"],
    agents: ["BlueprintResolverAgent", "BlueprintAgent"],
  },
  {
    id: "generation", label: "Generación", icon: Sparkles, color: "violet",
    desc: "Creación y validación de preguntas",
    techStatuses: ["generating", "validating"],
    agents: ["GeneratorAgent", "DistractorValidatorAgent"],
  },
  {
    id: "quality",  label: "Calidad IA",  icon: ShieldCheck, color: "amber",
    desc: "Revisión técnica, sesgo y cobertura QA",
    techStatuses: ["reviewing", "bias_check", "coverage", "qa_review"],
    agents: ["TechnicalReviewerAgent", "BiasCheckerAgent", "BlueprintCoverageAgent", "QaAgent"],
  },
  {
    id: "human",    label: "Rev. humana", icon: UserCheck,  color: "orange",
    desc: "Aprobación humana del banco de ítems",
    techStatuses: ["awaiting_review"],
    agents: [],
  },
  {
    id: "publish",  label: "Publicación", icon: Send,       color: "emerald",
    desc: "Ensamblaje y publicación final del examen",
    techStatuses: ["publishing", "done"],
    agents: ["PublishingAgent"],
  },
] as const;

const PIPELINE_STATUSES = new Set([
  "ingesting","analyzing","blueprinting","generating",
  "validating","reviewing","bias_check","coverage","qa_review","publishing",
]);

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string; }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-500" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  violet:  { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-500" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  dot: "bg-orange-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
};

type StageStatus = "pending" | "running" | "done" | "error" | "waiting" | "cancelled";

function getStageStatus(
  stage: typeof STAGE_GROUPS[number],
  examStatus: string,
  log: Exam["pipeline_log_json"]
): StageStatus {
  const isCurrentlyRunning = stage.techStatuses.includes(examStatus as never);
  const logMap = new Map(log?.map(e => [e.step, e.status]) ?? []);

  const hasError = stage.techStatuses.some(s => logMap.get(s) === "error");
  if (hasError) return "error";

  const allDone = stage.techStatuses.every(s =>
    logMap.get(s) === "ok" || s === "done" && examStatus === "done"
  );
  if (examStatus === "done" && stage.id === "publish") return "done";
  if (allDone && stage.techStatuses.length > 0) return "done";

  if (isCurrentlyRunning) return "running";
  if (examStatus === "awaiting_review" && stage.id === "human") return "waiting";
  if (examStatus === "cancelled") return "cancelled";

  return "pending";
}

// ── Stage Detail Panel ────────────────────────────────────────────────────────

function StageDetailPanel({
  stage, stageStatus, log, usage,
}: {
  stage: typeof STAGE_GROUPS[number];
  stageStatus: StageStatus;
  log: Exam["pipeline_log_json"];
  usage: ExamUsage | null;
}) {
  const Icon = stage.icon;
  const c = COLOR_MAP[stage.color];

  const stageUsage = usage?.by_agent.filter(a =>
    stage.agents.some(ag => a.agent.includes(ag) || ag.includes(a.agent.split(".").pop() ?? ""))
  ) ?? [];

  const stageCost = stageUsage.reduce((s, a) => s + a.cost_usd, 0);
  const stageTokens = stageUsage.reduce((s, a) => s + a.tokens_input + a.tokens_output, 0);

  const logEntries = log?.filter(e => stage.techStatuses.includes(e.step as never)) ?? [];

  return (
    <div className="space-y-4">
      {/* Stage header */}
      <div className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.bg} border ${c.border}`}>
            <Icon className={`h-4 w-4 ${c.text}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${c.text}`}>{stage.label}</p>
            <p className="text-xs text-muted-foreground">{stage.desc}</p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${c.border} ${c.text}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${c.dot} ${stageStatus === "running" ? "animate-pulse" : ""}`} />
          {stageStatus === "running" ? "En ejecución"
            : stageStatus === "done" ? "Completado"
            : stageStatus === "error" ? "Error"
            : stageStatus === "waiting" ? "Esperando aprobación"
            : stageStatus === "cancelled" ? "Cancelado"
            : "Pendiente"}
        </div>
      </div>

      {/* Agents */}
      {stage.agents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Agentes</p>
          <div className="space-y-1.5">
            {stage.agents.map(agent => {
              const agentUsage = usage?.by_agent.find(a => a.agent.includes(agent.replace("Agent","")) || agent.includes(a.agent));
              return (
                <div key={agent} className="rounded-lg border border-border bg-card p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{agent.replace("Agent","")}</span>
                    {agentUsage && (
                      <span className="text-amber-600 font-medium">${agentUsage.cost_usd.toFixed(4)}</span>
                    )}
                  </div>
                  {agentUsage && (
                    <div className="flex gap-3 text-muted-foreground">
                      <span>{(agentUsage.tokens_input + agentUsage.tokens_output).toLocaleString()} tok</span>
                      <span>{agentUsage.duration_ms < 1000 ? `${agentUsage.duration_ms}ms` : `${(agentUsage.duration_ms/1000).toFixed(1)}s`}</span>
                      <span className="truncate">{agentUsage.model_id.split("/").pop()}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics */}
      {stageUsage.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Métricas</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Tokens</p>
              <p className="text-sm font-bold text-foreground">{stageTokens.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Costo</p>
              <p className="text-sm font-bold text-foreground">${stageCost.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Log entries */}
      {logEntries.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Registro</p>
          <div className="space-y-1">
            {logEntries.map((entry, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs rounded-md px-2 py-1.5 ${
                entry.status === "ok" ? "bg-emerald-50 text-emerald-700"
                : entry.status === "error" ? "bg-red-50 text-red-700"
                : "bg-muted text-muted-foreground"
              }`}>
                {entry.status === "ok"
                  ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                  : <XCircle className="h-3 w-3 shrink-0" />
                }
                <span className="flex-1">{entry.step}</span>
                <span className="text-muted-foreground">{new Date(entry.ts).toLocaleTimeString("es-CL")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stage.id === "human" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">Checkpoint de aprobación</p>
          <p>Revisa las preguntas generadas y aprueba el banco completo para continuar con la publicación.</p>
        </div>
      )}
    </div>
  );
}

// ── Stage Card ────────────────────────────────────────────────────────────────

function StageCard({
  stage, stageStatus, isLast, onClick,
}: {
  stage: typeof STAGE_GROUPS[number];
  stageStatus: StageStatus;
  isLast: boolean;
  onClick: () => void;
}) {
  const Icon = stage.icon;
  const c = COLOR_MAP[stage.color];

  const cardBg =
    stageStatus === "done" ? "bg-emerald-50 border-emerald-200"
    : stageStatus === "running" ? `${c.bg} ${c.border} ring-2 ring-offset-1 ring-blue-400`
    : stageStatus === "waiting" ? "bg-amber-50 border-amber-300"
    : stageStatus === "error" ? "bg-red-50 border-red-300"
    : "bg-card border-border";

  return (
    <div className="flex items-center gap-0">
      <button
        onClick={onClick}
        className={`relative flex-1 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${cardBg} group min-w-0`}
      >
        {/* Status indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
            stageStatus === "done" ? "bg-emerald-100"
            : stageStatus === "running" ? `${c.bg} ${c.border} border`
            : stageStatus === "error" ? "bg-red-100"
            : "bg-muted"
          }`}>
            {stageStatus === "done"
              ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              : stageStatus === "error"
              ? <XCircle className="h-5 w-5 text-red-600" />
              : stageStatus === "running"
              ? <Loader2 className={`h-5 w-5 ${c.text} animate-spin`} />
              : stageStatus === "waiting"
              ? <AlertCircle className="h-5 w-5 text-amber-600" />
              : <Icon className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            stageStatus === "done" ? "bg-emerald-100 text-emerald-700"
            : stageStatus === "running" ? `${c.bg} ${c.text}`
            : stageStatus === "error" ? "bg-red-100 text-red-700"
            : stageStatus === "waiting" ? "bg-amber-100 text-amber-700"
            : "bg-muted text-muted-foreground"
          }`}>
            {stageStatus === "running" ? "Activo"
              : stageStatus === "done" ? "Listo"
              : stageStatus === "error" ? "Error"
              : stageStatus === "waiting" ? "Revisión"
              : stageStatus === "cancelled" ? "Cancelado"
              : "Pendiente"}
          </div>
        </div>

        <p className="text-sm font-semibold text-foreground mb-0.5">{stage.label}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{stage.desc}</p>

        {/* Hover cue */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-primary">Ver detalle →</span>
        </div>
      </button>

      {/* Connector */}
      {!isLast && (
        <div className="flex items-center px-1 shrink-0">
          <div className={`h-0.5 w-6 ${
            stageStatus === "done" ? "bg-emerald-400" : "bg-border"
          }`} />
          <div className={`h-0 w-0 border-t-4 border-b-4 border-l-8 border-transparent ${
            stageStatus === "done" ? "border-l-emerald-400" : "border-l-border"
          }`} />
        </div>
      )}
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Fácil", medium: "Media", hard: "Difícil" };
const BLOOM_LABEL: Record<string, string> = {
  remember: "Recordar", understand: "Comprender", apply: "Aplicar",
  analyze: "Analizar", evaluate: "Evaluar", create: "Crear",
};

function QuestionCard({ question, onApprove, onReject }: {
  question: Question;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden ${question.bank_only ? "border-border/50 opacity-70" : "border-border"}`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {question.position && !question.bank_only && (
              <span className="text-xs font-semibold text-muted-foreground w-5 shrink-0">#{question.position}</span>
            )}
            {question.bank_only && <Badge variant="outline" className="text-xs">Banco</Badge>}
            <Badge variant="secondary" className="text-xs">{DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}</Badge>
            <Badge variant="outline" className="text-xs">{BLOOM_LABEL[question.bloom_level] ?? question.bloom_level}</Badge>
            {question.quality_score != null && (
              <span className="text-xs text-amber-600 flex items-center gap-0.5 ml-1">
                <Star className="h-3 w-3" />{Number(question.quality_score).toFixed(0)}
              </span>
            )}
            {question.approved === true && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
            {question.approved === false && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
          </div>
          <p className="text-sm text-foreground line-clamp-2">{question.stem}</p>
        </div>
        <span className="shrink-0 text-muted-foreground mt-0.5">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/20">
          <div className="pt-3 space-y-1.5">
            {question.alternatives_json.map((alt, i) => {
              const correct = question.correct_answers_json.includes(alt);
              return (
                <div key={i} className={`text-sm flex items-start gap-2 ${correct ? "text-emerald-700 font-medium" : "text-muted-foreground"}`}>
                  {correct ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <span className="h-4 w-4 shrink-0" />}
                  {alt}
                </div>
              );
            })}
          </div>
          {question.justification && (
            <div className="text-xs text-muted-foreground bg-background rounded-lg p-3 border border-border">
              <span className="font-medium text-foreground">Justificación: </span>{question.justification}
            </div>
          )}
          {question.quality_issues?.length > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
              {question.quality_issues.join(" · ")}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              onClick={() => onApprove(question.id)}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => onReject(question.id)}>
              <XCircle className="h-3.5 w-3.5" /> Rechazar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExamArenaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setPanel } = useRightPanel();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usage, setUsage] = useState<ExamUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"questions" | "qa" | "costs" | "log">("questions");

  const fetchData = useCallback(async () => {
    try {
      const [examData, questionsData, usageData] = await Promise.all([
        api.getExam(id),
        api.listQuestions(id),
        api.getExamUsage(id).catch(() => null),
      ]);
      setExam(examData);
      setQuestions(questionsData);
      setUsage(usageData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!exam || !PIPELINE_STATUSES.has(exam.status)) return;
    const t = setInterval(fetchData, 4000);
    return () => clearInterval(t);
  }, [exam, fetchData]);

  const handleStart = async () => {
    setStarting(true); setError(null);
    try { setExam(await api.startExam(id)); } catch (e: any) { setError(e.message); }
    finally { setStarting(false); }
  };

  const handleApprove = async () => {
    setApproving(true); setError(null);
    try { setExam(await api.approveExam(id)); } catch (e: any) { setError(e.message); }
    finally { setApproving(false); }
  };

  const handleCancel = async () => {
    if (!confirm("¿Cancelar el pipeline en curso?")) return;
    setCancelling(true); setError(null);
    try { setExam(await api.cancelExam(id)); } catch (e: any) { setError(e.message); }
    finally { setCancelling(false); }
  };

  const handleApproveQ = useCallback(async (qId: string) => {
    const updated = await api.approveQuestion(qId);
    setQuestions(prev => prev.map(q => q.id === qId ? updated : q));
  }, []);

  const handleRejectQ = useCallback(async (qId: string) => {
    const updated = await api.rejectQuestion(qId);
    setQuestions(prev => prev.map(q => q.id === qId ? updated : q));
  }, []);

  function openStagePanel(stage: typeof STAGE_GROUPS[number]) {
    if (!exam) return;
    const stageStatus = getStageStatus(stage, exam.status, exam.pipeline_log_json);
    setPanel(stage.label, (
      <StageDetailPanel
        stage={stage}
        stageStatus={stageStatus}
        log={exam.pipeline_log_json}
        usage={usage}
      />
    ));
  }

  if (loading) {
    return (
      <div className="p-6 max-w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {error ?? "Proyecto no encontrado"}
      </div>
    );
  }

  const isPipeline = PIPELINE_STATUSES.has(exam.status);
  const finalQ = questions.filter(q => !q.bank_only);
  const bankQ = questions.filter(q => q.bank_only);
  const approvedCount = finalQ.filter(q => q.approved === true).length;
  const totalCost = usage?.total_cost_usd ?? 0;
  const totalTokens = usage?.total_tokens ?? 0;

  const statusLabel: Record<string, string> = {
    pending: "Pendiente", done: "Publicado", failed: "Fallido",
    cancelled: "Cancelado", awaiting_review: "En revisión",
  };
  const currentStatusLabel = PIPELINE_STATUSES.has(exam.status)
    ? "En ejecución"
    : statusLabel[exam.status] ?? exam.status;

  return (
    <div className="p-6 space-y-6 max-w-full">

      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground truncate">{exam.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              exam.status === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : exam.status === "failed" ? "bg-red-50 text-red-700 border-red-200"
              : exam.status === "awaiting_review" ? "bg-amber-50 text-amber-700 border-amber-200"
              : exam.status === "cancelled" ? "bg-orange-50 text-orange-700 border-orange-200"
              : isPipeline ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-gray-50 text-gray-600 border-gray-200"
            }`}>
              {isPipeline && <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5" />}
              {currentStatusLabel}
            </span>
          </div>
          {exam.description && <p className="text-sm text-muted-foreground mt-0.5">{exam.description}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          {isPipeline && (
            <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
              Cancelar
            </Button>
          )}
          {exam.status === "awaiting_review" && (
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApprove} disabled={approving}>
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
              Aprobar banco
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Pending: listo para iniciar ── */}
      {exam.status === "pending" && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Play className="h-5 w-5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-800">Listo para iniciar</p>
              <p className="text-xs text-blue-600">
                El examen está configurado. Presiona <strong>Iniciar pipeline</strong> para comenzar la generación de preguntas.
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5 shrink-0" onClick={handleStart} disabled={starting}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Iniciar pipeline
          </Button>
        </div>
      )}

      {/* ── Pipeline en ejecución ── */}
      {isPipeline && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Loader2 className="h-5 w-5 text-red-500 animate-spin shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">Pipeline en ejecución</p>
              <p className="text-xs text-red-600 truncate">
                Paso actual: <span className="font-medium">{exam.status}</span>
                {" · "}actualiza cada 4s
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-2 shrink-0 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-semibold transition-colors"
          >
            {cancelling
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Square className="h-4 w-4" />}
            Detener pipeline
          </button>
        </div>
      )}

      {/* Awaiting review banner */}
      {exam.status === "awaiting_review" && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Esperando revisión humana</p>
              <p className="text-xs text-amber-700">Revisa las preguntas en la pestaña inferior y aprueba el banco.</p>
            </div>
          </div>
          <Button
            size="sm"
            className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleApprove}
            disabled={approving}
          >
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
            Aprobar banco
          </Button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Objetivo", value: exam.total_questions, icon: FileText },
          { label: "Generadas", value: questions.length, icon: Sparkles },
          { label: "Aprobadas", value: approvedCount, icon: CheckCircle2 },
          { label: "Banco", value: bankQ.length, icon: Star },
          { label: "Score QA", value: exam.quality_score != null ? `${Number(exam.quality_score).toFixed(0)}/100` : "—", icon: ShieldCheck },
          { label: "Tokens", value: totalTokens > 0 ? `${(totalTokens/1000).toFixed(1)}K` : "—", icon: Zap },
          { label: "Costo", value: totalCost > 0 ? `$${totalCost.toFixed(3)}` : "—", icon: DollarSign },
          { label: "Duración", value: exam.duration_minutes + " min", icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
            <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-base font-bold text-foreground leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Awaiting review banner */}
      {exam.status === "awaiting_review" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Revisión humana requerida — Checkpoint H2</p>
            <p className="text-sm text-amber-700 mt-0.5">Revisa las preguntas generadas abajo. Cuando estés conforme, aprueba el banco para iniciar la publicación.</p>
          </div>
        </div>
      )}

      {/* Pipeline canvas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Pipeline de construcción</h2>
          {isPipeline && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Zap className="h-3 w-3 animate-pulse" /> Actualizando cada 4s
            </span>
          )}
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-stretch gap-0 min-w-max">
            {STAGE_GROUPS.map((stage, i) => (
              <StageCard
                key={stage.id}
                stage={stage}
                stageStatus={getStageStatus(stage, exam.status, exam.pipeline_log_json)}
                isLast={i === STAGE_GROUPS.length - 1}
                onClick={() => openStagePanel(stage)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border mb-4">
          {([
            { id: "questions", label: `Preguntas (${questions.length})` },
            { id: "qa",        label: "QA" },
            { id: "costs",     label: "Costos" },
            { id: "log",       label: "Log" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Questions tab */}
        {activeTab === "questions" && (
          <div className="space-y-4">
            {finalQ.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Examen ({finalQ.length} preguntas)
                </h3>
                {finalQ.map(q => (
                  <QuestionCard key={q.id} question={q} onApprove={handleApproveQ} onReject={handleRejectQ} />
                ))}
              </div>
            )}
            {bankQ.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Banco adicional ({bankQ.length})
                </h3>
                {bankQ.map(q => (
                  <QuestionCard key={q.id} question={q} onApprove={handleApproveQ} onReject={handleRejectQ} />
                ))}
              </div>
            )}
            {questions.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {isPipeline ? "Generando preguntas..." : "Sin preguntas todavía"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* QA tab */}
        {activeTab === "qa" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total evaluadas", value: questions.length, color: "text-foreground" },
              { label: "Aprobadas", value: questions.filter(q => q.approved === true).length, color: "text-emerald-600" },
              { label: "Rechazadas", value: questions.filter(q => q.approved === false).length, color: "text-red-600" },
              { label: "Sin revisar", value: questions.filter(q => q.approved === null || q.approved === undefined).length, color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
            {exam.quality_score != null && (
              <div className="col-span-2 sm:col-span-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Score QA global: {Number(exam.quality_score).toFixed(1)}/100</p>
                  <p className="text-xs text-amber-700">Promedio ponderado de calidad del banco generado</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Costs tab */}
        {activeTab === "costs" && (
          <div className="space-y-4">
            {usage && usage.by_agent.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-xs text-muted-foreground">Costo total</p>
                    <p className="text-xl font-bold text-foreground">${usage.total_cost_usd.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground">USD</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-xs text-muted-foreground">Tokens entrada</p>
                    <p className="text-xl font-bold text-foreground">{usage.total_tokens_input.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-xs text-muted-foreground">Tokens salida</p>
                    <p className="text-xl font-bold text-foreground">{usage.total_tokens_output.toLocaleString()}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="col-span-2">Agente</span>
                    <span>Modelo</span>
                    <span className="text-right">Tokens</span>
                    <span className="text-right">Costo</span>
                  </div>
                  {usage.by_agent.map((a, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 text-sm border-t border-border/50">
                      <span className="col-span-2 font-medium truncate">{a.agent}</span>
                      <span className="text-muted-foreground text-xs truncate">{a.model_id.split("/").pop()}</span>
                      <span className="text-right text-muted-foreground">{(a.tokens_input + a.tokens_output).toLocaleString()}</span>
                      <span className="text-right font-medium text-amber-700">${a.cost_usd.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin datos de uso todavía</p>
              </div>
            )}
          </div>
        )}

        {/* Log tab */}
        {activeTab === "log" && (
          <div className="space-y-1.5">
            {(exam.pipeline_log_json ?? []).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin entradas de log todavía</p>
              </div>
            ) : (
              (exam.pipeline_log_json ?? []).map((entry, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  entry.status === "ok" ? "bg-emerald-50 border border-emerald-200"
                  : entry.status === "error" ? "bg-red-50 border border-red-200"
                  : "bg-muted border border-border"
                }`}>
                  {entry.status === "ok"
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    : entry.status === "error"
                    ? <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <span className="font-medium flex-1">{entry.step}</span>
                  {entry.error && <span className="text-xs text-red-600 truncate max-w-xs">{entry.error}</span>}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(entry.ts).toLocaleTimeString("es-CL")}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
