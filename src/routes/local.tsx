import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Navigation } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/wedding";

export const Route = createFileRoute("/local")({
  head: () => ({
    meta: [
      { title: "Local da Cerimônia — Nosso Casamento" },
      {
        name: "description",
        content: "Endereço, horário e como chegar ao local da nossa cerimônia de casamento.",
      },
      { property: "og:title", content: "Local da Cerimônia — Nosso Casamento" },
      {
        property: "og:description",
        content: "Endereço, horário e como chegar à cerimônia.",
      },
    ],
  }),
  component: LocationPage,
});

function LocationPage() {
  const { data: settings, isLoading } = useQuery(settingsQuery);

  const address = settings?.ceremony_address?.trim() ?? "";
  const mapsUrl =
    settings?.maps_url?.trim() ||
    (address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : "");
  const embedUrl = address
    ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
    : "";

  return (
    <PageShell
      eyebrow="Onde vai ser"
      title="Local da Cerimônia"
      intro="Esperamos você lá. Chegue com um pouco de antecedência para acomodar-se com calma."
    >
      {isLoading ? (
        <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-sm bg-secondary" />
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-sm border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
            <MapPin className="mx-auto size-6 text-primary" />
            <h2 className="mt-4 font-display text-3xl">
              {settings?.ceremony_venue || "Local a confirmar"}
            </h2>
            {address ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{address}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              {settings?.wedding_date ? (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  {settings.wedding_date}
                </span>
              ) : null}
              {settings?.ceremony_time ? (
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  {settings.ceremony_time}
                </span>
              ) : null}
            </div>

            {mapsUrl ? (
              <Button variant="gold" className="mt-8" asChild>
                <a href={mapsUrl} target="_blank" rel="noreferrer noopener">
                  <Navigation className="size-4" />
                  Abrir no mapa
                </a>
              </Button>
            ) : null}
          </div>

          {embedUrl ? (
            <div className="overflow-hidden rounded-sm border border-border shadow-[var(--shadow-soft)]">
              <iframe
                title="Mapa do local da cerimônia"
                src={embedUrl}
                loading="lazy"
                className="h-80 w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              O endereço ainda será divulgado pelos noivos.
            </p>
          )}
        </div>
      )}
    </PageShell>
  );
}
