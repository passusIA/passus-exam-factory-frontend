"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppSidebar } from "@/components/app/AppSidebar";
import { RightPanelProvider, RightPanelSlot } from "@/components/layout/RightPanelContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <RightPanelProvider>
      <div className="flex min-h-screen bg-muted/30">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
        <RightPanelSlot />
      </div>
    </RightPanelProvider>
  );
}
