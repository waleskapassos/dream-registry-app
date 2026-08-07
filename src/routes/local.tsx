import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CalendarPlus, Clock, MapPin, Navigation, Share2 } from "lucide-react";
import { toast } from "sonner";

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
  const dateMatch = settings?.wedding_date?.match(/(\d{1,2})\D(\d{1,2})\D(\d{4})/);
  const timeMatch = settings?.ceremony_time?.match(/(\d{1,2})[:h](\d{2})/i);
  const calendarUrl = (() => {
    if (!dateMatch) return "";
    const [, day = "01", month = "01", year = "2026"] = dateMatch;
    const hour = Number(timeMatch?.[1] ?? 12);
    const minute = Number(timeMatch?.[2] ?? 0);
    const stamp = (hours: number) =>
      `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}T${String(hours).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Casamento de ${settings?.couple_names || "nossos amigos"}`,
      dates: `${stamp(hour)}/${stamp(Math.min(23, hour + 4))}`,
      details: "Celebre este momento especial conosco.",
      location: [settings?.ceremony_venue, address].filter(Boolean).join(" — "),
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  })();

  async function shareInvitation() {
    const data = {
      title: `Casamento de ${settings?.couple_names || "nossos amigos"}`,
      text: "Você está convidado para celebrar este momento especial conosco!",
      url: window.location.origin,
    };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${data.text} ${data.url}`);
    toast.success("Link do convite copiado");
  }

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
                <span className="type-wedding-date inline-flex items-center gap-2">
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

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {mapsUrl ? (
                <Button variant="gold" asChild>
                  <a href={mapsUrl} target="_blank" rel="noreferrer noopener">
                    <Navigation className="size-4" />
                    Abrir no mapa
                  </a>
                </Button>
              ) : null}
              {calendarUrl ? (
                <Button variant="quiet" asChild>
                  <a href={calendarUrl} target="_blank" rel="noreferrer noopener">
                    <CalendarPlus className="size-4" />
                    Adicionar ao calendário
                  </a>
                </Button>
              ) : null}
              <Button variant="quiet" type="button" onClick={() => void shareInvitation()}>
                <Share2 className="size-4" />
                Compartilhar convite
              </Button>
            </div>
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
