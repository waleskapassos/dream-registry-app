import { supabase } from "@/integrations/supabase/client";

export type Gift = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  nubank_payment_url: string;
  nubank_credit_payment_url: string;
  nubank_debit_payment_url: string;
  price_cents: number;
  quantity: number;
  purchased_count: number;
  sort_order: number;
  is_active: boolean;
};

export type HomeButton = {
  to: "/presentes" | "/local" | "/confirmar";
  label: string;
  hint: string;
  visible: boolean;
};

export type HeroLayout = "full" | "split" | "minimal";

export type TextStyle = {
  font: "elegant" | "classic" | "modern";
  color: string;
  size: number;
  bold: boolean;
  italic: boolean;
};

export type TypographyStyles = {
  couple_names: TextStyle;
  wedding_date: TextStyle;
  eyebrow: TextStyle;
  heading: TextStyle;
  body: TextStyle;
};

export const DEFAULT_TYPOGRAPHY_STYLES: TypographyStyles = {
  couple_names: { font: "elegant", color: "", size: 72, bold: false, italic: false },
  wedding_date: { font: "elegant", color: "", size: 20, bold: false, italic: false },
  eyebrow: { font: "modern", color: "", size: 11, bold: false, italic: false },
  heading: { font: "elegant", color: "", size: 40, bold: false, italic: false },
  body: { font: "modern", color: "", size: 14, bold: false, italic: false },
};

export type SiteSettings = {
  couple_names: string;
  wedding_date: string;
  ceremony_venue: string;
  ceremony_address: string;
  maps_url: string;
  ceremony_time: string;
  pix_key: string;
  pix_name: string;
  welcome_message: string;
  hero_image_url: string;
  hero_eyebrow: string;
  hero_layout: HeroLayout;
  hero_overlay_opacity: number;
  font_heading: string;
  font_body: string;
  font_heading_weight: number;
  font_body_weight: number;
  font_heading_style: string;
  font_body_style: string;
  theme_primary: string;
  theme_background: string;
  theme_accent: string;
  theme_text: string;
  gallery_images: string[];
  home_buttons: HomeButton[];
  typography_styles: TypographyStyles;
  youtube_music_url: string;
};

export const DEFAULT_HOME_BUTTONS: HomeButton[] = [
  {
    to: "/presentes",
    label: "Lista de Presentes",
    hint: "Escolha um presente e pague com Pix ou cartão",
    visible: true,
  },
  {
    to: "/local",
    label: "Local da Cerimônia",
    hint: "Endereço, horário e como chegar",
    visible: true,
  },
  {
    to: "/confirmar",
    label: "Confirmar Presença",
    hint: "Nos avise se você vem celebrar com a gente",
    visible: true,
  },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  couple_names: "Nossos Nomes",
  wedding_date: "",
  ceremony_venue: "",
  ceremony_address: "",
  maps_url: "",
  ceremony_time: "",
  pix_key: "",
  pix_name: "",
  welcome_message: "",
  hero_image_url: "",
  hero_eyebrow: "Vamos nos casar",
  hero_layout: "full",
  hero_overlay_opacity: 92,
  font_heading: "elegant",
  font_body: "modern",
  font_heading_weight: 300,
  font_body_weight: 400,
  font_heading_style: "normal",
  font_body_style: "normal",
  theme_primary: "",
  theme_background: "",
  theme_accent: "",
  theme_text: "",
  gallery_images: [],
  home_buttons: DEFAULT_HOME_BUTTONS,
  typography_styles: DEFAULT_TYPOGRAPHY_STYLES,
  youtube_music_url: "",
};

function normalizeTypography(value: unknown): TypographyStyles {
  const source =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_TYPOGRAPHY_STYLES).map(([key, fallback]) => {
      const raw =
        typeof source[key] === "object" && source[key] !== null
          ? (source[key] as Record<string, unknown>)
          : {};
      const font = String(raw["font"] ?? fallback.font);
      const size = Number(raw["size"] ?? fallback.size);
      const color = String(raw["color"] ?? fallback.color);
      return [
        key,
        {
          font: (["elegant", "classic", "modern"].includes(font)
            ? font
            : fallback.font) as TextStyle["font"],
          color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : "",
          size: Number.isFinite(size) ? Math.min(120, Math.max(9, size)) : fallback.size,
          bold: raw["bold"] === true,
          italic: raw["italic"] === true,
        },
      ];
    }),
  ) as TypographyStyles;
}

function normalizeButtons(value: unknown): HomeButton[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_HOME_BUTTONS;
  const allowed = DEFAULT_HOME_BUTTONS.map((button) => button.to);
  const parsed = value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const rawTo = item["to"];
      const fallback =
        DEFAULT_HOME_BUTTONS.find((button) => button.to === rawTo) ?? DEFAULT_HOME_BUTTONS[0]!;
      const label = item["label"];
      const hint = item["hint"];
      return {
        to: (allowed.includes(rawTo as HomeButton["to"]) ? rawTo : fallback.to) as HomeButton["to"],
        label: typeof label === "string" && label ? label : fallback.label,
        hint: typeof hint === "string" ? hint : fallback.hint,
        visible: item["visible"] !== false,
      };
    });
  const missing = DEFAULT_HOME_BUTTONS.filter(
    (button) => !parsed.some((item) => item.to === button.to),
  );
  return [...parsed, ...missing];
}

export const settingsQuery = {
  queryKey: ["site-settings"],
  queryFn: async (): Promise<SiteSettings> => {
    const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
    if (error) throw error;
    if (!data) return DEFAULT_SETTINGS;
    const row = data as Record<string, unknown>;
    const layout = String(row["hero_layout"]);
    const gallery = row["gallery_images"];
    const overlayOpacity = Number(row["hero_overlay_opacity"]);
    return {
      ...DEFAULT_SETTINGS,
      ...(data as object),
      hero_layout: (["full", "split", "minimal"].includes(layout) ? layout : "full") as HeroLayout,
      hero_overlay_opacity:
        Number.isFinite(overlayOpacity) && overlayOpacity >= 0 && overlayOpacity <= 100
          ? overlayOpacity
          : DEFAULT_SETTINGS.hero_overlay_opacity,
      gallery_images: Array.isArray(gallery)
        ? (gallery as unknown[]).filter((item): item is string => typeof item === "string")
        : [],
      home_buttons: normalizeButtons(row["home_buttons"]),
      typography_styles: normalizeTypography(row["typography_styles"]),
    };
  },
};

export const publicGiftsQuery = {
  queryKey: ["gifts", "public"],
  queryFn: async (): Promise<Gift[]> => {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Gift[];
  },
};

export const adminGiftsQuery = {
  queryKey: ["gifts", "admin"],
  queryFn: async (): Promise<Gift[]> => {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Gift[];
  },
};
