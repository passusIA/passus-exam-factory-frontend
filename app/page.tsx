import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/marketing/Navbar";
import {
  ArrowRight,
  Upload,
  Settings2,
  Download,
  Brain,
  ClipboardList,
  Sparkles,
  ShieldCheck,
  Package,
  CheckCircle2,
  Zap,
} from "lucide-react";

// ── Static data (hoisted — no re-allocation per render) ───────────────────────

const CERTIFICATIONS = [
  "ITIL® 4", "ISO 27001", "AWS Cloud", "COBIT 2019", "PMI PMP", "PRINCE2",
] as const;

const AGENTS = [
  {
    icon: Upload,
    number: "01",
    name: "Ingestion Agent",
    description:
      "Parsea PDFs, Word, PowerPoint, imágenes con OCR, URLs y exámenes previos. Valida que cada fuente sea material educativo apto.",
  },
  {
    icon: Brain,
    number: "02",
    name: "Curriculum Agent",
    description:
      "Identifica objetivos de aprendizaje y los clasifica en la Taxonomía de Bloom. Mapea el peso temático de cada área.",
  },
  {
    icon: ClipboardList,
    number: "03",
    name: "Blueprint Agent",
    description:
      "Diseña la estructura del examen respetando tu configuración. Aplica ISO 10667 y principios psicométricos.",
  },
  {
    icon: Sparkles,
    number: "04",
    name: "Generator Agent",
    description:
      "Genera preguntas con distractores plausibles, justificación y referencia a la fuente. Sin ambigüedades ni trampas lingüísticas.",
  },
  {
    icon: ShieldCheck,
    number: "05",
    name: "QA Agent",
    description:
      "Valida claridad, ausencia de sesgos, dificultad calibrada y unicidad. Reporta por qué cada pregunta es buena.",
  },
  {
    icon: Package,
    number: "06",
    name: "Publishing Agent",
    description:
      "Exporta en PDF, Excel, CSV, JSON y QTI. Notifica via webhook a tu LMS o simulador al terminar.",
  },
] as const;

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Sube tu contenido",
    description:
      "Arrastra tus documentos, pega URLs o importa exámenes anteriores. El sistema analiza y valida cada fuente automáticamente.",
  },
  {
    icon: Settings2,
    step: "02",
    title: "Configura el examen",
    description:
      "Define tipos de preguntas, dificultad, distribución de Bloom y el esquema de salida. Sin código, sin plantillas fijas.",
  },
  {
    icon: Download,
    step: "03",
    title: "Descarga y despliega",
    description:
      "Obtén tu examen en el formato que necesitas. Edita cualquier pregunta, selecciona desde el banco y exporta.",
  },
] as const;

const PLANS = [
  {
    name: "Starter",
    price: "29",
    description: "Para instructores y consultores independientes",
    highlight: false,
    features: ["5 exámenes por mes", "30 preguntas por examen", "PDF y Excel", "Modelos Qwen", "Soporte por email"],
    cta: "Empezar gratis",
    href: "/register",
  },
  {
    name: "Pro",
    price: "79",
    description: "Para OTECs y centros de capacitación",
    highlight: true,
    features: ["20 exámenes por mes", "100 preguntas por examen", "Todos los formatos", "Modelos Qwen Plus", "Editor de preguntas", "Soporte prioritario"],
    cta: "Empezar gratis",
    href: "/register",
  },
  {
    name: "ATO",
    price: "199",
    description: "Para organismos de certificación",
    highlight: false,
    features: ["100 exámenes por mes", "200 preguntas + banco", "Exportación QTI", "Claude Sonnet 4", "API pública + webhooks", "Soporte dedicado"],
    cta: "Contactar ventas",
    href: "/contacto",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Para universidades y corporaciones",
    highlight: false,
    features: ["Volumen ilimitado", "White-label", "Modelos personalizados", "SLA garantizado", "Integración LMS", "Account manager"],
    cta: "Hablar con ventas",
    href: "/contacto",
  },
] as const;

const STATS = [
  { value: "< 3 min", label: "para generar 20 preguntas" },
  { value: "> 80%", label: "preguntas pasan QA sin edición" },
  { value: "~ $0.03", label: "costo por examen (plan Starter)" },
  { value: "6", label: "formatos de exportación" },
] as const;

