type RsvpNotification = {
  id: string;
  name: string;
  attending: boolean;
  guests: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

export async function sendRsvpEmail(rsvp: RsvpNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RSVP_NOTIFICATION_FROM;
  const recipients = process.env.RSVP_NOTIFICATION_EMAILS?.split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (!apiKey || !from || !recipients?.length) {
    console.warn("[RSVP] Avisos por e-mail não configurados.");
    return false;
  }

  const answer = rsvp.attending ? "Sim, vai comparecer" : "Não poderá comparecer";
  const safeName = escapeHtml(rsvp.name);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `rsvp-${rsvp.id}`,
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `Nova confirmação de presença: ${rsvp.name}`,
      html: `<p>Uma confirmação foi enviada pelo site do casamento.</p><p><strong>Convidado:</strong> ${safeName}<br><strong>Resposta:</strong> ${answer}<br><strong>Pessoas:</strong> ${rsvp.guests}</p>`,
      text: `Uma confirmação foi enviada pelo site do casamento.\nConvidado: ${rsvp.name}\nResposta: ${answer}\nPessoas: ${rsvp.guests}`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[RSVP] Falha ao enviar aviso por e-mail:", response.status, details);
    return false;
  }

  return true;
}
