import { Router } from "express";
import QRCode from "qrcode";
import { writeFile, readFile } from "node:fs/promises";
import {
  getWhatsAppStatus,
  getWhatsAppQr,
  getWhatsAppPhone,
  logoutWhatsApp,
  initWhatsApp,
  getWhatsAppTemplate,
  setWhatsAppTemplate,
  DEFAULT_TEMPLATE,
  getCustomerTemplate,
  setCustomerTemplate,
  DEFAULT_CUSTOMER_TEMPLATE,
} from "../../lib/whatsapp";
import { logger } from "../../lib/logger";

const router = Router();
const WA_CONFIG_PATH = "./.whatsapp-config.json";

async function readConfig(): Promise<{ template: string; customerTemplate: string }> {
  try {
    const raw = await readFile(WA_CONFIG_PATH, "utf8");
    const cfg = JSON.parse(raw) as { template?: string; customerTemplate?: string };
    return {
      template: cfg.template ?? DEFAULT_TEMPLATE,
      customerTemplate: cfg.customerTemplate ?? DEFAULT_CUSTOMER_TEMPLATE,
    };
  } catch {
    return { template: DEFAULT_TEMPLATE, customerTemplate: DEFAULT_CUSTOMER_TEMPLATE };
  }
}

async function saveConfig(patch: Partial<{ template: string; customerTemplate: string }>) {
  const current = await readConfig();
  const merged = { ...current, ...patch };
  await writeFile(WA_CONFIG_PATH, JSON.stringify(merged), "utf8");
}

// ── Durum / QR / Çıkış ───────────────────────────────────────────────────────

router.get("/status", (_req, res) => {
  res.json({ status: getWhatsAppStatus(), phone: getWhatsAppPhone() });
});

router.get("/qr", async (_req, res) => {
  const qr = getWhatsAppQr();
  if (!qr) return res.status(404).json({ error: "QR kodu henüz hazır değil" });
  try {
    const dataUrl = await QRCode.toDataURL(qr, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    res.json({ qr: dataUrl });
  } catch (err) {
    logger.error({ err }, "QR görüntüsü oluşturulamadı");
    res.status(500).json({ error: "QR görüntüsü oluşturulamadı" });
  }
});

router.post("/logout", async (_req, res) => {
  try {
    await logoutWhatsApp();
    initWhatsApp().catch((err) => logger.error({ err }, "WhatsApp yeniden başlatılamadı"));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "WhatsApp logout hatası");
    res.status(500).json({ error: "Oturum kapatılamadı" });
  }
});

// ── Personel şablonu ──────────────────────────────────────────────────────────

router.get("/template", (_req, res) => {
  res.json({ template: getWhatsAppTemplate(), default: DEFAULT_TEMPLATE });
});

router.patch("/template", async (req, res) => {
  const { template } = req.body as { template?: string };
  if (!template || typeof template !== "string") {
    return res.status(400).json({ error: "template alanı gereklidir" });
  }
  setWhatsAppTemplate(template);
  try {
    await saveConfig({ template });
    logger.info("WhatsApp personel şablonu güncellendi");
    res.json({ ok: true, template });
  } catch (err) {
    logger.error({ err }, "WhatsApp personel şablonu kaydedilemedi");
    res.status(500).json({ error: "Şablon kaydedilemedi" });
  }
});

router.post("/template/reset", async (_req, res) => {
  setWhatsAppTemplate(DEFAULT_TEMPLATE);
  try {
    await saveConfig({ template: DEFAULT_TEMPLATE });
    res.json({ ok: true, template: DEFAULT_TEMPLATE });
  } catch (err) {
    logger.error({ err }, "WhatsApp personel şablonu sıfırlanamadı");
    res.status(500).json({ error: "Şablon sıfırlanamadı" });
  }
});

// ── Müşteri şablonu ───────────────────────────────────────────────────────────

router.get("/customer-template", (_req, res) => {
  res.json({ template: getCustomerTemplate(), default: DEFAULT_CUSTOMER_TEMPLATE });
});

router.patch("/customer-template", async (req, res) => {
  const { template } = req.body as { template?: string };
  if (!template || typeof template !== "string") {
    return res.status(400).json({ error: "template alanı gereklidir" });
  }
  setCustomerTemplate(template);
  try {
    await saveConfig({ customerTemplate: template });
    logger.info("WhatsApp müşteri şablonu güncellendi");
    res.json({ ok: true, template });
  } catch (err) {
    logger.error({ err }, "WhatsApp müşteri şablonu kaydedilemedi");
    res.status(500).json({ error: "Şablon kaydedilemedi" });
  }
});

router.post("/customer-template/reset", async (_req, res) => {
  setCustomerTemplate(DEFAULT_CUSTOMER_TEMPLATE);
  try {
    await saveConfig({ customerTemplate: DEFAULT_CUSTOMER_TEMPLATE });
    res.json({ ok: true, template: DEFAULT_CUSTOMER_TEMPLATE });
  } catch (err) {
    logger.error({ err }, "WhatsApp müşteri şablonu sıfırlanamadı");
    res.status(500).json({ error: "Şablon sıfırlanamadı" });
  }
});

export default router;
