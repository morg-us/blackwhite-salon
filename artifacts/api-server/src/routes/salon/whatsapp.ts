import { Router } from "express";
import QRCode from "qrcode";
import {
  getWhatsAppStatus,
  getWhatsAppQr,
  getWhatsAppPhone,
  logoutWhatsApp,
  initWhatsApp,
} from "../../lib/whatsapp";
import { logger } from "../../lib/logger";

const router = Router();

router.get("/status", (_req, res) => {
  const status = getWhatsAppStatus();
  const phone = getWhatsAppPhone();
  res.json({ status, phone });
});

router.get("/qr", async (_req, res) => {
  const qr = getWhatsAppQr();
  if (!qr) {
    return res.status(404).json({ error: "QR kodu henüz hazır değil" });
  }
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
    initWhatsApp().catch((err) =>
      logger.error({ err }, "WhatsApp yeniden başlatılamadı")
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "WhatsApp logout hatası");
    res.status(500).json({ error: "Oturum kapatılamadı" });
  }
});

export default router;
