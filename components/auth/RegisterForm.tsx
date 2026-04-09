"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "", password: "", full_name: "",
    organization_name: "", organization_slug: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === "organization_name" && !slugEdited) {
          next.organization_slug = toSlug(value);
        }
        return next;
      });
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.organization_slug)) {
      setError("El slug solo puede contener letras minúsculas, números y guiones.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.detail;
        const msg = Array.isArray(detail)
          ? detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(", ")
          : (detail ?? "Error al crear la cuenta.");
        throw new Error(msg);
      }
      router.push("/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="org_name" className="text-sm font-medium">Nombre de tu organización</label>
        <input
          id="org_name"
          type="text"
          required
          value={form.organization_name}
          onChange={set("organization_name")}
          placeholder="Mi OTEC SpA"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="org_slug" className="text-sm font-medium">
          Slug <span className="text-muted-foreground font-normal text-xs">(identificador único)</span>
        </label>
        <input
          id="org_slug"
          type="text"
          required
          value={form.organization_slug}
          onChange={(e) => { setSlugEdited(true); set("organization_slug")(e); }}
          placeholder="mi-otec"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="full_name" className="text-sm font-medium">Nombre completo</label>
        <input
          id="full_name"
          type="text"
          required
          value={form.full_name}
          onChange={set("full_name")}
          placeholder="Juan Pérez"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="text-sm font-medium">Email</label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set("email")}
          placeholder="tu@empresa.cl"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-password" className="text-sm font-medium">Contraseña</label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={set("password")}
          placeholder="Mínimo 8 caracteres"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Crear cuenta gratis
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Al registrarte aceptas los{" "}
        <a href="/terminos" className="underline hover:text-foreground">Términos de uso</a>
      </p>
    </form>
  );
}
