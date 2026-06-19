import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export default router;
