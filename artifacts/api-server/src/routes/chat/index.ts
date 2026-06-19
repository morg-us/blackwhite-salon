import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const router = Router();

const SALON_SYSTEM_PROMPT = `Sen "Black White Güzellik Salonu & Kuaför" adlı lüks Türk güzellik salonunun yapay zeka asistanısın. 
Salon Ordu, Altınordu'da yer almaktadır.

Hizmetlerin:
- Saç: Kesim (250-450₺), Boyama (500-1200₺), Röfle, Balayage, Keratin
- Makyaj: Gelin (400-800₺+), Günlük, Davet  
- Tırnak: Manikür (200-400₺), Pedikür, Kalıcı Oje, Protez
- Ağda & Epilasyon, Cilt Bakımı

Uzmanlar: Gülcan Hanım (Kıdemli Kuaför), Buse Hanım (Makyaj & Gelin Uzmanı), Zeynep Hanım (Nail Art Uzmanı)

Çalışma saatleri: Pazartesi-Cumartesi 09:00-20:00, Pazar 10:00-18:00

İletişim: salonun web sitesinde "Randevu Al" butonu veya telefon.

Kurallar:
- Her zaman Türkçe cevap ver
- Kısa, samimi ve profesyonel ol
- Randevu için web sitesindeki formu yönlendir
- Telefon için: randevu sayfasına yönlendir
- Fiyatlar değişebilir, kesin fiyat için salonu ara de
- Asla uydurma bilgi verme`;

// Get or create chat session
router.post("/session", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const token = crypto.randomUUID();
    const [session] = await db.insert(chatSessionsTable)
      .values({ userId: userId ?? null, sessionToken: token })
      .returning();
    res.json({ sessionId: session.id, token });
  } catch (e) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get chat history
router.get("/session/:token/messages", async (req, res) => {
  try {
    const [session] = await db.select().from(chatSessionsTable)
      .where(eq(chatSessionsTable.sessionToken, req.params.token));
    if (!session) return res.status(404).json({ error: "Session not found" });
    const msgs = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, session.id));
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message — SSE streaming
router.post("/session/:token/send", async (req, res) => {
  try {
    const [session] = await db.select().from(chatSessionsTable)
      .where(eq(chatSessionsTable.sessionToken, req.params.token));
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Empty message" });

    // Save user message
    await db.insert(chatMessagesTable).values({
      sessionId: session.id,
      role: "user",
      content: message.trim(),
    });

    // Get history for context
    const history = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, session.id));

    const chatMessages = [
      { role: "system" as const, content: SALON_SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save assistant response
    await db.insert(chatMessagesTable).values({
      sessionId: session.id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: "AI yanıt veremedi" })}\n\n`);
    res.end();
  }
});

export default router;
