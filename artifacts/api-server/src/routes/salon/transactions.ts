import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function mapRow(row: typeof transactionsTable.$inferSelect) {
  return {
    id: row.id,
    date: row.createdAt.toISOString(),
    type: row.type,
    category: row.category,
    description: row.description,
    amount: parseFloat(row.amount as string),
    paymentMethod: row.paymentMethod,
  };
}

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(transactionsTable).orderBy(transactionsTable.createdAt);
    res.json(all.map(mapRow));
  } catch {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, type, category, description, amount, paymentMethod } = req.body;
    const [created] = await db.insert(transactionsTable).values({
      id,
      type,
      category,
      description: description ?? "",
      amount: String(amount),
      paymentMethod,
    }).returning();
    res.status(201).json(mapRow(created));
  } catch {
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(transactionsTable).where(eq(transactionsTable.id, req.params.id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
