import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const notificationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  attending: z.boolean(),
  guests: z.number().int().min(1).max(10),
});

export const sendRsvpNotification = createServerFn({ method: "POST" })
  .validator((data: unknown) => notificationSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendRsvpEmail } = await import("./rsvp-notification.server");
    try {
      return { sent: await sendRsvpEmail(data) };
    } catch (error) {
      console.error("[RSVP] Erro inesperado ao enviar aviso por e-mail:", error);
      return { sent: false };
    }
  });
