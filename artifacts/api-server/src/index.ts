import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import app from "./app";
import { logger } from "./lib/logger";
import {
  initWhatsApp,
  setWhatsAppTemplate,
  setCustomerTemplate,
  DEFAULT_TEMPLATE,
  DEFAULT_CUSTOMER_TEMPLATE,
} from "./lib/whatsapp";
import { readFile } from "node:fs/promises";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

export const WA_CONFIG_PATH = "./.whatsapp-config.json";

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set — skipping Stripe init");
    return;
  }
  try {
    logger.info("Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    logger.info("Stripe schema ready");

    const stripeSync = await getStripeSync();
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    logger.info("Stripe webhook configured");

    stripeSync.syncBackfill()
      .then(() => logger.info("Stripe data synced"))
      .catch((err) => logger.error({ err }, "Stripe syncBackfill error"));
  } catch (err) {
    logger.error({ err }, "Failed to initialize Stripe — payments may not work");
  }
}

async function loadWhatsAppConfig() {
  try {
    const raw = await readFile(WA_CONFIG_PATH, "utf8");
    const cfg = JSON.parse(raw) as { template?: string; customerTemplate?: string };
    if (cfg.template) {
      setWhatsAppTemplate(cfg.template);
      logger.info("WhatsApp personel şablonu dosyadan yüklendi");
    }
    if (cfg.customerTemplate) {
      setCustomerTemplate(cfg.customerTemplate);
      logger.info("WhatsApp müşteri şablonu dosyadan yüklendi");
    }
  } catch {
    // Dosya yoksa varsayılan şablonlar kullanılır — normal durum
  }
}

await initStripe();
await loadWhatsAppConfig();

initWhatsApp().catch((err) => logger.error({ err }, "WhatsApp başlatılamadı"));

app.listen(port, (err) => {
  if (err) { logger.error({ err }, "Error listening on port"); process.exit(1); }
  logger.info({ port }, "Server listening");
});
