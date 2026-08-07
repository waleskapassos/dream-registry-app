import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Minus, Plus, Trash2 } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { CheckoutProgress } from "@/components/CheckoutProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { createOrder } from "@/lib/orders.functions";
import { buildPixPayload } from "@/lib/pix";
import { settingsQuery } from "@/lib/wedding";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Lista de Presentes" },
      {
        name: "description",
        content: "Revise os presentes escolhidos e finalize com Pix, crédito ou débito.",
      },
      { property: "og:title", content: "Carrinho — Lista de Presentes" },
      { property: "og:description", content: "Finalize seu presente com Pix, crédito ou débito." },
    ],
  }),
  component: CartPage,
});

type Method = "pix" | "credit" | "debit";

function CartPage() {
  const { items, totalCents, setQuantity, remove, clear } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const submitOrder = useServerFn(createOrder);

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [method, setMethod] = useState<Method>("pix");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    orderId: string;
    totalCents: number;
    method: Method;
    pixCode: string;
    qr: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (items.length === 0) return;
    setPending(true);
    try {
      const order = await submitOrder({
        data: {
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone,
          message: form.message,
          paymentMethod: method,
          items: items.map((item) => ({ giftId: item.giftId, quantity: item.quantity })),
        },
      });

      if (order.paymentUrl) {
        clear();
        window.location.assign(order.paymentUrl);
        return;
      }

      let pixCode = "";
      let qr = "";
      if (method === "pix" && settings?.pix_key) {
        pixCode = buildPixPayload({
          key: settings.pix_key,
          name: settings.pix_name || settings.couple_names,
          amountCents: order.totalCents,
          txid: order.orderId.replace(/-/g, "").slice(0, 25),
        });
        qr = await QRCode.toDataURL(pixCode, { margin: 1, width: 320 });
      }

      setResult({ ...order, method, pixCode, qr });
      clear();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Tente novamente.";
      toast.error(`Não foi possível registrar seu presente: ${detail}`);
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <PageShell
        eyebrow="Quase lá"
        title={result.method === "pix" ? "Pague com Pix" : "Presente registrado"}
        intro={`Pedido ${result.orderId.slice(0, 8).toUpperCase()} — ${formatBRL(result.totalCents)}`}
      >
        <div className="mx-auto max-w-md space-y-6 rounded-sm border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
          {result.method === "pix" && result.pixCode ? (
            <>
              {result.qr ? (
                <img
                  src={result.qr}
                  alt="QR Code do Pix para pagamento do presente"
                  className="mx-auto size-64 rounded-sm border border-border bg-white p-2"
                />
              ) : null}
              <p className="text-sm text-muted-foreground">
                Abra o app do seu banco, escolha Pix e escaneie o código — ou use o Pix copia e cola
                abaixo.
              </p>
              <p className="break-all rounded-sm bg-secondary p-3 text-left text-[11px] leading-relaxed text-muted-foreground">
                {result.pixCode}
              </p>
              <Button
                variant="gold"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(result.pixCode);
                  toast.success("Código Pix copiado");
                }}
              >
                <Copy className="size-4" />
                Copiar código Pix
              </Button>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Recebemos seu presente com muito carinho. Os noivos entrarão em contato para concluir
              o pagamento no cartão.
            </p>
          )}

          <Button variant="quiet" className="w-full" asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell
        eyebrow="Carrinho"
        title="Seu carrinho está vazio"
        intro="Escolha um presente na nossa lista."
      >
        <div className="text-center">
          <Button variant="elegant" asChild>
            <Link to="/presentes">Ver lista de presentes</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Carrinho" title="Finalizar Presente">
      <CheckoutProgress current={2} />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.giftId}
              className="flex gap-4 rounded-sm border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="size-20 shrink-0 overflow-hidden rounded-sm bg-secondary">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="size-full object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col">
                <p className="font-display text-lg">{item.title}</p>
                <p className="text-sm text-primary">{formatBRL(item.priceCents)}</p>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon"
                    onClick={() => setQuantity(item.giftId, item.quantity - 1)}
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon"
                    onClick={() => setQuantity(item.giftId, item.quantity + 1)}
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="quiet"
                    size="icon"
                    className="ml-auto"
                    onClick={() => remove(item.giftId)}
                    aria-label="Remover item"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-baseline justify-between border-b border-border pb-4">
            <span className="eyebrow">Total</span>
            <span className="font-display text-3xl text-primary">{formatBRL(totalCents)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              required
              maxLength={120}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input
              id="email"
              type="email"
              maxLength={200}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input
              id="phone"
              maxLength={40}
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cart-message">Recado (opcional)</Label>
            <Textarea
              id="cart-message"
              rows={3}
              maxLength={500}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Forma de pagamento</legend>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["pix", "Pix"],
                  ["credit", "Crédito"],
                  ["debit", "Débito"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={method === value ? "gold" : "quiet"}
                  onClick={() => setMethod(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </fieldset>

          <Button type="submit" variant="elegant" size="lg" className="w-full" disabled={pending}>
            {pending ? "Registrando…" : "Finalizar presente"}
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
