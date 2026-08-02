import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import heroFallback from "@/assets/hero-wedding.jpg";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { adminGiftsQuery, settingsQuery, type Gift, type SiteSettings } from "@/lib/wedding";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel dos Noivos — Gerenciar Site" },
      { name: "description", content: "Gerencie a lista de presentes e as informações do casamento." },
      { property: "og:title", content: "Painel dos Noivos" },
      { property: "og:description", content: "Gerencie presentes e informações do casamento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const emptyGift = {
  id: "",
  title: "",
  description: "",
  price: "",
  quantity: "1",
  image_url: "" as string | null,
  is_active: true,
};

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: gifts } = useQuery(adminGiftsQuery);
  const { data: settings } = useQuery(settingsQuery);

  const [draft, setDraft] = useState(emptyGift);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [savingGift, setSavingGift] = useState(false);
  const [config, setConfig] = useState<SiteSettings | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (settings && !config) setConfig(settings);
  }, [settings, config]);

  function editGift(gift: Gift) {
    setDraft({
      id: gift.id,
      title: gift.title,
      description: gift.description,
      price: (gift.price_cents / 100).toFixed(2),
      quantity: String(gift.quantity),
      image_url: gift.image_url,
      is_active: gift.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadToStorage(file: File): Promise<string> {
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
    const { error } = await supabase.storage.from("gift-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data, error: signError } = await supabase.storage
      .from("gift-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (signError || !data?.signedUrl) throw signError ?? new Error("Falha ao gerar o link da foto");
    return data.signedUrl;
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const url = await uploadToStorage(file);
      setDraft((prev) => ({ ...prev, image_url: url }));
      toast.success("Foto enviada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar a foto");
    } finally {
      setUploading(false);
    }
  }

  async function uploadHeroImage(file: File) {
    if (!config) return;
    setUploadingHero(true);
    try {
      const url = await uploadToStorage(file);
      setConfig({ ...config, hero_image_url: url });
      const { error } = await supabase
        .from("site_settings")
        .update({ hero_image_url: url })
        .eq("id", true);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Imagem de capa atualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar a imagem");
    } finally {
      setUploadingHero(false);
    }
  }

  async function uploadHeroReset() {
    if (!config) return;
    setUploadingHero(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ hero_image_url: "" })
        .eq("id", true);
      if (error) throw error;
      setConfig({ ...config, hero_image_url: "" });
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Imagem original restaurada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao restaurar a imagem");
    } finally {
      setUploadingHero(false);
    }
  }



  async function saveGift(event: React.FormEvent) {
    event.preventDefault();
    setSavingGift(true);
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        price_cents: Math.round(Number(draft.price.replace(",", ".")) * 100) || 0,
        quantity: Number(draft.quantity) || 0,
        image_url: draft.image_url || null,
        is_active: draft.is_active,
      };
      const { error } = draft.id
        ? await supabase.from("gifts").update(payload).eq("id", draft.id)
        : await supabase.from("gifts").insert(payload);
      if (error) throw error;
      setDraft(emptyGift);
      await queryClient.invalidateQueries({ queryKey: ["gifts"] });
      toast.success("Presente salvo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar");
    } finally {
      setSavingGift(false);
    }
  }

  async function removeGift(id: string) {
    const { error } = await supabase.from("gifts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["gifts"] });
    toast.success("Presente removido");
  }

  async function saveConfig(event: React.FormEvent) {
    event.preventDefault();
    if (!config) return;
    setSavingConfig(true);
    try {
      const { error } = await supabase.from("site_settings").update(config).eq("id", true);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Informações atualizadas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar");
    } finally {
      setSavingConfig(false);
    }
  }

  type TextField = Extract<
    keyof SiteSettings,
    | "couple_names"
    | "wedding_date"
    | "ceremony_time"
    | "ceremony_venue"
    | "ceremony_address"
    | "maps_url"
    | "pix_key"
    | "pix_name"
    | "hero_eyebrow"
  >;

  const configFields: Array<[TextField, string]> = [
    ["couple_names", "Nomes dos noivos"],
    ["wedding_date", "Data do casamento"],
    ["ceremony_time", "Horário"],
    ["ceremony_venue", "Nome do local"],
    ["ceremony_address", "Endereço completo"],
    ["maps_url", "Link do mapa (opcional)"],
    ["hero_eyebrow", "Frase acima dos nomes"],
    ["pix_key", "Chave Pix (conta PJ)"],
    ["pix_name", "Nome do recebedor Pix"],
  ];

  const colorFields: Array<[Extract<keyof SiteSettings, `theme_${string}`>, string]> = [
    ["theme_primary", "Cor principal"],
    ["theme_background", "Cor de fundo"],
    ["theme_accent", "Cor de destaque"],
  ];

  const layouts: Array<[SiteSettings["hero_layout"], string, string]> = [
    ["full", "Foto cheia", "Foto ocupando a tela inteira com os textos por cima"],
    ["split", "Dividido", "Foto de um lado, textos e botões do outro"],
    ["minimal", "Minimalista", "Sem foto de fundo, só textos e botões"],
  ];

  async function saveConfigValues(patch: Partial<SiteSettings>) {
    if (!config) return;
    const next = { ...config, ...patch };
    setConfig(next);
    const { error } = await supabase.from("site_settings").update(patch).eq("id", true);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
  }

  async function addGalleryImage(file: File) {
    if (!config) return;
    setUploadingGallery(true);
    try {
      const url = await uploadToStorage(file);
      await saveConfigValues({ gallery_images: [...config.gallery_images, url] });
      toast.success("Foto adicionada à galeria");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar a foto");
    } finally {
      setUploadingGallery(false);
    }
  }


  return (
    <PageShell eyebrow="Área restrita" title="Painel dos Noivos">
      <div className="mb-8 flex justify-end">
        <Button
          variant="quiet"
          onClick={async () => {
            await queryClient.cancelQueries();
            queryClient.clear();
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
        >
          Sair
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">
          {draft.id ? "Editar presente" : "Adicionar presente"}
        </h2>
        <form
          onSubmit={saveGift}
          className="grid gap-5 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              required
              maxLength={120}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={3}
              maxLength={500}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              required
              inputMode="decimal"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade disponível (0 = ilimitado)</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={draft.quantity}
              onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="image">Foto do presente</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
              }}
            />
            {draft.image_url ? (
              <img
                src={draft.image_url}
                alt="Pré-visualização do presente"
                className="mt-2 h-32 w-44 rounded-sm object-cover"
              />
            ) : null}
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" variant="elegant" disabled={savingGift || uploading}>
              {savingGift ? "Salvando…" : draft.id ? "Salvar alterações" : "Adicionar presente"}
            </Button>
            {draft.id ? (
              <Button type="button" variant="quiet" onClick={() => setDraft(emptyGift)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Presentes cadastrados</h2>
        <ul className="space-y-3">
          {gifts?.map((gift) => (
            <li
              key={gift.id}
              className="flex items-center gap-4 rounded-sm border border-border bg-card p-4"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-sm bg-secondary">
                {gift.image_url ? (
                  <img src={gift.image_url} alt={gift.title} className="size-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-display text-lg">{gift.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatBRL(gift.price_cents)} · {gift.is_active ? "visível" : "oculto"}
                </p>
              </div>
              <Button variant="quiet" size="icon" onClick={() => editGift(gift)} aria-label="Editar">
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="quiet"
                size="icon"
                onClick={() => void removeGift(gift.id)}
                aria-label="Remover"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
          {gifts && gifts.length === 0 ? (
            <li className="text-sm text-muted-foreground">Nenhum presente cadastrado ainda.</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Imagem de capa</h2>
        <div className="space-y-4 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="aspect-21/9 w-full overflow-hidden rounded-sm bg-secondary">
            <img
              src={config?.hero_image_url || heroFallback}
              alt="Imagem de capa atual da página inicial"
              className="size-full object-cover"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_image">Trocar a foto da página inicial</Label>
            <Input
              id="hero_image"
              type="file"
              accept="image/*"
              disabled={uploadingHero || !config}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadHeroImage(file);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: imagem horizontal, no mínimo 1920px de largura.
            </p>
          </div>
          {config?.hero_image_url ? (
            <Button
              variant="quiet"
              disabled={uploadingHero}
              onClick={() => void uploadHeroReset()}
            >
              Voltar para a imagem original
            </Button>
          ) : null}
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Galeria de fotos da página inicial</h2>
        <div className="space-y-4 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {config?.gallery_images.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="Foto da galeria" className="aspect-square w-full rounded-sm object-cover" />
                <Button
                  variant="quiet"
                  size="icon"
                  aria-label="Remover foto"
                  className="absolute right-1 top-1 bg-card/80"
                  onClick={() =>
                    void saveConfigValues({
                      gallery_images: config.gallery_images.filter((item) => item !== url),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gallery_image">Adicionar foto</Label>
            <Input
              id="gallery_image"
              type="file"
              accept="image/*"
              disabled={uploadingGallery || !config}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void addGalleryImage(file);
              }}
            />
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Cores do site</h2>
        <div className="grid gap-5 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:grid-cols-3">
          {colorFields.map(([field, label]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={field}
                  type="color"
                  className="h-10 w-16 p-1"
                  value={config?.[field] || "#b9a678"}
                  onChange={(event) => config && setConfig({ ...config, [field]: event.target.value })}
                />
                {config?.[field] ? (
                  <Button variant="quiet" onClick={() => void saveConfigValues({ [field]: "" })}>
                    Padrão
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          <div className="sm:col-span-3">
            <Button
              variant="elegant"
              disabled={!config}
              onClick={() =>
                config &&
                void saveConfigValues({
                  theme_primary: config.theme_primary,
                  theme_background: config.theme_background,
                  theme_accent: config.theme_accent,
                }).then(() => toast.success("Cores atualizadas"))
              }
            >
              Salvar cores
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Layout da página inicial</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {layouts.map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              disabled={!config}
              onClick={() => void saveConfigValues({ hero_layout: value })}
              className={`rounded-sm border p-4 text-left transition-colors ${
                config?.hero_layout === value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span className="block font-display text-lg">{label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Botões da página inicial</h2>
        <div className="space-y-3">
          {config?.home_buttons.map((button, index) => (
            <div key={button.to} className="space-y-3 rounded-sm border border-border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`label-${button.to}`}>Título</Label>
                  <Input
                    id={`label-${button.to}`}
                    value={button.label}
                    onChange={(event) => {
                      const next = [...config.home_buttons];
                      next[index] = { ...button, label: event.target.value };
                      setConfig({ ...config, home_buttons: next });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`hint-${button.to}`}>Descrição</Label>
                  <Input
                    id={`hint-${button.to}`}
                    value={button.hint}
                    onChange={(event) => {
                      const next = [...config.home_buttons];
                      next[index] = { ...button, hint: event.target.value };
                      setConfig({ ...config, home_buttons: next });
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="quiet"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...config.home_buttons];
                    const previous = next[index - 1]!;
                    next[index - 1] = button;
                    next[index] = previous;
                    setConfig({ ...config, home_buttons: next });
                  }}
                >
                  Subir
                </Button>
                <Button
                  variant="quiet"
                  disabled={index === config.home_buttons.length - 1}
                  onClick={() => {
                    const next = [...config.home_buttons];
                    const following = next[index + 1]!;
                    next[index + 1] = button;
                    next[index] = following;
                    setConfig({ ...config, home_buttons: next });
                  }}
                >
                  Descer
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => {
                    const next = [...config.home_buttons];
                    next[index] = { ...button, visible: !button.visible };
                    setConfig({ ...config, home_buttons: next });
                  }}
                >
                  {button.visible ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="elegant"
            disabled={!config}
            onClick={() =>
              config &&
              void saveConfigValues({ home_buttons: config.home_buttons }).then(() =>
                toast.success("Botões atualizados"),
              )
            }
          >
            Salvar botões
          </Button>
        </div>
      </section>



      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Informações do casamento</h2>
        {config ? (
          <form
            onSubmit={saveConfig}
            className="grid gap-5 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:grid-cols-2"
          >
            {configFields.map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  value={config[field] ?? ""}
                  onChange={(event) => setConfig({ ...config, [field]: event.target.value })}
                />
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="welcome_message">Mensagem de boas-vindas</Label>
              <Textarea
                id="welcome_message"
                rows={3}
                value={config.welcome_message ?? ""}
                onChange={(event) => setConfig({ ...config, welcome_message: event.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="elegant" disabled={savingConfig}>
                {savingConfig ? "Salvando…" : "Salvar informações"}
              </Button>
            </div>
          </form>
        ) : null}
      </section>
    </PageShell>
  );
}
