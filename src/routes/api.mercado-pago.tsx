import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mercado-pago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as {
          type?: string;
          data?: { id?: string | number };
        } | null;
        const paymentId = body?.data?.id;
        if (!paymentId || (body?.type && body.type !== "payment")) {
          return new Response("Ignored", { status: 200 });
        }

        try {
          const { confirmMercadoPagoPayment } = await import("@/lib/mercado-pago.server");
          await confirmMercadoPagoPayment(String(paymentId));
        } catch (error) {
          console.error("[Mercado Pago] Falha ao processar notificação", error);
          return new Response("Payment verification failed", { status: 502 });
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});
