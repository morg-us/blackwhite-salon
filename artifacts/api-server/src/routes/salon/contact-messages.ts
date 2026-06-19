import { Router } from "express";
import { db } from "@workspace/db";
import { contactMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(contactMessagesTable).orderBy(contactMessagesTable.createdAt);
    res.json(all);
  } catch {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "Missing fields" });
    const [created] = await db.insert(contactMessagesTable).values({ name, email, message }).returning();
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: "Failed to save message" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(contactMessagesTable).where(eq(contactMessagesTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
