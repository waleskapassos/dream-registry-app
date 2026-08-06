import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Gift, MapPin, HeartHandshake } from "lucide-react";

import heroImage from "@/assets/hero-wedding.jpg";
import { Ornament } from "@/components/PageShell";
import { settingsQuery, type HomeButton } from "@/lib/wedding";
import { supabase } from "@/integrations/supabase/client";

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

const icons = {
  "/presentes": Gift,
  "/local": MapPin,
  "/confirmar": HeartHandshake,
} as const;

function Nav({ buttons }: { buttons: HomeButton[] }) {
  return (
    <nav className="mt-10 grid w-full max-w-md gap-4">
      {buttons
        .filter((button) => button.visible)
        .map((button) => {
          const Icon = icons[button.to];
          return (
            <Link
              key={button.to}
              to={button.to}
              className="group flex items-center gap-4 rounded-sm border border-primary/30 bg-card/75 px-6 py-5 text-left shadow-[var(--shadow-soft)] backdrop-blur-sm transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[var(--shadow-lift)]"
            >
              <Icon className="size-6 shrink-0 text-primary transition-colors group-hover:text-primary-foreground" />
              <span className="min-w-0">
                <span className="block font-display text-xl tracking-[0.08em]">{button.label}</span>
                {button.hint ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground transition-colors group-hover:text-primary-foreground/80">
                    {button.hint}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
    </nav>
  );
}

function Gallery({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  return (
    <div className="mt-12 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((url) => (
        <img
          key={url}
          src={url}
          alt="Foto do casal"
          loading="lazy"
          className="aspect-square w-full rounded-sm object-cover shadow-[var(--shadow-soft)]"
        />
      ))}
    </div>
  );
}

function Index() {
  const { data: settings } = useQuery(settingsQuery);

  useEffect(() => {
    const key = "wedding-visit-recorded";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void supabase.from("site_visits").insert({});
  }, []);

  const heroSrc = settings?.hero_image_url || heroImage;
  const eyebrow = settings?.hero_eyebrow || "Vamos nos casar";
  const names = settings?.couple_names || "Nossos Nomes";
  const message =
    settings?.welcome_message ||
    "É uma alegria enorme ter você por perto neste dia. Aqui você encontra tudo o que precisa saber.";
  const buttons = settings?.home_buttons ?? [];
  const gallery = settings?.gallery_images ?? [];
  const layout = settings?.hero_layout ?? "full";

  const intro = (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 font-display text-6xl leading-tight sm:text-8xl">{names}</h1>
      {settings?.wedding_date ? (
        <p className="mt-4 font-display text-xl tracking-[0.2em] text-foreground">
          {settings.wedding_date}
        </p>
      ) : null}
      <Ornament />
    </>
  );

  const messageCard = (
    <aside className="w-full rounded-sm border border-border/70 bg-card/85 p-6 text-left shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-8">
      <p className="eyebrow text-primary">Recadinhos dos Noivos</p>
      <p className="mt-4 text-justify text-sm leading-relaxed text-muted-foreground">{message}</p>
    </aside>
  );

  if (layout === "split") {
    return (
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
        <img
          src={heroSrc}
          alt="Foto do casal"
          className="h-64 w-full object-cover lg:h-screen lg:sticky lg:top-0"
        />
        <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-16 text-center">
          {intro}
          <div className="mt-8">{messageCard}</div>
          <Nav buttons={buttons} />
          <Gallery images={gallery} />
          <Link to="/auth" className="eyebrow mt-12 hover:text-foreground">
            Área dos noivos
          </Link>
        </div>
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-20 text-center">
          {intro}
          <div className="mt-8">{messageCard}</div>
          <Nav buttons={buttons} />
          <Gallery images={gallery} />
          <Link to="/auth" className="eyebrow mt-12 hover:text-foreground">
            Área dos noivos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <img
        src={heroSrc}
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
        {intro}
        <div className="mt-8 w-full max-w-md">{messageCard}</div>
        <Nav buttons={buttons} />
        <Gallery images={gallery} />
        <Link to="/auth" className="eyebrow mt-12 hover:text-foreground">
          Área dos noivos
        </Link>
      </div>
    </div>
  );
}
