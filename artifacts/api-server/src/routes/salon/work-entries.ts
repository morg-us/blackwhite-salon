import { Router } from "express";
import { db } from "@workspace/db";
import { workEntriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function mapRow(row: typeof workEntriesTable.$inferSelect) {
  return {
    id: row.id,
    staffUserId: row.staffUserId,
    staffName: row.staffName,
    checkIn: row.checkIn,
    checkOut: row.checkOut ?? undefined,
  };
}

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(workEntriesTable).orderBy(workEntriesTable.createdAt);
    res.json(all.map(mapRow));
  } catch {
    res.status(500).json({ error: "Failed to fetch work entries" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, staffUserId, staffName, checkIn } = req.body;
    const [created] = await db.insert(workEntriesTable).values({
      id,
      staffUserId,
      staffName,
      checkIn,
    }).returning();
    res.status(201).json(mapRow(created));
  } catch {
    res.status(500).json({ error: "Failed to create work entry" });
  }
});

router.put("/:id/checkout", async (req, res) => {
  try {
    const { checkOut } = req.body;
    const [updated] = await db.update(workEntriesTable)
      .set({ checkOut })
      .where(eq(workEntriesTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(mapRow(updated));
  } catch {
    res.status(500).json({ error: "Failed to close work entry" });
  }
});

export default router;
