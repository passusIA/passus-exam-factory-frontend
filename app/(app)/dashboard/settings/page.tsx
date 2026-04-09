"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { api, type Tenant, type Subscription, type Member } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users, CreditCard, Building2, Mail, X } from "lucide-react";

// ── Invite Modal ───────────────────────────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.inviteMember(email.trim(), role);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Error al enviar invitación");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Invitar miembro</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {success ? (
          <div className="py-4 text-center">
            <p className="text-sm text-green-600 font-medium">Invitación enviada correctamente</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Correo electrónico</label>
              <input
                type="email" required autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                placeholder="nombre@empresa.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rol</label>
              <select
                value={role} onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="member">Miembro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Enviando..." : "Enviar invitación"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Status badge helpers ───────────────────────────────────────────────────────
function tenantStatusBadge(status: string) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default", trial: "secondary", suspended: "destructive", cancelled: "outline",
  };
  const labels: Record<string, string> = {
    active: "Activo", trial: "Prueba", suspended: "Suspendido", cancelled: "Cancelado",
  };
  return <Badge variant={map[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

function subStatusBadge(status: string) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default", trialing: "secondary", past_due: "destructive", cancelled: "outline",
  };
  const labels: Record<string, string> = {
    active: "Activa", trialing: "Período de prueba", past_due: "Pago pendiente", cancelled: "Cancelada",
  };
  return <Badge variant={map[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getTenant(),
      api.getSubscription().catch(() => null),
      api.listMembers().catch(() => []),
    ])
      .then(([t, s, m]) => {
        setTenant(t);
        setSubscription(s);
        setMembers(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestiona tu organización, plan y equipo</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tenant info */}
      {tenant && (
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Organización</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm font-medium mt-0.5">{tenant.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Slug</p>
              <p className="text-sm font-medium mt-0.5 font-mono">{tenant.slug}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <div className="mt-0.5">{tenantStatusBadge(tenant.status)}</div>
            </div>
            {tenant.plan_id && (
              <div>
                <p className="text-xs text-muted-foreground">Plan ID</p>
                <p className="text-sm font-medium mt-0.5 font-mono text-xs">{tenant.plan_id}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Subscription */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Suscripción</h2>
        </div>
        {subscription ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-sm font-medium mt-0.5">{subscription.plan_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <div className="mt-0.5">{subStatusBadge(subscription.status)}</div>
            </div>
            {subscription.days_remaining !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Días restantes</p>
                <p className="text-sm font-medium mt-0.5">{subscription.days_remaining} días</p>
              </div>
            )}
            {subscription.trial_ends_at && (
              <div>
                <p className="text-xs text-muted-foreground">Fin de prueba</p>
                <p className="text-sm font-medium mt-0.5">
                  {new Date(subscription.trial_ends_at).toLocaleDateString("es-CL")}
                </p>
              </div>
            )}
            {subscription.ends_at && (
              <div>
                <p className="text-xs text-muted-foreground">Vence</p>
                <p className="text-sm font-medium mt-0.5">
                  {new Date(subscription.ends_at).toLocaleDateString("es-CL")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay información de suscripción disponible.</p>
        )}
      </section>

      {/* Members */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Equipo</h2>
          </div>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setShowInvite(true)}>
            <Mail className="h-3.5 w-3.5" /> Invitar
          </Button>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin miembros todavía</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                  {(m.full_name ?? m.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {m.full_name && (
                    <p className="text-sm font-medium truncate">{m.full_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={m.role === "admin" ? "default" : "outline"} className="text-xs">
                    {m.role === "admin" ? "Admin" : "Miembro"}
                  </Badge>
                  {!m.active && (
                    <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
