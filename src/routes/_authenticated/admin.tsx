import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type CSSProperties } from "react";
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
import { getYouTubeVideoId } from "@/lib/youtube";
import {
  FONT_OPTIONS,
  adminGiftsQuery,
  settingsQuery,
  type Gift,
  type SiteSettings,
  type TypographyStyles,
} from "@/lib/wedding";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel dos Noivos — Gerenciar Site" },
      {
        name: "description",
        content: "Gerencie a lista de presentes e as informações do casamento.",
      },
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

function createUploadPath(file: File): string {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const filename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
  return `${id}-${filename}`;
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
    const [r = 0, g = 0, b = 0] = channels.map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  if (!/^#[0-9a-f]{6}$/i.test(foreground) || !/^#[0-9a-f]{6}$/i.test(background)) return null;
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

function AdminPage() {
  const [area, setArea] = useState<"layout" | "presentes" | "confirmacoes" | "estatisticas">(
    "layout",
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: gifts } = useQuery(adminGiftsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const { data: rsvps = [] } = useQuery({
    queryKey: ["rsvps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: visits = [] } = useQuery({
    queryKey: ["site-visits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_visits").select("id");
      if (error) throw error;
      return data ?? [];
    },
  });
  const paidOrders = orders.filter((order) => order.status === "paid");
  const receivedTotalCents = paidOrders.reduce((total, order) => total + order.total_cents, 0);

  const [draft, setDraft] = useState(emptyGift);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [editingGalleryTitle, setEditingGalleryTitle] = useState(false);

  const [savingGift, setSavingGift] = useState(false);
  const [config, setConfig] = useState<SiteSettings | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const textContrast = config
    ? contrastRatio(config.theme_text || "#554f46", config.theme_background || "#faf7f0")
    : null;

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
    const path = createUploadPath(file);
    const { error } = await supabase.storage.from("gift-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data, error: signError } = await supabase.storage
      .from("gift-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (signError || !data?.signedUrl)
      throw signError ?? new Error("Falha ao gerar o link da foto");
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

  async function setOrderPaid(orderId: string, paid: boolean) {
    const { error } = await supabase
      .from("orders")
      .update({ status: paid ? "paid" : "pending" })
      .eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
    toast.success(paid ? "Pagamento confirmado" : "Pagamento marcado como pendente");
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
    ["pix_key", "Chave Pix (conta PJ)"],
    ["pix_name", "Nome do recebedor Pix"],
  ];

  const colorFields: Array<[Extract<keyof SiteSettings, `theme_${string}`>, string]> = [
    ["theme_primary", "Cor principal"],
    ["theme_background", "Cor de fundo"],
    ["theme_accent", "Cor de destaque"],
    ["theme_text", "Cor dos textos"],
  ];

  const layouts: Array<[SiteSettings["hero_layout"], string, string]> = [
    ["full", "Foto cheia", "Foto ocupando a tela inteira com os textos por cima"],
    ["split", "Dividido", "Foto de um lado, textos e botões do outro"],
    ["minimal", "Minimalista", "Sem foto de fundo, só textos e botões"],
  ];

  const typographyGroups: Array<[keyof TypographyStyles, string, string]> = [
    ["couple_names", "Nomes dos noivos", "Nome principal exibido na página inicial"],
    ["wedding_date", "Data do casamento", "Data mostrada abaixo dos nomes"],
    ["eyebrow", "Frases de destaque", "Textos pequenos em letras espaçadas"],
    ["heading", "Títulos das páginas", "Lista de Presentes, Local, Carrinho e demais títulos"],
    ["body", "Textos e recados", "Frases, descrições e recadinho dos noivos"],
  ];

  function updateTypography(
    group: keyof TypographyStyles,
    patch: Partial<TypographyStyles[keyof TypographyStyles]>,
  ) {
    if (!config) return;
    setConfig({
      ...config,
      typography_styles: {
        ...config.typography_styles,
        [group]: { ...config.typography_styles[group], ...patch },
      },
    });
  }

  function previewStyle(group: keyof TypographyStyles): CSSProperties {
    const style = config?.typography_styles[group];
    const fonts = {
      elegant: '"Cormorant Garamond", Georgia, serif',
      "great-vibes": '"Great Vibes", cursive',
      "dancing-script": '"Dancing Script", cursive',
      playfair: '"Playfair Display", Georgia, serif',
      lora: "Lora, Georgia, serif",
      "libre-baskerville": '"Libre Baskerville", Georgia, serif',
      classic: 'Georgia, "Times New Roman", serif',
      modern: "Karla, ui-sans-serif, system-ui, sans-serif",
      montserrat: "Montserrat, ui-sans-serif, system-ui, sans-serif",
      poppins: "Poppins, ui-sans-serif, system-ui, sans-serif",
      roboto: "Roboto, ui-sans-serif, system-ui, sans-serif",
      "open-sans": '"Open Sans", ui-sans-serif, system-ui, sans-serif',
    };
    return style
      ? {
          fontFamily: fonts[style.font],
          color: style.color || config?.theme_text || undefined,
          fontSize: style.size,
          fontWeight: style.bold ? 700 : 400,
          fontStyle: style.italic ? "italic" : "normal",
        }
      : {};
  }

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
      <nav className="mb-8 grid gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setArea("layout")}
          className="rounded-sm border border-border p-3 text-center text-sm hover:border-primary"
        >
          Layout
        </button>
        <button
          type="button"
          onClick={() => setArea("presentes")}
          className="rounded-sm border border-border p-3 text-center text-sm hover:border-primary"
        >
          Presentes
        </button>
        <button
          type="button"
          onClick={() => setArea("confirmacoes")}
          className="rounded-sm border border-border p-3 text-center text-sm hover:border-primary"
        >
          Confirmações
        </button>
        <button
          type="button"
          onClick={() => setArea("estatisticas")}
          className="rounded-sm border border-border p-3 text-center text-sm hover:border-primary"
        >
          Estatísticas
        </button>
      </nav>
      <section
        hidden={area !== "estatisticas"}
        id="estatisticas"
        className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Acessos</p>
          <p className="font-display text-3xl">{visits.length}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Confirmações</p>
          <p className="font-display text-3xl">{rsvps.filter((rsvp) => rsvp.attending).length}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Pagamentos confirmados
          </p>
          <p className="font-display text-3xl">{paidOrders.length}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total recebido</p>
          <p className="font-display text-3xl">{formatBRL(receivedTotalCents)}</p>
        </div>
      </section>
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

      <section hidden={area !== "presentes"} id="presentes" className="space-y-4">
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

      <section hidden={area !== "layout"} id="layout" className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Tipografia</h2>
        <div className="grid gap-5 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="font_heading">Fonte dos títulos</Label>
            <select
              id="font_heading"
              className="flex h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
              value={config?.font_heading ?? "elegant"}
              onChange={(event) =>
                config && setConfig({ ...config, font_heading: event.target.value })
              }
            >
              {FONT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="font_body">Fonte dos textos</Label>
            <select
              id="font_body"
              className="flex h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
              value={config?.font_body ?? "modern"}
              onChange={(event) =>
                config && setConfig({ ...config, font_body: event.target.value })
              }
            >
              {FONT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {(["heading", "body"] as const).map((target) => (
            <div key={target} className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`font_${target}_weight`}>
                  {target === "heading" ? "Peso dos títulos" : "Peso dos textos"}
                </Label>
                <select
                  id={`font_${target}_weight`}
                  className="flex h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
                  value={
                    target === "heading"
                      ? (config?.font_heading_weight ?? 300)
                      : (config?.font_body_weight ?? 400)
                  }
                  onChange={(event) =>
                    config &&
                    setConfig({
                      ...config,
                      [target === "heading" ? "font_heading_weight" : "font_body_weight"]: Number(
                        event.target.value,
                      ),
                    })
                  }
                >
                  <option value={300}>Fino</option>
                  <option value={400}>Normal</option>
                  <option value={700}>Negrito</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`font_${target}_style`}>
                  {target === "heading" ? "Estilo dos títulos" : "Estilo dos textos"}
                </Label>
                <select
                  id={`font_${target}_style`}
                  className="flex h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
                  value={
                    target === "heading"
                      ? (config?.font_heading_style ?? "normal")
                      : (config?.font_body_style ?? "normal")
                  }
                  onChange={(event) =>
                    config &&
                    setConfig({
                      ...config,
                      [target === "heading" ? "font_heading_style" : "font_body_style"]:
                        event.target.value,
                    })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Itálico</option>
                </select>
              </div>
            </div>
          ))}
          <div className="space-y-4 border-t border-border pt-6 sm:col-span-2">
            <div>
              <h3 className="font-display text-xl">Estilo de cada parte do site</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Personalize fonte, cor, tamanho, negrito e itálico separadamente.
              </p>
            </div>
            <div className="grid gap-4">
              {typographyGroups.map(([group, label, hint]) => {
                const style = config?.typography_styles[group];
                if (!style) return null;
                return (
                  <fieldset
                    key={group}
                    className="grid gap-4 rounded-2xl border border-border bg-background/60 p-4 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    <legend className="px-2 font-display text-lg">{label}</legend>
                    <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-5">
                      {hint}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor={`${group}-font`}>Fonte</Label>
                      <select
                        id={`${group}-font`}
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                        value={style.font}
                        onChange={(event) =>
                          updateTypography(group, {
                            font: event.target.value as typeof style.font,
                          })
                        }
                      >
                        {FONT_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${group}-color`}>Cor</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${group}-color`}
                          type="color"
                          className="h-10 w-16 rounded-xl p-1"
                          value={style.color || "#554f46"}
                          onChange={(event) =>
                            updateTypography(group, { color: event.target.value })
                          }
                        />
                        {style.color ? (
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            onClick={() => updateTypography(group, { color: "" })}
                          >
                            Padrão
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${group}-size`}>Tamanho (px)</Label>
                      <Input
                        id={`${group}-size`}
                        type="number"
                        min={9}
                        max={120}
                        value={style.size}
                        onChange={(event) =>
                          updateTypography(group, { size: Number(event.target.value) })
                        }
                      />
                    </div>
                    <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-input px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={style.bold}
                        onChange={(event) =>
                          updateTypography(group, { bold: event.target.checked })
                        }
                      />
                      <strong>Negrito</strong>
                    </label>
                    <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-input px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={style.italic}
                        onChange={(event) =>
                          updateTypography(group, { italic: event.target.checked })
                        }
                      />
                      <em>Itálico</em>
                    </label>
                  </fieldset>
                );
              })}
            </div>
          </div>
          {config ? (
            <div
              className="space-y-4 rounded-2xl border-2 border-dashed border-primary/50 p-6 text-center sm:col-span-2"
              style={{
                background: config.theme_background || undefined,
                color: config.theme_text || undefined,
              }}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Pré-visualização
              </p>
              <h3 style={previewStyle("couple_names")}>
                {config.couple_names || "Nomes dos Noivos"}
              </h3>
              <p style={previewStyle("wedding_date")}>
                {config.wedding_date || "Data do casamento"}
              </p>
              <p style={previewStyle("eyebrow")}>{config.hero_eyebrow || "Frase da galeria"}</p>
              <p style={previewStyle("heading")}>Título de uma página</p>
              <p style={previewStyle("body")}>
                Este é um exemplo de como os textos e recados aparecerão no site.
              </p>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <Button
              variant="elegant"
              disabled={!config}
              onClick={() =>
                config &&
                void saveConfigValues({
                  font_heading: config.font_heading,
                  font_body: config.font_body,
                  font_heading_weight: config.font_heading_weight,
                  font_body_weight: config.font_body_weight,
                  font_heading_style: config.font_heading_style,
                  font_body_style: config.font_body_style,
                  typography_styles: config.typography_styles,
                }).then(() => toast.success("Tipografia atualizada"))
              }
            >
              Salvar tipografia
            </Button>
          </div>
        </div>
      </section>

      <section hidden={area !== "presentes"} className="mt-12 space-y-4">
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
              <Button
                variant="quiet"
                size="icon"
                onClick={() => editGift(gift)}
                aria-label="Editar"
              >
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

      <section hidden={area !== "layout"} className="mt-12 space-y-4">
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
            <Button variant="quiet" disabled={uploadingHero} onClick={() => void uploadHeroReset()}>
              Voltar para a imagem original
            </Button>
          ) : null}
        </div>
      </section>

      <section hidden={area !== "layout"} className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Galeria de fotos da página inicial</h2>
        <div className="space-y-4 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="space-y-3 rounded-2xl border border-primary/35 bg-primary/5 p-4">
            <div className="space-y-2">
              <Label htmlFor="gallery_title">Frase acima da galeria de fotos</Label>
              <Textarea
                id="gallery_title"
                rows={4}
                maxLength={500}
                placeholder="Digite a frase que aparecerá acima das fotos"
                value={config?.hero_eyebrow ?? ""}
                onChange={(event) =>
                  config && setConfig({ ...config, hero_eyebrow: event.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Você pode inserir uma frase completa, versículo ou dedicatória. O texto aceita até
                500 caracteres.
              </p>
            </div>
            <Button
              type="button"
              variant="quiet"
              onClick={() => setEditingGalleryTitle((current) => !current)}
            >
              {editingGalleryTitle ? "Fechar edição da aparência" : "Editar aparência da frase"}
            </Button>
            {editingGalleryTitle && config ? (
              <div className="grid gap-4 rounded-2xl border border-border bg-background/70 p-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="gallery-title-font">Fonte</Label>
                  <select
                    id="gallery-title-font"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={config.typography_styles.gallery_title.font}
                    onChange={(event) =>
                      updateTypography("gallery_title", {
                        font: event.target.value as TypographyStyles["gallery_title"]["font"],
                      })
                    }
                  >
                    {FONT_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gallery-title-size">Tamanho (px)</Label>
                  <Input
                    id="gallery-title-size"
                    type="number"
                    min={18}
                    max={48}
                    value={config.typography_styles.gallery_title.size}
                    onChange={(event) =>
                      updateTypography("gallery_title", { size: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gallery-title-color">Cor</Label>
                  <Input
                    id="gallery-title-color"
                    type="color"
                    className="h-10 w-16 rounded-xl p-1"
                    value={config.typography_styles.gallery_title.color || "#554f46"}
                    onChange={(event) =>
                      updateTypography("gallery_title", { color: event.target.value })
                    }
                  />
                </div>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-input px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={config.typography_styles.gallery_title.bold}
                    onChange={(event) =>
                      updateTypography("gallery_title", { bold: event.target.checked })
                    }
                  />
                  <strong>Negrito</strong>
                </label>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-input px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={config.typography_styles.gallery_title.italic}
                    onChange={(event) =>
                      updateTypography("gallery_title", { italic: event.target.checked })
                    }
                  />
                  <em>Itálico</em>
                </label>
                <div
                  className="rounded-xl border border-dashed border-primary/50 p-4 text-center sm:col-span-2 lg:col-span-5"
                  style={previewStyle("gallery_title")}
                >
                  {config.hero_eyebrow || "Prévia da frase da galeria"}
                </div>
              </div>
            ) : null}
            <Button
              type="button"
              variant="elegant"
              disabled={!config || !config.hero_eyebrow.trim()}
              onClick={() =>
                config &&
                void saveConfigValues({
                  hero_eyebrow: config.hero_eyebrow.trim(),
                  typography_styles: config.typography_styles,
                }).then(() => toast.success("Frase da galeria atualizada"))
              }
            >
              Salvar frase da galeria
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {config?.gallery_images.map((url) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt="Foto da galeria"
                  className="aspect-square w-full rounded-sm object-cover"
                />
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

      <section hidden={area !== "layout"} className="mt-12 space-y-4">
        <h2 className="font-display text-2xl">Música do site</h2>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="space-y-2">
            <Label htmlFor="youtube_music_url">Link da música no YouTube</Label>
            <Input
              id="youtube_music_url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={config?.youtube_music_url ?? ""}
              onChange={(event) =>
                config && setConfig({ ...config, youtube_music_url: event.target.value })
              }
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Aceita links do YouTube, youtu.be, Shorts ou embed. Por regra dos navegadores, o
              visitante toca em “Ouvir nossa música” para iniciar o som.
            </p>
            {config?.youtube_music_url && !getYouTubeVideoId(config.youtube_music_url) ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                Este link do YouTube não é válido ou não contém um vídeo reconhecido.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="elegant"
              disabled={
                !config ||
                (!!config.youtube_music_url && !getYouTubeVideoId(config.youtube_music_url))
              }
              onClick={() =>
                config &&
                void saveConfigValues({ youtube_music_url: config.youtube_music_url.trim() }).then(
                  () => toast.success("Música atualizada"),
                )
              }
            >
              Salvar música
            </Button>
            {config?.youtube_music_url ? (
              <Button
                type="button"
                variant="quiet"
                onClick={() => void saveConfigValues({ youtube_music_url: "" })}
              >
                Remover música
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section hidden={area !== "layout"} className="mt-12 space-y-4">
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
                  onChange={(event) =>
                    config && setConfig({ ...config, [field]: event.target.value })
                  }
                />
                {config?.[field] ? (
                  <Button variant="quiet" onClick={() => void saveConfigValues({ [field]: "" })}>
                    Padrão
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {textContrast !== null && textContrast < 4.5 ? (
            <div className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-4 text-sm sm:col-span-3">
              <strong>Contraste baixo:</strong> a cor do texto pode ficar difícil de ler sobre o
              fundo. Escolha cores mais diferentes antes de salvar.
            </div>
          ) : null}
          <div className="space-y-2 sm:col-span-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="hero_overlay_opacity">Transparência da foto principal</Label>
              <span className="text-sm text-muted-foreground">
                {config?.hero_overlay_opacity ?? 92}%
              </span>
            </div>
            <Input
              id="hero_overlay_opacity"
              type="range"
              min={0}
              max={100}
              step={1}
              value={config?.hero_overlay_opacity ?? 92}
              onChange={(event) =>
                config && setConfig({ ...config, hero_overlay_opacity: Number(event.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              0% deixa a foto nítida; 100% a cobre com a cor de fundo.
            </p>
          </div>
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
                  theme_text: config.theme_text,
                  hero_overlay_opacity: config.hero_overlay_opacity,
                }).then(() => toast.success("Cores atualizadas"))
              }
            >
              Salvar cores
            </Button>
          </div>
        </div>
      </section>

      <section hidden={area !== "layout"} className="mt-12 space-y-4">
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

      <section hidden={area !== "layout"} className="mt-12 space-y-4">
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

      <section hidden={area !== "layout"} className="mt-12 space-y-4">
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
      <section hidden={area !== "confirmacoes"} id="confirmacoes" className="mt-12 space-y-5">
        <h2 className="font-display text-2xl">Confirmações e presentes recebidos</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-sm border border-border bg-card p-5">
            <h3 className="font-display text-xl">Confirmações de presença</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {rsvps.map((rsvp) => (
                <li key={rsvp.id} className="border-b border-border pb-3">
                  <strong>{rsvp.name}</strong> ·{" "}
                  {rsvp.attending ? "vai comparecer" : "não poderá ir"}
                  <br />
                  <span className="text-muted-foreground">
                    {rsvp.guests} acompanhante(s){rsvp.message ? ` — ${rsvp.message}` : ""}
                  </span>
                  {rsvp.companion_names ? (
                    <p className="mt-1 text-muted-foreground">
                      Acompanhantes: {rsvp.companion_names}
                    </p>
                  ) : null}
                  {rsvp.dietary_restrictions ? (
                    <p className="mt-1 text-muted-foreground">
                      Restrições alimentares: {rsvp.dietary_restrictions}
                    </p>
                  ) : null}
                </li>
              ))}
              {rsvps.length === 0 ? (
                <li className="text-muted-foreground">Nenhuma confirmação ainda.</li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-sm border border-border bg-card p-5">
            <h3 className="font-display text-xl">Pagamentos dos presentes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Total confirmado: {formatBRL(receivedTotalCents)}
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {orders.map((order) => (
                <li key={order.id} className="border-b border-border pb-3">
                  <strong>{order.guest_name}</strong> · {formatBRL(order.total_cents)}
                  <br />
                  <span className="text-muted-foreground">
                    {order.payment_method} ·{" "}
                    {order.status === "paid" ? "pago" : "aguardando pagamento"}
                  </span>
                  <Button
                    type="button"
                    variant={order.status === "paid" ? "quiet" : "gold"}
                    size="sm"
                    className="mt-2"
                    onClick={() => void setOrderPaid(order.id, order.status !== "paid")}
                  >
                    {order.status === "paid" ? "Marcar pendente" : "Confirmar pagamento"}
                  </Button>
                </li>
              ))}
              {orders.length === 0 ? (
                <li className="text-muted-foreground">Nenhum presente registrado ainda.</li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
