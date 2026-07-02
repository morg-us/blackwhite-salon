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
} from "../../lib/whatsapp";
import { logger } from "../../lib/logger";

const router = Router();
const WA_CONFIG_PATH = "./.whatsapp-config.json";

async function saveConfig(template: string) {
  await writeFile(WA_CONFIG_PATH, JSON.stringify({ template }), "utf8");
}

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

router.get("/template", async (_req, res) => {
  res.json({ template: getWhatsAppTemplate(), default: DEFAULT_TEMPLATE });
});

router.patch("/template", async (req, res) => {
  const { template } = req.body as { template?: string };
  if (!template || typeof template !== "string") {
    return res.status(400).json({ error: "template alanı gereklidir" });
  }
  setWhatsAppTemplate(template);
  try {
    await saveConfig(template);
    logger.info("WhatsApp bildirim şablonu güncellendi");
    res.json({ ok: true, template });
  } catch (err) {
    logger.error({ err }, "WhatsApp şablonu kaydedilemedi");
    res.status(500).json({ error: "Şablon kaydedilemedi" });
  }
});

router.post("/template/reset", async (_req, res) => {
  setWhatsAppTemplate(DEFAULT_TEMPLATE);
  try {
    await saveConfig(DEFAULT_TEMPLATE);
    res.json({ ok: true, template: DEFAULT_TEMPLATE });
  } catch (err) {
    logger.error({ err }, "WhatsApp şablonu sıfırlanamadı");
    res.status(500).json({ error: "Şablon sıfırlanamadı" });
  }
});

export default router;
