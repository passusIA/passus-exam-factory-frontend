import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = { title: "Crear cuenta — Passus Exam Factory" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary mb-2">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Crea tu cuenta</h1>
          <p className="text-sm text-muted-foreground">
            14 días gratis · Sin tarjeta de crédito
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
