import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, insertReviewSchema } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(reviewsTable).orderBy(reviewsTable.createdAt);
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const parsed = insertReviewSchema.safeParse({ ...req.body, userId });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const [created] = await db.insert(reviewsTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: "Failed to create review" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id);
    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
    if (!review) return res.status(404).json({ error: "Not found" });
    if (review.userId !== userId) return res.status(403).json({ error: "Forbidden" });
    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
