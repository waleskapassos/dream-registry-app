type PaymentStatus = "approved" | "pending" | "failure";

type MercadoPagoPayment = {
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  payment_type_id?: string;
};

function getProductionAccessToken() {
  const accessToken = process.env["MERCADO_PAGO_ACCESS_TOKEN"];
  if (!accessToken || accessToken.startsWith("TEST-")) {
    throw new Error("Mercado Pago não está configurado para produção.");
  }
  return accessToken;
}

export async function confirmMercadoPagoPayment(paymentId: string): Promise<PaymentStatus> {
  const accessToken = getProductionAccessToken();
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    console.error("[Mercado Pago] Falha ao consultar pagamento", response.status);
    throw new Error("Não foi possível confirmar o pagamento no Mercado Pago.");
  }

  const payment = (await response.json()) as MercadoPagoPayment;
  const orderId = payment.external_reference;
  if (!orderId) throw new Error("Pagamento sem referência ao pedido.");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, total_cents, payment_method, status")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) throw new Error("Pedido do pagamento não encontrado.");

  const paidAmountCents = Math.round((payment.transaction_amount ?? 0) * 100);
  const expectedPaymentType = order.payment_method === "credit" ? "credit_card" : "debit_card";
  const paymentMatchesOrder =
    paidAmountCents === order.total_cents && payment.payment_type_id === expectedPaymentType;

  if (payment.status === "approved") {
    if (!paymentMatchesOrder) {
      console.error("[Mercado Pago] Pagamento aprovado não corresponde ao pedido", order.id);
      throw new Error("Os dados do pagamento não correspondem ao pedido.");
    }

    // Pedidos removidos pelo painel permanecem arquivados para auditoria e não devem
    // voltar a consumir o estoque quando o Mercado Pago repetir uma notificação.
    if (order.status === "deleted") return "approved";

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", order.id);
    if (updateError) throw new Error("Não foi possível confirmar o pedido.");
    return "approved";
  }

  if (["rejected", "cancelled", "refunded", "charged_back"].includes(payment.status ?? "")) {
    return "failure";
  }

  return "pending";
}
