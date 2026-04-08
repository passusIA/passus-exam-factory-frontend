"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Exam } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Clock, Star, AlertCircle } from "lucide-react";

// ── Status helpers (hoisted — stable references) ──────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", ingesting: "Ingiriendo", analyzing: "Analizando",
  blueprinting: "Diseñando", generating: "Generando", reviewing: "Revisando",
  publishing: "Publicando", done: "Listo", failed: "Error",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  done: "default", failed: "destructive",
  pending: "secondary", ingesting: "secondary", analyzing: "secondary",
  blueprinting: "secondary", generating: "secondary",
  reviewing: "secondary", publishing: "secondary",
};

function ExamStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function ExamCard({ exam }: { exam: Exam }) {
  const isPipeline = !["pending", "done", "failed"].includes(exam.status);

  return (
    <Link href={`/dashboard/exams/${exam.id}`} className="block group">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {exam.name}
              </h3>
            </div>
            {exam.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{exam.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {exam.duration_minutes} min
              </span>
              <span>{exam.total_questions} preguntas</span>
              {exam.quality_score != null && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Star className="h-3 w-3" />
                  {Number(exam.quality_score).toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <ExamStatusBadge status={exam.status} />
          </div>
        </div>

        {isPipeline && (
          <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        )}
      </div>
    </Link>
  );
}

function ExamCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listExams()
      .then(setExams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Poll running exams every 5s
  useEffect(() => {
    const hasRunning = exams.some((e) => !["done", "failed", "pending"].includes(e.status));
    if (!hasRunning) return;

    const timer = setInterval(() => {
      api.listExams().then(setExams).catch(() => {});
    }, 5000);

    return () => clearInterval(timer);
  }, [exams]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Exámenes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Cargando..." : `${exams.length} examen${exams.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <Link href="/dashboard/exams/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo examen
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <ExamCardSkeleton key={i} />)}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin exámenes todavía</p>
          <p className="text-sm mt-1">Crea tu primer examen para empezar</p>
          <Link href="/dashboard/exams/new" className="mt-4 inline-block">
            <Button size="sm" variant="outline" className="gap-1.5 mt-3">
              <Plus className="h-4 w-4" />
              Crear examen
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {exams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      )}
    </div>
  );
}
