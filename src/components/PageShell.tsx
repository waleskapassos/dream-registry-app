import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag } from "lucide-react";
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
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-primary/75 bg-card px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-foreground shadow-[var(--shadow-button)] transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
                return;
              }
              window.location.assign("/");
            }}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar
          </button>
          {showCart ? (
            <Link
              to="/carrinho"
              className="relative inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-primary bg-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground shadow-[var(--shadow-button)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShoppingBag className="size-4" />
              Carrinho
              {count > 0 ? (
                <span className="absolute -right-1 -top-2 flex size-6 items-center justify-center rounded-full border-2 border-background bg-foreground text-[10px] text-background shadow-sm">
                  {count}
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-5xl px-4 pb-24 pt-10 sm:px-5 sm:pt-12">
        <div className="text-center">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="type-heading mt-3">{title}</h1>
          {intro ? (
            <p className="type-body mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
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
