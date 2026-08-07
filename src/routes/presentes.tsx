import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { publicGiftsQuery } from "@/lib/wedding";

export const Route = createFileRoute("/presentes")({
  head: () => ({
    meta: [
      { title: "Lista de Presentes — Nosso Casamento" },
      {
        name: "description",
        content:
          "Escolha um presente para os noivos e finalize com Pix, cartão de crédito ou débito.",
      },
      { property: "og:title", content: "Lista de Presentes — Nosso Casamento" },
      {
        property: "og:description",
        content: "Escolha um presente e pague com Pix, crédito ou débito.",
      },
    ],
  }),
  component: GiftsPage,
});

function GiftsPage() {
  const { data: gifts, isLoading, error } = useQuery(publicGiftsQuery);
  const { add, count } = useCart();

  return (
    <PageShell
      showCart
      eyebrow="Com carinho"
      title="Lista de Presentes"
      intro="Sua presença já é o maior presente. Se quiser nos mimar, escolha algo desta lista — o pagamento é feito com segurança por Pix, crédito ou débito."
    >
      {error ? (
        <p className="text-center text-sm text-destructive">
          Não foi possível carregar a lista agora. Tente recarregar a página.
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-72 animate-pulse rounded-xl bg-secondary sm:h-96" />
          ))}
        </div>
      ) : null}

      {!isLoading && gifts && gifts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          A lista de presentes ainda está sendo preparada. Volte em breve!
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {gifts?.map((gift) => {
          const soldOut = gift.quantity > 0 && gift.purchased_count >= gift.quantity;
          return (
            <article
              key={gift.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <div className="aspect-square w-full overflow-hidden bg-secondary/60 p-2 sm:p-4">
                {gift.image_url ? (
                  <img
                    src={gift.image_url}
                    alt={gift.title}
                    loading="lazy"
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-display text-3xl text-muted-foreground">
                    ✦
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3 sm:p-5">
                <h2 className="font-display text-lg leading-tight sm:text-2xl">{gift.title}</h2>
                {gift.description ? (
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {gift.description}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}
                <p className="mt-3 font-display text-lg text-primary sm:mt-4 sm:text-xl">
                  {formatBRL(gift.price_cents)}
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:mt-4">
                  <Button
                    variant="gold"
                    className="h-auto min-h-10 whitespace-normal px-2 py-2 text-xs leading-tight sm:px-4 sm:text-sm"
                    disabled={soldOut}
                    onClick={() => {
                      add({
                        giftId: gift.id,
                        title: gift.title,
                        priceCents: gift.price_cents,
                        imageUrl: gift.image_url,
                      });
                      toast.success(`${gift.title} adicionado ao carrinho`);
                    }}
                  >
                    {soldOut ? "Já presenteado" : "Adicionar ao carrinho"}
                  </Button>
                  <Button
                    variant="quiet"
                    className="h-auto min-h-10 whitespace-normal px-2 py-2 text-xs leading-tight sm:px-4 sm:text-sm"
                    asChild
                    disabled={soldOut}
                  >
                    <Link
                      to="/carrinho"
                      onClick={() => {
                        if (soldOut) return;
                        add({
                          giftId: gift.id,
                          title: gift.title,
                          priceCents: gift.price_cents,
                          imageUrl: gift.image_url,
                        });
                      }}
                    >
                      Comprar agora
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {count > 0 ? (
        <div className="sticky bottom-4 mt-10 flex justify-center">
          <Button variant="elegant" size="lg" asChild>
            <Link to="/carrinho">Ver carrinho ({count})</Link>
          </Button>
        </div>
      ) : null}
    </PageShell>
  );
}
