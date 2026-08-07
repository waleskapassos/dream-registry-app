import type { OrderInput } from "./orders.schema";

const DEFAULT_APP_URL = "https://dream-registry-app.lovable.app";

type MercadoPagoPreference = {
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
};

async function createMercadoPagoPreference({
  input,
  orderId,
  lines,
}: {
  input: OrderInput;
  orderId: string;
  lines: Array<{ gift_id: string; title: string; unit_price_cents: number; quantity: number }>;
}) {
  const accessToken = process.env["MERCADO_PAGO_ACCESS_TOKEN"];
  if (!accessToken) {
    throw new Error("Mercado Pago ainda não foi configurado.");
  }

  const appUrl = (process.env["APP_URL"] || DEFAULT_APP_URL).replace(/\/$/, "");
  const excludedPaymentTypes = [
    { id: "ticket" },
    { id: "bank_transfer" },
    { id: input.paymentMethod === "credit" ? "debit_card" : "credit_card" },
  ];

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `wedding-order-${orderId}`,
    },
    body: JSON.stringify({
      items: lines.map((line) => ({
        id: line.gift_id,
        title: line.title,
        currency_id: "BRL",
        quantity: line.quantity,
        unit_price: line.unit_price_cents / 100,
      })),
      payer: input.guestEmail ? { name: input.guestName, email: input.guestEmail } : undefined,
      external_reference: orderId,
      back_urls: {
        success: `${appUrl}/pagamento?status=approved`,
        pending: `${appUrl}/pagamento?status=pending`,
        failure: `${appUrl}/pagamento?status=failure`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/mercado-pago`,
      payment_methods: {
        excluded_payment_types: excludedPaymentTypes,
        installments: input.paymentMethod === "credit" ? 12 : 1,
      },
      statement_descriptor: "LISTA PRESENTES",
    }),
  });

  const preference = (await response.json()) as MercadoPagoPreference;
  if (!response.ok) {
    console.error("[Mercado Pago] Falha ao criar preferência", response.status, preference.message);
    throw new Error("Não foi possível abrir o pagamento no Mercado Pago.");
  }

  const isTestToken = accessToken.startsWith("TEST-");
  const paymentUrl = isTestToken ? preference.sandbox_init_point : preference.init_point;
  if (!paymentUrl) throw new Error("O Mercado Pago não retornou o endereço de pagamento.");
  return paymentUrl;
}

export async function createOrderRecord(input: OrderInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const giftIds = input.items.map((item) => item.giftId);
  const { data: gifts, error: giftsError } = await supabaseAdmin
    .from("gifts")
    .select("id, title, price_cents, is_active, quantity, purchased_count")
    .in("id", giftIds);
  if (giftsError) throw new Error(giftsError.message);

  const available = (gifts ?? []).filter((gift) => gift.is_active);
  if (available.length === 0) throw new Error("Nenhum presente válido no carrinho.");

  const lines = input.items
    .map((item) => {
      const gift = available.find((entry) => entry.id === item.giftId);
      if (!gift) return null;
      if (gift.quantity > 0 && gift.purchased_count + item.quantity > gift.quantity) return null;
      return {
        gift_id: gift.id,
        title: gift.title,
        unit_price_cents: gift.price_cents,
        quantity: item.quantity,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  if (lines.length !== input.items.length) {
    throw new Error("Um dos presentes escolhidos já está indisponível. Atualize a lista.");
  }

  const totalCents = lines.reduce((sum, line) => sum + line.unit_price_cents * line.quantity, 0);

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      guest_name: input.guestName,
      guest_email: input.guestEmail || null,
      guest_phone: input.guestPhone || null,
      message: input.message || null,
      total_cents: totalCents,
      payment_method: input.paymentMethod,
      status: "pending",
    })
    .select("id, total_cents")
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? "Falha ao criar o pedido.");

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(lines.map((line) => ({ ...line, order_id: order.id })));
  if (itemsError) throw new Error(itemsError.message);

  let paymentUrl = "";
  if (input.paymentMethod === "credit" || input.paymentMethod === "debit") {
    paymentUrl = await createMercadoPagoPreference({ input, orderId: order.id, lines });
  }

  return { orderId: order.id, totalCents: order.total_cents, paymentUrl };
}
