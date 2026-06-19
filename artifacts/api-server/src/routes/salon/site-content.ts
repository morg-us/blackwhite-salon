import { Router } from "express";
import { db } from "@workspace/db";
import { siteContentTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(siteContentTable).limit(1);
    if (rows.length === 0) return res.json(null);
    res.json(JSON.parse(rows[0].content));
  } catch {
    res.status(500).json({ error: "Failed to fetch site content" });
  }
});

router.put("/", async (req, res) => {
  try {
    const content = JSON.stringify(req.body);
    const rows = await db.select().from(siteContentTable).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(siteContentTable).values({ content }).returning();
      return res.json(JSON.parse(created.content));
    }
    const [updated] = await db
      .update(siteContentTable)
      .set({ content, updatedAt: new Date() })
      .where(eq(siteContentTable.id, rows[0].id))
      .returning();
    res.json(JSON.parse(updated.content));
  } catch {
    res.status(500).json({ error: "Failed to update site content" });
  }
});

export default router;
