import { db } from "@workspace/db";
import { smsNotificationsTable } from "@workspace/db";

export async function sendWhatsApp(params: {
  to: string;
  recipientName: string;
  message: string;
  appointmentId?: number;
}): Promise<void> {
  const status = await trySendWhatsApp(params.to, params.message);

  await db.insert(smsNotificationsTable).values({
    to: params.to,
    recipientName: params.recipientName,
    message: params.message,
    type: "whatsapp",
    appointmentId: params.appointmentId ?? null,
    status,
  });
}

async function trySendWhatsApp(to: string, message: string): Promise<string> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) return "simulated";

  const phone = to.replace(/[\s+\-()]/g, "");
  try {
    const resp = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message },
        }),
      }
    );
    const json = (await resp.json()) as { messages?: { id: string }[] };
    return json.messages?.[0]?.id
      ? "sent"
      : `failed:${JSON.stringify(json).slice(0, 40)}`;
  } catch {
    return "failed:network";
  }
}