// ── Sección Hero ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-24">
      {/* Grid decorativo de fondo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/5 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <Badge
          variant="secondary"
          className="mb-6 border border-primary/20 bg-primary/5 text-primary font-medium px-4 py-1"
        >
          <Zap className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Pipeline de 6 agentes IA · Estándares psicométricos ISO 10667
        </Badge>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Genera exámenes de{" "}
          <span className="text-primary">certificación</span> en minutos,
          no en días
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Sube tus documentos, URLs o exámenes anteriores. Nuestros 6 agentes
          de IA construyen el banco de preguntas, los validan con estándares
          psicométricos y exportan en el formato que necesitas.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button
              size="lg"
              className="cursor-pointer bg-accent hover:bg-accent/90 text-white gap-2 px-8"
            >
              Prueba gratis 14 días
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="#como-funciona">
            <Button size="lg" variant="outline" className="cursor-pointer px-8">
              Ver cómo funciona
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Sin tarjeta de crédito · Cancela cuando quieras
        </p>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl mx-auto">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Barra de certificaciones ───────────────────────────────────────────────────

function CertificationsBar() {
  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
          Genera exámenes para los frameworks de certificación más exigentes
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {CERTIFICATIONS.map((cert) => (
            <span
              key={cert}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm"
            >
              {cert}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Cómo funciona ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Simple y poderoso
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            De tus documentos a un examen listo
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Tres pasos. Sin configuración técnica. Sin conocimiento previo en
            psicometría.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative flex flex-col items-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <span className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Paso {step.step}
                </span>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Agentes ───────────────────────────────────────────────────────────────────

function AgentsSection() {
  return (
    <section id="funcionalidades" className="py-24 bg-muted/20 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Arquitectura de 6 agentes
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cada agente hace una cosa. La hace bien.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            El pipeline selecciona automáticamente el modelo LLM más eficiente
            para cada tarea, optimizando costo sin sacrificar calidad.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card
                key={agent.name}
                className="border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Agente {agent.number}
                      </span>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {agent.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {agent.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pipeline status preview */}
        <div className="mt-12 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-foreground">
            Progreso en tiempo real — ves exactamente qué agente está trabajando y qué modelo usó
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            {AGENTS.map((agent, i) => {
              const isCompleted = i < 3;
              const isActive = i === 3;
              return (
                <div key={agent.name} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                      isCompleted
                        ? "bg-accent/10 text-accent border-accent/20"
                        : isActive
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-3 w-3 ${isCompleted ? "text-accent" : isActive ? "text-primary" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    />
                    {agent.name.replace(" Agent", "")}
                  </div>
                  {i < AGENTS.length - 1 && (
                    <ArrowRight className="hidden sm:block h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Precios ───────────────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section id="precios" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Precios transparentes
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Un plan para cada tamaño de equipo
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Todos los planes incluyen 14 días de prueba. Sin tarjeta.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col border shadow-sm transition-shadow duration-200 hover:shadow-md ${
                plan.highlight ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white px-3 shadow-sm">Más popular</Badge>
                </div>
              )}

              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  {plan.price === "Custom" ? (
                    <span className="text-3xl font-bold text-foreground">A medida</span>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">USD $</span>
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mes</span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4">
                <Separator />
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4">
                  <Link href={plan.href}>
                    <Button
                      className={`w-full cursor-pointer ${
                        plan.highlight
                          ? "bg-accent hover:bg-accent/90 text-white"
                          : "bg-primary hover:bg-primary/90 text-white"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Necesitas factura?{" "}
          <Link href="/contacto" className="text-primary hover:underline cursor-pointer font-medium">
            Pago anual con 20% de descuento
          </Link>
        </p>
      </div>
    </section>
  );
}

// ── CTA final ─────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="py-24 bg-primary">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Empieza a generar exámenes hoy
        </h2>
        <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
          14 días gratis, sin tarjeta de crédito. Tu equipo generando exámenes de
          calidad desde el primer día.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button
              size="lg"
              className="cursor-pointer bg-white text-primary hover:bg-white/90 gap-2 px-8 font-semibold"
            >
              Crear cuenta gratis
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button
              size="lg"
              variant="outline"
              className="cursor-pointer border-white/40 text-white hover:bg-white/10 px-8"
            >
              Ver demo en vivo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Zap className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              </div>
              <span className="font-semibold text-background">Passus Exam Factory</span>
            </div>
            <p className="text-sm text-background/60">
              Plataforma SaaS para generación de exámenes con IA. Hecho en Chile para LATAM.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <nav aria-label="Producto">
              <p className="font-semibold text-background mb-3">Producto</p>
              <ul className="flex flex-col gap-2 text-background/60">
                {(["Cómo funciona", "Funcionalidades", "Precios", "Documentación"] as const).map((item) => (
                  <li key={item}>
                    <Link href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="hover:text-background transition-colors duration-150 cursor-pointer">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Empresa">
              <p className="font-semibold text-background mb-3">Empresa</p>
              <ul className="flex flex-col gap-2 text-background/60">
                {([["Passus SpA", "/about"], ["Contacto", "/contacto"], ["Blog", "/blog"]] as const).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:text-background transition-colors duration-150 cursor-pointer">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Legal">
              <p className="font-semibold text-background mb-3">Legal</p>
              <ul className="flex flex-col gap-2 text-background/60">
                {([["Privacidad", "/privacidad"], ["Términos", "/terminos"]] as const).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:text-background transition-colors duration-150 cursor-pointer">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <Separator className="my-8 bg-background/10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-background/50">
          <p>© 2026 Passus SpA · Santiago, Chile</p>
          <p>Hecho con IA · Para formadores de IA</p>
        </div>
      </div>
    </footer>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <CertificationsBar />
        <HowItWorksSection />
        <AgentsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
