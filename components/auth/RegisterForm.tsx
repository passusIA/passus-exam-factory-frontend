"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", tenant_name: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
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
        throw new Error(body?.detail ?? "Error al crear la cuenta.");
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
        <label htmlFor="tenant_name" className="text-sm font-medium">Nombre de tu organización</label>
        <input
          id="tenant_name"
          type="text"
          required
          value={form.tenant_name}
          onChange={set("tenant_name")}
          placeholder="Mi OTEC SpA"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
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
