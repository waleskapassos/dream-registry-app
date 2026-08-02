import { z } from "zod";

export const orderInputSchema = z.object({
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
  guestPhone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  paymentMethod: z.enum(["pix", "credit", "debit"]),
  items: z
    .array(
      z.object({
        giftId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
