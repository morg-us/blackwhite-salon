import { execSync } from "node:child_process";
import { Client, LocalAuth } from "whatsapp-web.js";
import { logger } from "./logger";

export type WhatsAppStatus =
  | "disconnected"
  | "qr_pending"
  | "authenticated"
  | "ready"
  | "auth_failure";

let client: Client | null = null;
let currentStatus: WhatsAppStatus = "disconnected";
let currentQr: string | null = null;

export const DEFAULT_TEMPLATE =
  `🚨 YENİ RANDEVU BİLDİRİMİ 🚨\n` +
  `👤 Müşteri: {musteri}\n` +
  `📅 Tarih: {tarih}\n` +
  `⏰ Saat: {saat}\n` +
  `✂️ Hizmet: {hizmet}\n` +
  `📞 Telefon: {telefon}`;

let notificationTemplate: string = DEFAULT_TEMPLATE;

export function getWhatsAppTemplate(): string {
  return notificationTemplate;
}

export function setWhatsAppTemplate(tpl: string): void {
  notificationTemplate = tpl;
}

export function renderTemplate(
  tpl: string,
  vars: { musteri: string; tarih: string; saat: string; hizmet: string; telefon: string }
): string {
  return tpl
    .replace(/\{musteri\}/g, vars.musteri)
    .replace(/\{tarih\}/g, vars.tarih)
    .replace(/\{saat\}/g, vars.saat)
    .replace(/\{hizmet\}/g, vars.hizmet)
    .replace(/\{telefon\}/g, vars.telefon);
}

const PUPPETEER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-accelerated-2d-canvas",
  "--no-first-run",
  "--no-zygote",
  "--disable-gpu",
];

function findChromium(): string | undefined {
  for (const candidate of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
    try {
      const p = execSync(`which ${candidate}`, { encoding: "utf8" }).trim();
      if (p) return p;
    } catch { /* not found */ }
  }
  return undefined;
}

export function getWhatsAppStatus(): WhatsAppStatus {
  return currentStatus;
}

export function getWhatsAppQr(): string | null {
  return currentQr;
}

export function getWhatsAppPhone(): string | null {
  try {
    return (client as any)?.info?.wid?.user ?? null;
  } catch {
    return null;
  }
}

export function getWhatsAppClient(): Client | null {
  return client;
}

export async function initWhatsApp(): Promise<Client> {
  if (client) return client;

  logger.info("WhatsApp istemcisi başlatılıyor...");

  const executablePath = findChromium();
  if (executablePath) {
    logger.info({ executablePath }, "Sistem Chromium kullanılıyor");
  } else {
    logger.warn("Sistem Chromium bulunamadı — puppeteer kendi Chrome'unu kullanacak");
  }

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
    puppeteer: {
      headless: true,
      args: PUPPETEER_ARGS,
      ...(executablePath ? { executablePath } : {}),
    },
  });

  client.on("qr", (qr: string) => {
    currentStatus = "qr_pending";
    currentQr = qr;
    logger.info("WhatsApp QR kodu hazır — admin panelinden tarayın");
  });

  client.on("authenticated", () => {
    currentStatus = "authenticated";
    currentQr = null;
    logger.info("WhatsApp kimlik doğrulaması başarılı");
  });

  client.on("auth_failure", (msg: string) => {
    currentStatus = "auth_failure";
    currentQr = null;
    logger.error({ msg }, "WhatsApp kimlik doğrulaması başarısız");
  });

  client.on("ready", () => {
    currentStatus = "ready";
    currentQr = null;
    const phone = getWhatsAppPhone();
    logger.info({ phone }, "WhatsApp istemcisi hazır");
  });

  client.on("disconnected", (reason: string) => {
    currentStatus = "disconnected";
    currentQr = null;
    client = null;
    logger.warn({ reason }, "WhatsApp bağlantısı kesildi");
  });

  await client.initialize();
  return client;
}

export async function logoutWhatsApp(): Promise<void> {
  if (!client) return;
  try { await client.logout(); } catch { /* ignore */ }
  try { await client.destroy(); } catch { /* ignore */ }
  client = null;
  currentStatus = "disconnected";
  currentQr = null;
  logger.info("WhatsApp oturumu kapatıldı");
}

export async function destroyWhatsApp(): Promise<void> {
  if (!client) return;
  try { await client.destroy(); } catch { /* ignore */ }
  client = null;
  currentStatus = "disconnected";
  currentQr = null;
  logger.info("WhatsApp istemcisi durduruldu");
}

function normalizeTurkishPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return `${digits}@c.us`;
  if (digits.startsWith("0") && digits.length === 11) return `90${digits.slice(1)}@c.us`;
  if (digits.length === 10) return `90${digits}@c.us`;
  return `${digits}@c.us`;
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  if (!client || currentStatus !== "ready") {
    logger.warn({ status: currentStatus }, "WhatsApp mesajı gönderilemedi — istemci hazır değil");
    return false;
  }

  const chatId = to.includes("@c.us") ? to : normalizeTurkishPhone(to);

  try {
    await client.sendMessage(chatId, message);
    logger.info({ to: chatId }, "WhatsApp mesajı gönderildi");
    return true;
  } catch (err) {
    logger.error({ err, to: chatId }, "WhatsApp mesajı gönderilemedi");
    return false;
  }
}
