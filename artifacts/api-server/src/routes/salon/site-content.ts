import { Router } from "express";
import type { Response, Request } from "express";
import { db } from "@workspace/db";
import { siteContentTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const sseClients = new Set<Response>();

function broadcastContent(contentJson: string) {
  const msg = `data: ${contentJson}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch {
      sseClients.delete(client);
    }
  }
}

router.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(": heartbeat\n\n");

  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
  }, 25000);

  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
    clearInterval(heartbeat);
  });
});

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(siteContentTable).limit(1);
    if (rows.length === 0) return res.json(null);
    res.json(JSON.parse(rows[0].content));
  } catch {
    res.status(500).json({ error: "Failed to fetch site content" });
  }
});

router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) return res.status(400).json({ ok: false });

    const rows = await db.select().from(siteContentTable).limit(1);
    if (rows.length === 0) {
      // DB henüz boş — varsayılan kimlik bilgilerini kullan
      const ok = username === "admin" && password === "admin123";
      return res.json({ ok });
    }

    const content = JSON.parse(rows[0].content) as Record<string, unknown>;
    const creds = content.adminCredentials as { username: string; password: string } | undefined;

    if (!creds) {
      // DB kaydı var ama adminCredentials alanı yok — varsayılan
      const ok = username === "admin" && password === "admin123";
      return res.json({ ok });
    }

    const ok = username === creds.username && password === creds.password;
    res.json({ ok });
  } catch {
    res.status(500).json({ ok: false });
  }
});

router.patch("/admin-credentials", async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) return res.status(400).json({ error: "username and password required" });

    const rows = await db.select().from(siteContentTable).limit(1);
    if (rows.length === 0) return res.status(404).json({ error: "No site content" });

    const content = JSON.parse(rows[0].content) as Record<string, unknown>;
    content.adminCredentials = { username, password };
    const json = JSON.stringify(content);

    const [updated] = await db
      .update(siteContentTable)
      .set({ content: json, updatedAt: new Date() })
      .where(eq(siteContentTable.id, rows[0].id))
      .returning();
    broadcastContent(updated.content);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update admin credentials" });
  }
});

router.put("/", async (req, res) => {
  try {
    const content = JSON.stringify(req.body);
    const rows = await db.select().from(siteContentTable).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(siteContentTable).values({ content }).returning();
      const json = created.content;
      broadcastContent(json);
      return res.json(JSON.parse(json));
    }
    const [updated] = await db
      .update(siteContentTable)
      .set({ content, updatedAt: new Date() })
      .where(eq(siteContentTable.id, rows[0].id))
      .returning();
    const json = updated.content;
    broadcastContent(json);
    res.json(JSON.parse(json));
  } catch {
    res.status(500).json({ error: "Failed to update site content" });
  }
});

export default router;
