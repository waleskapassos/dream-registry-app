import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/confirmar")({
  head: () => ({
    meta: [
      { title: "Confirmar Presença — Nosso Casamento" },
      {
        name: "description",
        content: "Confirme sua presença na nossa cerimônia de casamento em poucos segundos.",
      },
      { property: "og:title", content: "Confirmar Presença — Nosso Casamento" },
      { property: "og:description", content: "Confirme sua presença na nossa cerimônia." },
    ],
  }),
  component: RsvpPage,
});

const rsvpSchema = z.object({
  guest_name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  guest_email: z.string().trim().email("E-mail inválido").max(200).or(z.literal("")),
  guest_phone: z.string().trim().max(40).or(z.literal("")),
  guests_count: z.number().int().min(1).max(10),
  attending: z.boolean(),
  message: z.string().trim().max(500).or(z.literal("")),
});

function RsvpPage() {
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    guests_count: 1,
    attending: true,
    message: "",
  });
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = rsvpSchema.parse(form);
      const { error } = await supabase.from("rsvps").insert({
        name: parsed.guest_name,
        email: parsed.guest_email || null,
        phone: parsed.guest_phone || null,
        guests: parsed.guests_count,
        attending: parsed.attending,
        message: parsed.message || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDone(true);
      toast.success("Presença registrada. Obrigado!");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof z.ZodError
          ? (error.issues[0]?.message ?? "Verifique os campos")
          : "Não foi possível enviar agora. Tente novamente.";
      toast.error(message);
    },
  });

  if (done) {
    return (
      <PageShell eyebrow="Recebido" title="Obrigado!" intro="Sua resposta foi registrada com carinho.">
        <div className="mx-auto max-w-md text-center">
          <Button variant="quiet" onClick={() => setDone(false)}>
            Enviar outra confirmação
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="RSVP"
      title="Confirmar Presença"
      intro="Preencha os campos abaixo para nos ajudar a organizar cada detalhe."
    >
      <form
        className="mx-auto max-w-lg space-y-5 rounded-sm border border-border bg-card p-8 shadow-[var(--shadow-soft)]"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="guest_name">Nome completo</Label>
          <Input
            id="guest_name"
            required
            maxLength={120}
            value={form.guest_name}
            onChange={(event) => setForm({ ...form, guest_name: event.target.value })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guest_email">E-mail (opcional)</Label>
            <Input
              id="guest_email"
              type="email"
              maxLength={200}
              value={form.guest_email}
              onChange={(event) => setForm({ ...form, guest_email: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest_phone">Telefone (opcional)</Label>
            <Input
              id="guest_phone"
              maxLength={40}
              value={form.guest_phone}
              onChange={(event) => setForm({ ...form, guest_phone: event.target.value })}
            />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Você vai comparecer?</legend>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={form.attending ? "gold" : "quiet"}
              className="flex-1"
              onClick={() => setForm({ ...form, attending: true })}
            >
              Sim, estarei lá
            </Button>
            <Button
              type="button"
              variant={!form.attending ? "gold" : "quiet"}
              className="flex-1"
              onClick={() => setForm({ ...form, attending: false, guests_count: 1 })}
            >
              Não poderei ir
            </Button>
          </div>
        </fieldset>

        {form.attending ? (
          <div className="space-y-2">
            <Label htmlFor="guests_count">Quantas pessoas (incluindo você)</Label>
            <Input
              id="guests_count"
              type="number"
              min={1}
              max={10}
              value={form.guests_count}
              onChange={(event) =>
                setForm({ ...form, guests_count: Number(event.target.value) || 1 })
              }
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="message">Recado para os noivos (opcional)</Label>
          <Textarea
            id="message"
            rows={4}
            maxLength={500}
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
          />
        </div>

        <Button type="submit" variant="elegant" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Enviando…" : "Confirmar presença"}
        </Button>
      </form>
    </PageShell>
  );
}
