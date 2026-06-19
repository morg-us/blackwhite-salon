import { Router } from "express";
import { db } from "@workspace/db";
import { stockMovementsTable, inventoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function mapRow(row: typeof stockMovementsTable.$inferSelect) {
  return {
    id: row.id,
    date: row.createdAt.toISOString(),
    productId: row.productId,
    productName: row.productName,
    barcode: row.barcode,
    type: row.type,
    quantity: row.quantity,
    reason: row.reason,
    note: row.note,
    stockAfter: row.stockAfter,
  };
}

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(stockMovementsTable).orderBy(stockMovementsTable.createdAt);
    res.json(all.map(mapRow));
  } catch {
    res.status(500).json({ error: "Failed to fetch stock movements" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, productId, productName, barcode, type, quantity, reason, note, stockAfter } = req.body;
    const [created] = await db.insert(stockMovementsTable).values({
      id,
      productId,
      productName,
      barcode: barcode ?? "",
      type,
      quantity,
      reason: reason ?? "",
      note: note ?? "",
      stockAfter,
    }).returning();
    // Update inventory stock
    if (type === "giris") {
      await db.update(inventoryTable)
        .set({ stock: stockAfter })
        .where(eq(inventoryTable.id, productId));
    } else if (type === "cikis" || type === "duzeltme") {
      await db.update(inventoryTable)
        .set({ stock: stockAfter })
        .where(eq(inventoryTable.id, productId));
    }
    res.status(201).json(mapRow(created));
  } catch {
    res.status(500).json({ error: "Failed to create stock movement" });
  }
});

export default router;
