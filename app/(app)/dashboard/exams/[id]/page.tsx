"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type Exam, type Question, type ExamExport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Play, Download, CheckCircle2, XCircle,
  Star, AlertCircle, Loader2, ChevronDown, ChevronUp, ThumbsUp,
} from "lucide-react";
import Link from "next/link";

// ── Pipeline step labels ───────────────────────────────────────────────────────
const PIPELINE_STEPS = ["ingesting","analyzing","blueprinting","generating","reviewing","awaiting_review","publishing","done"];
const STEP_LABEL: Record<string, string> = {
  ingesting: "Ingiriendo", analyzing: "Analizando", blueprinting: "Diseñando",
  generating: "Generando", reviewing: "Revisando", awaiting_review: "Revisión humana",
  publishing: "Publicando", done: "Completo",
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Fácil", medium: "Media", hard: "Difícil" };
const BLOOM_LABEL: Record<string, string> = {
  remember: "Recordar", understand: "Comprender", apply: "Aplicar",
  analyze: "Analizar", evaluate: "Evaluar", create: "Crear",
};
const FORMAT_EXT: Record<string, string> = { excel: "xlsx", csv: "csv", json: "json", pdf: "pdf", qti: "xml" };

// ── Sub-components (defined at module level — no inline components) ────────────

function PipelineProgress({ status }: { status: string }) {
  const currentIdx = PIPELINE_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PIPELINE_STEPS.map((step, i) => {
        const done = i < currentIdx || status === "done";
        const active = step === status && status !== "done";
        const failed = status === "failed" && i === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              done ? "bg-accent/10 text-accent border-accent/20"
              : active ? "bg-primary/10 text-primary border-primary/30 animate-pulse"
              : failed ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-muted text-muted-foreground border-border"
            }`}>
              {STEP_LABEL[step] ?? step}
            </span>
            {i < PIPELINE_STEPS.length - 1 && (
              <span className="text-muted-foreground text-xs">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuestionRow({ question, onApprove, onReject }: {
  question: Question;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg overflow-hidden ${question.bank_only ? "border-border opacity-70" : "border-border"}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {question.position && !question.bank_only && (
              <span className="text-xs font-semibold text-muted-foreground">#{question.position}</span>
            )}
            {question.bank_only && (
              <Badge variant="outline" className="text-xs">Banco</Badge>
            )}
            <Badge variant="secondary" className="text-xs">{DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}</Badge>
            <Badge variant="outline" className="text-xs">{BLOOM_LABEL[question.bloom_level] ?? question.bloom_level}</Badge>
            {question.quality_score != null && (
              <span className="text-xs text-amber-600 flex items-center gap-0.5">
                <Star className="h-3 w-3" />{Number(question.quality_score).toFixed(0)}
              </span>
            )}
            {question.approved === true && <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />}
            {question.approved === false && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
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
              const isCorrect = question.correct_answers_json.includes(alt);
              return (
                <div key={i} className={`text-sm flex items-start gap-2 ${isCorrect ? "text-accent font-medium" : "text-muted-foreground"}`}>
                  {isCorrect ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <span className="h-4 w-4 shrink-0" />}
                  {alt}
                </div>
              );
            })}
          </div>

          {question.justification && (
            <div className="text-xs text-muted-foreground bg-background rounded-md p-3 border border-border">
              <span className="font-medium text-foreground">Justificación: </span>
              {question.justification}
            </div>
          )}

          {question.quality_issues?.length > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 rounded-md p-2">
              {question.quality_issues.join(" · ")}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-accent border-accent/30 hover:bg-accent/10"
              onClick={() => onApprove(question.id)}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onReject(question.id)}>
              <XCircle className="h-3.5 w-3.5" /> Rechazar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportButton({ examId }: { examId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [exports, setExports] = useState<ExamExport[]>([]);

  useEffect(() => {
    api.listExports(examId).then(setExports).catch(() => {});
  }, [examId]);

  async function trigger(fmt: string) {
    setLoading(fmt);
    try {
      const exp = await api.triggerExport(examId, fmt);
      setExports((prev) => [exp, ...prev]);
    } catch {}
    setLoading(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {["pdf", "excel", "csv", "json", "qti"].map((fmt) => (
          <Button key={fmt} size="sm" variant="outline" className="gap-1.5 uppercase text-xs"
            disabled={loading === fmt}
            onClick={() => trigger(fmt)}>
            {loading === fmt ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {fmt}
          </Button>
        ))}
      </div>

      {exports.length > 0 && (
        <div className="space-y-1.5">
          {exports.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs bg-card">
              <span className="font-medium uppercase text-muted-foreground">{exp.format}</span>
              {exp.download_url ? (
                <a href={exp.download_url} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1">
                  <Download className="h-3 w-3" /> Descargar
                </a>
              ) : (
                <span className="text-muted-foreground animate-pulse">Generando…</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [examData, questionsData] = await Promise.all([
        api.getExam(id),
        api.listQuestions(id),
      ]);
      setExam(examData);
      setQuestions(questionsData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll while pipeline is running (no polling en awaiting_review: espera acción humana)
  useEffect(() => {
    if (!exam) return;
    if (["done", "failed", "pending", "awaiting_review"].includes(exam.status)) return;

    const timer = setInterval(fetchData, 4000);
    return () => clearInterval(timer);
  }, [exam, fetchData]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const updated = await api.startExam(id);
      setExam(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  };

  const handleApproveExam = async () => {
    setApproving(true);
    setError(null);
    try {
      const updated = await api.approveExam(id);
      setExam(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApproving(false);
    }
  };

  const handleApprove = useCallback(async (qId: string) => {
    const updated = await api.approveQuestion(qId);
    setQuestions((prev) => prev.map((q) => q.id === qId ? updated : q));
  }, []);

  const handleReject = useCallback(async (qId: string) => {
    const updated = await api.rejectQuestion(qId);
    setQuestions((prev) => prev.map((q) => q.id === qId ? updated : q));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {error ?? "Examen no encontrado"}
      </div>
    );
  }

  const finalQuestions = questions.filter((q) => !q.bank_only);
  const bankQuestions = questions.filter((q) => q.bank_only);
  const isPipeline = !["pending", "done", "failed", "awaiting_review"].includes(exam.status);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{exam.name}</h1>
          {exam.description && <p className="text-sm text-muted-foreground mt-0.5">{exam.description}</p>}
        </div>
      </div>

      {/* Meta + acciones */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{exam.total_questions} preguntas · {exam.duration_minutes} min</span>
          {exam.quality_score != null && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Star className="h-4 w-4" />
              Calidad: {Number(exam.quality_score).toFixed(1)}/100
            </span>
          )}
          <Badge variant={exam.status === "done" ? "default" : exam.status === "failed" ? "destructive" : "secondary"}>
            {exam.status}
          </Badge>
        </div>

        {isPipeline && <PipelineProgress status={exam.status} />}

        {exam.status === "pending" && (
          <Button size="sm" className="gap-1.5" onClick={handleStart} disabled={starting}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Iniciar generación
          </Button>
        )}

        {exam.status === "awaiting_review" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Revisión humana requerida (Checkpoint H2)</p>
                <p className="text-amber-700 mt-0.5">
                  Revisa las preguntas generadas abajo. Cuando estés conforme, aprueba el banco
                  para iniciar la publicación final.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleApproveExam}
              disabled={approving}
            >
              {approving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ThumbsUp className="h-4 w-4" />
              }
              Aprobar banco y publicar
            </Button>
          </div>
        )}

        {exam.status === "failed" && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            El pipeline falló. Revisa los logs del examen.
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Exportaciones */}
      {exam.status === "done" && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-semibold">Exportar examen</h2>
          <ExportButton examId={id} />
        </div>
      )}

      {/* Preguntas finales */}
      {finalQuestions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            Preguntas del examen ({finalQuestions.length})
          </h2>
          {finalQuestions.map((q) => (
            <QuestionRow key={q.id} question={q} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}

      {/* Banco */}
      {bankQuestions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Banco adicional ({bankQuestions.length})
          </h2>
          {bankQuestions.map((q) => (
            <QuestionRow key={q.id} question={q} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}

      {questions.length === 0 && exam.status === "done" && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No hay preguntas generadas.
        </div>
      )}
    </div>
  );
}
