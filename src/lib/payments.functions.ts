import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyMercadoPagoPayment = createServerFn({ method: "POST" })
  .validator((paymentId: unknown) => z.string().regex(/^\d+$/).parse(paymentId))
  .handler(async ({ data: paymentId }) => {
    const { confirmMercadoPagoPayment } = await import("./mercado-pago.server");
    return { status: await confirmMercadoPagoPayment(paymentId) };
  });
