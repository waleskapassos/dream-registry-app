import { createServerFn } from "@tanstack/react-start";

export const recordSiteVisit = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("site_visits").insert({});

  if (error) {
    console.error("[Visitas] Falha ao registrar acesso", error.message);
    throw new Error("Não foi possível registrar o acesso.");
  }

  return { recorded: true };
});
