"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Zap, LayoutDashboard, Layers, GitBranch, ClipboardCheck,
  Database, Send, BarChart2, Settings, Building2, Cpu,
  Shield, LogOut, ChevronLeft, ChevronRight, User, FolderOpen,
} from "lucide-react";

const MAIN_NAV = [
  { href: "/dashboard",              label: "Dashboard",       icon: LayoutDashboard },
  { href: "/dashboard/exams",        label: "Proyectos",       icon: Layers },
  { href: "/dashboard/folders",      label: "Insumos",         icon: FolderOpen },
  { href: "/dashboard/exams?filter=review",  label: "Revisión", icon: ClipboardCheck },
  { href: "/dashboard/banks",        label: "Bancos",          icon: Database,  soon: true },
  { href: "/dashboard/exams?filter=done",    label: "Publicación", icon: Send },
  { href: "/dashboard/usage",        label: "Uso y costos",    icon: BarChart2 },
  { href: "/dashboard/settings",     label: "Configuración",   icon: Settings },
] as const;

const ADMIN_NAV = [
  { href: "/admin",           label: "Organizaciones",  icon: Building2 },
  { href: "/admin/llm",       label: "Modelos LLM",     icon: Cpu },
  { href: "/admin/audit",     label: "Auditoría",       icon: Shield },
] as const;

function NavItem({
  href, label, icon: Icon, soon, collapsed, active,
}: {
  href: string; label: string; icon: React.ElementType;
  soon?: boolean; collapsed: boolean; active: boolean;
}) {
  return (
    <Link
      href={soon ? "#" : href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        soon && "opacity-50 pointer-events-none"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <span className="flex-1 truncate">{label}</span>
      )}
      {!collapsed && soon && (
        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-normal">
          pronto
        </span>
      )}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut, isSuperAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    const clean = href.split("?")[0];
    if (clean === "/dashboard") return pathname === "/dashboard";
    return pathname === clean || pathname.startsWith(clean + "/");
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-background shrink-0 transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-border h-14 shrink-0",
        collapsed ? "justify-center px-0" : "gap-2.5 px-4"
      )}>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shrink-0">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground leading-none truncate">Passus</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Exam Factory</p>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {MAIN_NAV.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={isActive(item.href)}
          />
        ))}

        {isSuperAdmin && (
          <>
            <div className={cn("my-2 border-t border-border", collapsed ? "mx-1" : "mx-1")} />
            {ADMIN_NAV.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                collapsed={collapsed}
                active={isActive(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-2 py-2 space-y-0.5">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2.5 py-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
              {(user?.email ?? "U").charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground truncate flex-1">{user?.email}</span>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Cerrar sesión"}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "justify-center"
          )}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            : <><ChevronLeft className="h-3.5 w-3.5 shrink-0" /><span>Contraer</span></>
          }
        </button>
      </div>
    </aside>
  );
}
