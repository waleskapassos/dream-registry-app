import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Gift, MapPin, HeartHandshake, ChevronLeft, ChevronRight } from "lucide-react";

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
    <nav aria-label="Acessos principais" className="mt-8 grid w-full max-w-md gap-4 sm:mt-10">
      {buttons
        .filter((button) => button.visible)
        .map((button) => {
          const Icon = icons[button.to];
          return (
            <Link
              key={button.to}
              to={button.to}
              className="home-action group flex min-h-20 items-center gap-4 rounded-2xl border-2 border-transparent bg-primary px-5 py-4 text-left text-primary-foreground shadow-[var(--shadow-home-action)] transition-all active:scale-[0.98] motion-reduce:transition-none sm:px-6 sm:py-5 sm:hover:-translate-y-0.5 sm:hover:bg-primary/90 sm:hover:shadow-[var(--shadow-lift)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl tracking-[0.08em]">{button.label}</span>
                {button.hint ? (
                  <span className="mt-0.5 block text-xs text-primary-foreground/85">
                    {button.hint}
                  </span>
                ) : null}
              </span>
              <ChevronRight
                className="size-5 shrink-0 opacity-90 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          );
        })}
    </nav>
  );
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % images.length),
      4500,
    );
    return () => window.clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    if (activeIndex >= images.length) setActiveIndex(0);
  }, [activeIndex, images.length]);

  if (images.length === 0) return null;
  const showPrevious = () =>
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  const showNext = () => setActiveIndex((current) => (current + 1) % images.length);

  return (
    <section className="mt-14 w-full max-w-2xl" aria-labelledby="gallery-title">
      <p id="gallery-title" className="type-gallery-title whitespace-pre-line text-center">
        {title}
      </p>
      <Ornament />
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/65 p-2 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-3">
        <img
          key={`${images[activeIndex]}-${activeIndex}`}
          src={images[activeIndex]}
          alt={`Foto ${activeIndex + 1} de ${images.length} da galeria do casal`}
          className="gallery-photo-enter aspect-4/3 w-full rounded-xl object-contain"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Foto anterior"
              className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary/40 bg-card/90 text-foreground shadow-[var(--shadow-button)] backdrop-blur transition-all hover:scale-105 hover:border-primary"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Próxima foto"
              className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary/40 bg-card/90 text-foreground shadow-[var(--shadow-button)] backdrop-blur transition-all hover:scale-105 hover:border-primary"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="mt-4 flex justify-center gap-2" aria-label="Escolher foto da galeria">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Mostrar foto ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex ? "w-8 bg-primary" : "w-2.5 bg-primary/30 hover:bg-primary/60"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Index() {
  const { data: settings } = useQuery(settingsQuery);
  const messageCardRef = useRef<HTMLElement>(null);
  const [messageCardVisible, setMessageCardVisible] = useState(false);

  useEffect(() => {
    const key = "wedding-visit-recorded";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void supabase.from("site_visits").insert({});
  }, []);

  useEffect(() => {
    const element = messageCardRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setMessageCardVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setMessageCardVisible(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const heroSrc = settings?.hero_image_url || heroImage;
  const eyebrow = settings?.hero_eyebrow || "Vamos nos casar";
  const names = settings?.couple_names || "Nossos Nomes";
  const weddingDate = settings?.wedding_date || "05 de dezembro de 2026";
  const message =
    settings?.welcome_message ||
    "É uma alegria enorme ter você por perto neste dia. Aqui você encontra tudo o que precisa saber.";
  const buttons = settings?.home_buttons ?? [];
  const gallery = settings?.gallery_images ?? [];
  const layout = settings?.hero_layout ?? "full";

  const intro = (
    <>
      <h1 className="type-couple-names leading-tight">{names}</h1>
      <p className="type-wedding-date mt-4 tracking-[0.2em]">{weddingDate}</p>
      <Ornament />
    </>
  );

  const messageCard = (
    <aside
      ref={messageCardRef}
      className={`w-full rounded-sm border-2 border-primary/45 bg-card/45 p-8 text-left shadow-[var(--shadow-soft)] backdrop-blur-lg transition-[opacity,transform] duration-1000 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none sm:p-10 ${
        messageCardVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
    >
      <p className="eyebrow text-primary">Recadinho dos Noivos</p>
      <p className="type-body mt-4 text-justify leading-relaxed text-muted-foreground">{message}</p>
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
          <div className="mt-8 w-full max-w-lg">{messageCard}</div>
          <Nav buttons={buttons} />
          <Gallery images={gallery} title={eyebrow} />
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
          <div className="mt-8 w-full max-w-lg">{messageCard}</div>
          <Nav buttons={buttons} />
          <Gallery images={gallery} title={eyebrow} />
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
        <div className="mt-8 w-full max-w-lg">{messageCard}</div>
        <Nav buttons={buttons} />
        <Gallery images={gallery} title={eyebrow} />
        <Link to="/auth" className="eyebrow mt-12 hover:text-foreground">
          Área dos noivos
        </Link>
      </div>
    </div>
  );
}
