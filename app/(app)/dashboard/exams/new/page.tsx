"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Folder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_QUESTION_TYPES = { mc: 70, true_false: 20, open: 10 };
const DEFAULT_BLOOM = { remember: 20, understand: 30, apply: 25, analyze: 15, evaluate: 5, create: 5 };

// ── Helpers ───────────────────────────────────────────────────────────────────
function sumValues(obj: Record<string, number>) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

function PercentField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground w-28 shrink-0">{label}</label>
      <input
        type="number" min={0} max={100} step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-primary"
      />
      <span className="text-sm text-muted-foreground">%</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewExamPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [bankSize, setBankSize] = useState(40);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [difficulty, setDifficulty] = useState("mixed");
  const [language, setLanguage] = useState("es");
  const [questionTypes, setQuestionTypes] = useState<Record<string, number>>(DEFAULT_QUESTION_TYPES);
  const [bloom, setBloom] = useState<Record<string, number>>(DEFAULT_BLOOM);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [foldersError, setFoldersError] = useState("");

  useEffect(() => {
    api.listFolders()
      .then((data) => {
        setFolders(data.items);
        if (data.items.length > 0) setFolderId(data.items[0].id);
      })
      .catch((e) => setFoldersError(e.message ?? "Error al cargar carpetas"))
      .finally(() => setLoadingFolders(false));
  }, []);

  const qtSum = sumValues(questionTypes);
  const bloomSum = sumValues(bloom);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (qtSum !== 100) { setError("Los tipos de pregunta deben sumar exactamente 100%"); return; }
    if (bloomSum !== 100) { setError("La distribución Bloom debe sumar exactamente 100%"); return; }
    if (bankSize <= totalQuestions) { setError("El banco de preguntas debe ser mayor que el total de preguntas"); return; }

    setSaving(true);
    try {
      const exam = await api.createExam({
        name: name.trim(),
        description: description.trim() || undefined,
        folder_id: folderId,
        total_questions: totalQuestions,
        bank_size: bankSize,
        duration_minutes: durationMinutes,
        difficulty,
        language,
        config: {
          question_types: questionTypes,
          bloom_distribution: bloom,
        },
        output_schema: {},
      });
      router.push(`/dashboard/exams/${exam.id}`);
    } catch (err: any) {
      setError(err.message ?? "Error al crear examen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Nuevo examen</h1>
      </div>

      <form onSubmit={submit} className="space-y-6">

        {/* Básico */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Información básica</h2>

          <div>
            <label className="text-sm font-medium">Nombre del examen</label>
            <input
              required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej: Examen de Seguridad en el Trabajo 2024"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Contexto o instrucciones adicionales para los agentes IA"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Carpeta de contenido</label>
            {loadingFolders ? (
              <div className="mt-1 h-9 rounded-md bg-muted animate-pulse" />
            ) : foldersError ? (
              <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {foldersError} — <Link href="/dashboard/folders" className="underline">ir a carpetas</Link>
              </p>
            ) : folders.length === 0 ? (
              <div className="mt-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No tienes carpetas de contenido.{" "}
                <Link href="/dashboard/folders" className="underline font-medium">Crea una carpeta primero</Link>
                {" "}y sube el material de estudio antes de crear un examen.
              </div>
            ) : (
              <select
                value={folderId} onChange={(e) => setFolderId(e.target.value)} required
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
            {folders.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Los archivos de esta carpeta son el material base para generar las preguntas.
              </p>
            )}
          </div>
        </section>

        {/* Parámetros */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Parámetros del examen</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Total preguntas</label>
              <input
                type="number" min={1} max={200} required
                value={totalQuestions} onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Banco de preguntas</label>
              <input
                type="number" min={2} max={500} required
                value={bankSize} onChange={(e) => setBankSize(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-0.5">Debe ser mayor que total preguntas</p>
            </div>
            <div>
              <label className="text-sm font-medium">Duración (minutos)</label>
              <input
                type="number" min={1} max={480} required
                value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Dificultad</label>
              <select
                value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
                <option value="mixed">Mixto</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Idioma</label>
              <select
                value={language} onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="pt">Portugués</option>
              </select>
            </div>
          </div>
        </section>

        {/* Tipos de pregunta */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tipos de pregunta</h2>
            <span className={`text-xs font-medium ${qtSum === 100 ? "text-green-600" : "text-destructive"}`}>
              {qtSum}% / 100%
            </span>
          </div>
          <PercentField label="Selección múltiple" value={questionTypes.mc ?? 0}
            onChange={(v) => setQuestionTypes((p) => ({ ...p, mc: v }))} />
          <PercentField label="Verdadero/Falso" value={questionTypes.true_false ?? 0}
            onChange={(v) => setQuestionTypes((p) => ({ ...p, true_false: v }))} />
          <PercentField label="Desarrollo" value={questionTypes.open ?? 0}
            onChange={(v) => setQuestionTypes((p) => ({ ...p, open: v }))} />
        </section>

        {/* Bloom */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Distribución Bloom</h2>
            <span className={`text-xs font-medium ${bloomSum === 100 ? "text-green-600" : "text-destructive"}`}>
              {bloomSum}% / 100%
            </span>
          </div>
          {(["remember", "understand", "apply", "analyze", "evaluate", "create"] as const).map((level) => {
            const labels: Record<string, string> = {
              remember: "Recordar", understand: "Comprender", apply: "Aplicar",
              analyze: "Analizar", evaluate: "Evaluar", create: "Crear",
            };
            return (
              <PercentField key={level} label={labels[level]} value={bloom[level] ?? 0}
                onChange={(v) => setBloom((p) => ({ ...p, [level]: v }))} />
            );
          })}
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={saving || folders.length === 0 || !!foldersError}>
            {saving ? "Creando..." : "Crear examen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
