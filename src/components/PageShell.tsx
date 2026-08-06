import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

import { useCart } from "@/lib/cart";

export function Ornament({ label }: { label?: string }) {
  return (
    <div className="rule-ornament my-6">
      <span className="h-px w-12 bg-primary/40" />
      <span className="font-display text-lg">{label ?? "✦"}</span>
      <span className="h-px w-12 bg-primary/40" />
    </div>
  );
}

export function PageShell({
  title,
  eyebrow,
  intro,
  children,
  showCart = false,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  children: ReactNode;
  showCart?: boolean;
}) {
  const { count } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <button
            type="button"
            className="eyebrow hover:text-foreground"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
                return;
              }
              window.location.assign("/");
            }}
          >
            ← Voltar
          </button>
          {showCart ? (
            <Link
              to="/carrinho"
              className="relative inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              <ShoppingBag className="size-4" />
              Carrinho
              {count > 0 ? (
                <span className="absolute -right-4 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-12">
        <div className="text-center">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h1>
          {intro ? (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {intro}
            </p>
          ) : null}
          <Ornament />
        </div>
        {children}
      </main>
    </div>
  );
}
