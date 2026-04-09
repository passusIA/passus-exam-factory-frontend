"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { api, type Folder, type Source } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, FolderOpen, Trash2, Link as LinkIcon,
  Upload, FileText, Globe, AlertCircle, ChevronDown, ChevronRight, X,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────
const SOURCE_STATUS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  done: "default", error: "destructive", processing: "secondary",
  pending: "outline", rejected: "destructive",
};

function sourceBadge(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente", processing: "Procesando",
    done: "Listo", error: "Error", rejected: "Rechazado",
  };
  return <Badge variant={SOURCE_STATUS[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

// ── New Folder Modal ────────────────────────────────────────────────────────────
function NewFolderModal({ onCreated, onClose }: { onCreated: (f: Folder) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const folder = await api.createFolder({ name: name.trim(), description: desc.trim() || undefined });
      onCreated(folder);
    } catch (err: any) {
      setError(err.message ?? "Error al crear carpeta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Nueva carpeta</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Reglamento Seguridad 2024" required autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe el contenido de esta carpeta"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Creando..." : "Crear"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add URL Modal ───────────────────────────────────────────────────────────────
function AddUrlModal({ folderId, onAdded, onClose }: { folderId: string; onAdded: (s: Source) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const source = await api.addUrlSource(folderId, url.trim());
      onAdded(source);
    } catch (err: any) {
      setError(err.message ?? "Error al agregar URL");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Agregar URL</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">URL</label>
            <input
              type="url"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/documento" required autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Agregando..." : "Agregar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Folder Row ──────────────────────────────────────────────────────────────────
function FolderRow({ folder, onDelete }: { folder: Folder; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadSources() {
    if (sources.length > 0) return;
    setLoadingSources(true);
    try {
      const data = await api.listSources(folder.id);
      setSources(data.items);
    } catch {
      // silencioso
    } finally {
      setLoadingSources(false);
    }
  }

  function toggle() {
    if (!open) loadSources();
    setOpen((v) => !v);
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const path = `${folder.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("exam-content")
        .upload(path, file, { upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const source = await api.addFileSource(folder.id, {
        original_name: file.name,
        mime_type: file.type,
        source_path: `exam-content/${path}`,
      });
      setSources((prev) => [source, ...prev]);
    } catch (err: any) {
      alert(err.message ?? "Error al subir archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removeSource(sourceId: string) {
    try {
      await api.deleteSource(folder.id, sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch (err: any) {
      alert(err.message ?? "Error al eliminar fuente");
    }
  }

  async function deleteFolder() {
    if (!confirm(`¿Eliminar la carpeta "${folder.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await api.deleteFolder(folder.id);
      onDelete(folder.id);
    } catch (err: any) {
      alert(err.message ?? "Error al eliminar carpeta");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <button onClick={toggle} className="text-muted-foreground hover:text-foreground">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{folder.name}</p>
            {folder.description && (
              <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className={`cursor-pointer flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Subiendo..." : "Subir archivo"}
              <input type="file" className="hidden" onChange={uploadFile}
                accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.png,.jpg,.jpeg" />
            </label>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
              onClick={() => setShowUrlModal(true)}>
              <Globe className="h-3.5 w-3.5" /> URL
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={deleteFolder} disabled={deleting}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Sources */}
        {open && (
          <div className="border-t border-border px-4 pb-4">
            {loadingSources ? (
              <div className="py-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : sources.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Sin fuentes todavía — sube archivos o agrega URLs
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {sources.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md hover:bg-muted group">
                    {s.type === "url" ? (
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 truncate text-xs">
                      {s.original_name ?? s.source_path}
                    </span>
                    {sourceBadge(s.status)}
                    {s.chunks_count > 0 && (
                      <span className="text-xs text-muted-foreground">{s.chunks_count} chunks</span>
                    )}
                    <button
                      onClick={() => removeSource(s.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {showUrlModal && (
        <AddUrlModal
          folderId={folder.id}
          onAdded={(s) => { setSources((prev) => [s, ...prev]); setShowUrlModal(false); setOpen(true); }}
          onClose={() => setShowUrlModal(false)}
        />
      )}
    </>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    api.listFolders()
      .then((data) => setFolders(data.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Carpetas de contenido</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organiza el material de estudio para generar exámenes
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4" /> Nueva carpeta
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin carpetas todavía</p>
          <p className="text-sm mt-1">Crea una carpeta y sube tus materiales de estudio</p>
          <Button size="sm" variant="outline" className="gap-1.5 mt-4" onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4" /> Crear carpeta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {folders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              onDelete={(id) => setFolders((prev) => prev.filter((f) => f.id !== id))}
            />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewFolderModal
          onCreated={(f) => { setFolders((prev) => [f, ...prev]); setShowNewModal(false); }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
