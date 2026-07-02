import { db } from "@workspace/db";
import { smsNotificationsTable } from "@workspace/db";
import { sendWhatsAppMessage, getWhatsAppStatus } from "../lib/whatsapp";

export async function sendWhatsApp(params: {
  to: string;
  recipientName: string;
  message: string;
  appointmentId?: number;
}): Promise<void> {
  const waStatus = getWhatsAppStatus();

  let status: string;
  if (waStatus === "ready") {
    const ok = await sendWhatsAppMessage(params.to, params.message);
    status = ok ? "sent" : "failed:send_error";
  } else {
    status = "simulated";
  }

  await db.insert(smsNotificationsTable).values({
    to: params.to,
    recipientName: params.recipientName,
    message: params.message,
    type: "whatsapp",
    appointmentId: params.appointmentId ?? null,
    status,
  });
}
