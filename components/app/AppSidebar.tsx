"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import {
  Zap, LayoutDashboard, FolderOpen, FileText,
  Settings, Shield, LogOut, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Exámenes", icon: LayoutDashboard },
  { href: "/dashboard/folders", label: "Carpetas", icon: FolderOpen },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut, isSuperAdmin, role } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-background shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shrink-0">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-semibold text-sm text-foreground truncate">Exam Factory</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {isSuperAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors mt-2",
              pathname.startsWith("/admin")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Configuración
        </Link>
        <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
