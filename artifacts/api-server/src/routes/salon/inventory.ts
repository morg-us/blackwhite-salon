import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryTable, stockMovementsTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

function mapRow(row: typeof inventoryTable.$inferSelect) {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    category: row.category,
    unit: row.unit,
    costPrice: parseFloat(row.costPrice as string),
    salePrice: parseFloat(row.salePrice as string),
    stock: row.stock,
    minStock: row.minStock,
    note: row.note,
  };
}

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(inventoryTable).orderBy(inventoryTable.createdAt);
    res.json(all.map(mapRow));
  } catch {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, barcode, name, category, unit, costPrice, salePrice, stock, minStock, note } = req.body;
    const [created] = await db.insert(inventoryTable).values({
      id,
      barcode: barcode ?? "",
      name,
      category: category ?? "",
      unit: unit ?? "adet",
      costPrice: String(costPrice ?? 0),
      salePrice: String(salePrice ?? 0),
      stock: stock ?? 0,
      minStock: minStock ?? 0,
      note: note ?? "",
    }).returning();
    res.status(201).json(mapRow(created));
  } catch {
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { barcode, name, category, unit, costPrice, salePrice, stock, minStock, note } = req.body;
    const [updated] = await db.update(inventoryTable).set({
      ...(barcode !== undefined && { barcode }),
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(unit !== undefined && { unit }),
      ...(costPrice !== undefined && { costPrice: String(costPrice) }),
      ...(salePrice !== undefined && { salePrice: String(salePrice) }),
      ...(stock !== undefined && { stock }),
      ...(minStock !== undefined && { minStock }),
      ...(note !== undefined && { note }),
    }).where(eq(inventoryTable.id, req.params.id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(mapRow(updated));
  } catch {
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(inventoryTable).where(eq(inventoryTable.id, req.params.id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
});

// Mağaza siparişinde stok düş + hareket + gelir kaydı oluştur
router.post("/sale-deduct", async (req, res) => {
  type SaleItem = { inventoryProductId: string; productName: string; quantity: number; unitPrice: number };
  const items = req.body.items as SaleItem[];
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items required" });
  }

  try {
    const results: Record<string, unknown>[] = [];

    for (const item of items) {
      const rows = await db.select().from(inventoryTable).where(eq(inventoryTable.id, item.inventoryProductId));
      if (rows.length === 0) continue;

      const current = rows[0];
      const newStock = Math.max(0, current.stock - item.quantity);

      await db.update(inventoryTable)
        .set({ stock: newStock })
        .where(eq(inventoryTable.id, item.inventoryProductId));

      const movementId = randomUUID();
      await db.insert(stockMovementsTable).values({
        id: movementId,
        productId: item.inventoryProductId,
        productName: current.name,
        barcode: current.barcode,
        type: "cikis",
        quantity: item.quantity,
        reason: "Mağaza satışı",
        note: "",
        stockAfter: newStock,
      });

      const txId = randomUUID();
      await db.insert(transactionsTable).values({
        id: txId,
        type: "gelir",
        category: "Ürün Satışı",
        description: `${current.name} x${item.quantity}`,
        amount: String(item.unitPrice * item.quantity),
        paymentMethod: "nakit",
      });

      results.push({ id: item.inventoryProductId, newStock });
    }

    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: "Failed to process sale" });
  }
});

export default router;
