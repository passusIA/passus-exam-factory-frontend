import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = { title: "Iniciar sesión — Passus Exam Factory" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary mb-2">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bienvenido de vuelta</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa a tu cuenta de Passus Exam Factory
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          ¿Sin cuenta?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
