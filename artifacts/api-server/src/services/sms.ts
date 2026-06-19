import { db } from "@workspace/db";
import { smsNotificationsTable } from "@workspace/db";

export async function sendSms(params: {
  to: string;
  recipientName: string;
  message: string;
  type?: string;
  appointmentId?: number;
}): Promise<void> {
  const status = await trySendNetgsm(params.to, params.message);

  await db.insert(smsNotificationsTable).values({
    to: params.to,
    recipientName: params.recipientName,
    message: params.message,
    type: params.type ?? "appointment",
    appointmentId: params.appointmentId ?? null,
    status,
  });
}

async function trySendNetgsm(to: string, message: string): Promise<string> {
  const user = process.env.NETGSM_USERNAME;
  const pass = process.env.NETGSM_PASSWORD;
  const header = process.env.NETGSM_HEADER ?? "BLACK WHITE";

  if (!user || !pass) return "simulated";

  const phone = to.replace(/[\s+\-()]/g, "");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dil="TR">Netgsm</company>
    <usercode>${user}</usercode>
    <password>${pass}</password>
    <type>1:n</type>
    <msgheader>${header}</msgheader>
  </header>
  <body>
    <msg><![CDATA[${message}]]></msg>
    <no>${phone}</no>
  </body>
</mainbody>`;

  try {
    const resp = await fetch("https://api.netgsm.com.tr/sms/send/xml", {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });
    const text = await resp.text();
    return text.startsWith("00") ? "sent" : `failed:${text.slice(0, 20)}`;
  } catch {
    return "failed:network";
  }
}
