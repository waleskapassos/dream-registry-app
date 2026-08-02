import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, MapPin, HeartHandshake } from "lucide-react";

import heroImage from "@/assets/hero-wedding.jpg";
import { Ornament } from "@/components/PageShell";
import { settingsQuery } from "@/lib/wedding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nosso Casamento — Presentes, Local e Confirmação" },
      {
        name: "description",
        content:
          "Página oficial do nosso casamento: veja a lista de presentes, o local da cerimônia e confirme sua presença.",
      },
      { property: "og:title", content: "Nosso Casamento" },
      {
        property: "og:description",
        content: "Lista de presentes, local da cerimônia e confirmação de presença.",
      },
    ],
  }),
  component: Index,
});

const cards = [
  {
    to: "/presentes" as const,
    icon: Gift,
    label: "Lista de Presentes",
    hint: "Escolha um presente e pague com Pix ou cartão",
  },
  {
    to: "/local" as const,
    icon: MapPin,
    label: "Local da Cerimônia",
    hint: "Endereço, horário e como chegar",
  },
  {
    to: "/confirmar" as const,
    icon: HeartHandshake,
    label: "Confirmar Presença",
    hint: "Nos avise se você vem celebrar com a gente",
  },
];

function Index() {
  const { data: settings } = useQuery(settingsQuery);

  return (
    <div className="relative min-h-screen">
      <img
        src={settings?.hero_image_url || heroImage}
        alt="Arco de flores brancas iluminado pela luz do fim de tarde"
        width={1920}
        height={1280}
        className="absolute inset-0 size-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-veil)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-20 text-center">
        <p className="eyebrow">Vamos nos casar</p>
        <h1 className="mt-4 font-display text-5xl leading-tight sm:text-7xl">
          {settings?.couple_names || "Nossos Nomes"}
        </h1>
        {settings?.wedding_date ? (
          <p className="mt-4 font-display text-xl tracking-[0.2em] text-primary">
            {settings.wedding_date}
          </p>
        ) : null}

        <Ornament />

        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {settings?.welcome_message ||
            "É uma alegria enorme ter você por perto neste dia. Aqui você encontra tudo o que precisa saber."}
        </p>

        <nav className="mt-10 grid w-full gap-4">
          {cards.map(({ to, icon: Icon, label, hint }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-sm border border-primary/30 bg-card/75 px-6 py-5 text-left shadow-[var(--shadow-soft)] backdrop-blur-sm transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[var(--shadow-lift)]"
            >
              <Icon className="size-6 shrink-0 text-primary transition-colors group-hover:text-primary-foreground" />
              <span>
                <span className="block font-display text-xl tracking-[0.08em]">{label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground transition-colors group-hover:text-primary-foreground/80">
                  {hint}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        <Link to="/auth" className="eyebrow mt-12 hover:text-foreground">
          Área dos noivos
        </Link>
      </div>
    </div>
  );
}
