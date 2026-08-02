import { supabase } from "@/integrations/supabase/client";

export type Gift = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
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
  theme_primary: string;
  theme_background: string;
  theme_accent: string;
  gallery_images: string[];
  home_buttons: HomeButton[];
};

export const DEFAULT_HOME_BUTTONS: HomeButton[] = [
  {
    to: "/presentes",
    label: "Lista de Presentes",
    hint: "Escolha um presente e pague com Pix ou cartão",
    visible: true,
  },
  { to: "/local", label: "Local da Cerimônia", hint: "Endereço, horário e como chegar", visible: true },
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
  theme_primary: "",
  theme_background: "",
  theme_accent: "",
  gallery_images: [],
  home_buttons: DEFAULT_HOME_BUTTONS,
};

const SETTINGS_COLUMNS =
  "couple_names, wedding_date, ceremony_venue, ceremony_address, maps_url, ceremony_time, pix_key, pix_name, welcome_message, hero_image_url, hero_eyebrow, hero_layout, theme_primary, theme_background, theme_accent, gallery_images, home_buttons";

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
    const { data, error } = await supabase.from("site_settings").select(SETTINGS_COLUMNS).maybeSingle();
    if (error) throw error;
    if (!data) return DEFAULT_SETTINGS;
    const row = data as Record<string, unknown>;
    const layout = String(row["hero_layout"]);
    const gallery = row["gallery_images"];
    return {
      ...DEFAULT_SETTINGS,
      ...(data as object),
      hero_layout: (["full", "split", "minimal"].includes(layout) ? layout : "full") as HeroLayout,
      gallery_images: Array.isArray(gallery)
        ? (gallery as unknown[]).filter((item): item is string => typeof item === "string")
        : [],
      home_buttons: normalizeButtons(row["home_buttons"]),
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
