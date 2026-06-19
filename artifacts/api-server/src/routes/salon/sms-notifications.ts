import { Router } from "express";
import { db } from "@workspace/db";
import { smsNotificationsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(smsNotificationsTable)
      .orderBy(desc(smsNotificationsTable.createdAt))
      .limit(200);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch SMS notifications" });
  }
});

export default router;
