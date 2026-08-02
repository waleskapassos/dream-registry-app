import type { OrderInput } from "./orders.schema";

export async function createOrderRecord(input: OrderInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const giftIds = input.items.map((item) => item.giftId);
  const { data: gifts, error: giftsError } = await supabaseAdmin
    .from("gifts")
    .select("id, title, price_cents, is_active")
    .in("id", giftIds);
  if (giftsError) throw new Error(giftsError.message);

  const available = (gifts ?? []).filter((gift) => gift.is_active);
  if (available.length === 0) throw new Error("Nenhum presente válido no carrinho.");

  const lines = input.items
    .map((item) => {
      const gift = available.find((entry) => entry.id === item.giftId);
      if (!gift) return null;
      return {
        gift_id: gift.id,
        title: gift.title,
        unit_price_cents: gift.price_cents,
        quantity: item.quantity,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  if (lines.length === 0) throw new Error("Nenhum presente válido no carrinho.");

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

  return { orderId: order.id, totalCents: order.total_cents };
}
