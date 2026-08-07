export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      gifts: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          image_url: string | null;
          is_active: boolean;
          nubank_payment_url: string;
          nubank_credit_payment_url: string;
          nubank_debit_payment_url: string;
          price_cents: number;
          purchased_count: number;
          quantity: number;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          nubank_payment_url?: string;
          nubank_credit_payment_url?: string;
          nubank_debit_payment_url?: string;
          price_cents?: number;
          purchased_count?: number;
          quantity?: number;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          nubank_payment_url?: string;
          nubank_credit_payment_url?: string;
          nubank_debit_payment_url?: string;
          price_cents?: number;
          purchased_count?: number;
          quantity?: number;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          gift_id: string | null;
          id: string;
          order_id: string;
          quantity: number;
          title: string;
          unit_price_cents: number;
        };
        Insert: {
          gift_id?: string | null;
          id?: string;
          order_id: string;
          quantity?: number;
          title: string;
          unit_price_cents?: number;
        };
        Update: {
          gift_id?: string | null;
          id?: string;
          order_id?: string;
          quantity?: number;
          title?: string;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_gift_id_fkey";
            columns: ["gift_id"];
            isOneToOne: false;
            referencedRelation: "gifts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          guest_email: string | null;
          guest_name: string;
          guest_phone: string | null;
          id: string;
          message: string | null;
          payment_method: string;
          status: string;
          total_cents: number;
        };
        Insert: {
          created_at?: string;
          guest_email?: string | null;
          guest_name: string;
          guest_phone?: string | null;
          id?: string;
          message?: string | null;
          payment_method?: string;
          status?: string;
          total_cents?: number;
        };
        Update: {
          created_at?: string;
          guest_email?: string | null;
          guest_name?: string;
          guest_phone?: string | null;
          id?: string;
          message?: string | null;
          payment_method?: string;
          status?: string;
          total_cents?: number;
        };
        Relationships: [];
      };
      rsvps: {
        Row: {
          attending: boolean;
          created_at: string;
          email: string | null;
          guests: number;
          id: string;
          message: string | null;
          name: string;
          phone: string | null;
          companion_names: string | null;
          dietary_restrictions: string | null;
        };
        Insert: {
          attending?: boolean;
          created_at?: string;
          email?: string | null;
          guests?: number;
          id?: string;
          message?: string | null;
          name: string;
          phone?: string | null;
          companion_names?: string | null;
          dietary_restrictions?: string | null;
        };
        Update: {
          attending?: boolean;
          created_at?: string;
          email?: string | null;
          guests?: number;
          id?: string;
          message?: string | null;
          name?: string;
          phone?: string | null;
          companion_names?: string | null;
          dietary_restrictions?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          ceremony_address: string;
          ceremony_time: string;
          ceremony_venue: string;
          couple_names: string;
          gallery_images: Json;
          hero_eyebrow: string;
          hero_image_url: string;
          font_body: string;
          font_body_style: string;
          font_body_weight: number;
          font_heading: string;
          font_heading_style: string;
          font_heading_weight: number;
          hero_overlay_opacity: number;
          hero_layout: string;
          home_buttons: Json;
          id: boolean;
          maps_url: string;
          pix_key: string;
          pix_name: string;
          theme_accent: string;
          theme_background: string;
          theme_primary: string;
          theme_text: string;
          typography_styles: Json;
          youtube_music_url: string;
          updated_at: string;
          wedding_date: string;
          welcome_message: string;
        };
        Insert: {
          ceremony_address?: string;
          ceremony_time?: string;
          ceremony_venue?: string;
          couple_names?: string;
          gallery_images?: Json;
          hero_eyebrow?: string;
          hero_image_url?: string;
          font_body?: string;
          font_body_style?: string;
          font_body_weight?: number;
          font_heading?: string;
          font_heading_style?: string;
          font_heading_weight?: number;
          hero_overlay_opacity?: number;
          hero_layout?: string;
          home_buttons?: Json;
          id?: boolean;
          maps_url?: string;
          pix_key?: string;
          pix_name?: string;
          theme_accent?: string;
          theme_background?: string;
          theme_primary?: string;
          theme_text?: string;
          typography_styles?: Json;
          youtube_music_url?: string;
          updated_at?: string;
          wedding_date?: string;
          welcome_message?: string;
        };
        Update: {
          ceremony_address?: string;
          ceremony_time?: string;
          ceremony_venue?: string;
          couple_names?: string;
          gallery_images?: Json;
          hero_eyebrow?: string;
          hero_image_url?: string;
          font_body?: string;
          font_body_style?: string;
          font_body_weight?: number;
          font_heading?: string;
          font_heading_style?: string;
          font_heading_weight?: number;
          hero_overlay_opacity?: number;
          hero_layout?: string;
          home_buttons?: Json;
          id?: boolean;
          maps_url?: string;
          pix_key?: string;
          pix_name?: string;
          theme_accent?: string;
          theme_background?: string;
          theme_primary?: string;
          theme_text?: string;
          typography_styles?: Json;
          youtube_music_url?: string;
          updated_at?: string;
          wedding_date?: string;
          welcome_message?: string;
        };
        Relationships: [];
      };
      site_visits: {
        Row: { created_at: string; id: string };
        Insert: { created_at?: string; id?: string };
        Update: { created_at?: string; id?: string };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_admin: { Args: never; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const;
