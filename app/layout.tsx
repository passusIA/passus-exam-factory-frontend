import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Passus Exam Factory — Genera exámenes de certificación con IA",
  description:
    "Plataforma SaaS para generar exámenes de alta calidad desde tus documentos. ITIL, ISO 27001, AWS, COBIT y más. Exporta en PDF, Excel, QTI.",
  keywords: ["exámenes", "certificación", "ITIL", "ISO 27001", "IA", "e-learning", "OTEC"],
  openGraph: {
    title: "Passus Exam Factory",
    description: "Genera exámenes de certificación con IA en minutos",
    url: "https://examfactory.passus.cl",
    siteName: "Passus Exam Factory",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={plusJakartaSans.className}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
