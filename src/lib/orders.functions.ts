import { createServerFn } from "@tanstack/react-start";
import { orderInputSchema } from "./orders.schema";

export const createOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => orderInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { createOrderRecord } = await import("./orders.server");
    return createOrderRecord(data);
  });
