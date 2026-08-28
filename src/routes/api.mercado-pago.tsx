import { createFileRoute } from "@tanstack/react-router";

type MercadoPagoPayment = {
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
};

export const Route = createFileRoute("/api/mercado-pago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const accessToken = process.env["MERCADO_PAGO_ACCESS_TOKEN"];
        if (!accessToken) return new Response("Not configured", { status: 503 });
        if (accessToken.startsWith("TEST-")) {
          return new Response("Production credential required", { status: 503 });
        }

        const body = (await request.json().catch(() => null)) as {
          type?: string;
          data?: { id?: string | number };
        } | null;
        const paymentId = body?.data?.id;
        if (!paymentId || (body?.type && body.type !== "payment")) {
          return new Response("Ignored", { status: 200 });
        }

        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!paymentResponse.ok) return new Response("Payment lookup failed", { status: 502 });

        const payment = (await paymentResponse.json()) as MercadoPagoPayment;
        const orderId = payment.external_reference;
        if (!orderId) return new Response("Missing external reference", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id, total_cents")
          .eq("id", orderId)
          .maybeSingle();
        if (!order) return new Response("Order not found", { status: 404 });

        const paidAmountCents = Math.round((payment.transaction_amount ?? 0) * 100);
        if (payment.status === "approved" && paidAmountCents === order.total_cents) {
          const { error } = await supabaseAdmin
            .from("orders")
            .update({ status: "paid" })
            .eq("id", order.id);
          if (error) return new Response("Order update failed", { status: 500 });
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
