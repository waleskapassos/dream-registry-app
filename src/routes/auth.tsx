import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Área dos Noivos — Acesso" },
      { name: "description", content: "Acesso restrito para os noivos gerenciarem o site." },
      { property: "og:title", content: "Área dos Noivos" },
      { property: "og:description", content: "Acesso restrito para gerenciar o site." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Confira seu e-mail para confirmar a conta.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError ?? new Error("Usuário não encontrado.");

      const { data: adminRole, error: roleError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleError) throw roleError;
      if (!adminRole) {
        throw new Error("Esta conta não tem permissão de administrador.");
      }
      navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell
      eyebrow="Acesso restrito"
      title="Área dos Noivos"
      intro="Entre para gerenciar a lista de presentes e as informações do casamento."
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-sm space-y-5 rounded-sm border border-border bg-card p-8 shadow-[var(--shadow-soft)]"
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <Button type="submit" variant="elegant" size="lg" className="w-full" disabled={pending}>
          {pending ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
        </Button>
        <button
          type="button"
          className="w-full text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
        </button>
      </form>
    </PageShell>
  );
}
