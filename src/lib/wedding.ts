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
};

export const settingsQuery = {
  queryKey: ["site-settings"],
  queryFn: async (): Promise<SiteSettings> => {
    const { data, error } = await supabase
      .from("site_settings")
      .select(
        "couple_names, wedding_date, ceremony_venue, ceremony_address, maps_url, ceremony_time, pix_key, pix_name, welcome_message",
      )
      .maybeSingle();
    if (error) throw error;
    return (
      data ?? {
        couple_names: "Nossos Nomes",
        wedding_date: "",
        ceremony_venue: "",
        ceremony_address: "",
        maps_url: "",
        ceremony_time: "",
        pix_key: "",
        pix_name: "",
        welcome_message: "",
      }
    );
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
