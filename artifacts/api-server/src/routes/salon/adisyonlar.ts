import { Router } from "express";
import { db } from "@workspace/db";
import { adisyonlarTable, transactionsTable, inventoryTable, stockMovementsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

function mapRow(row: typeof adisyonlarTable.$inferSelect) {
  return {
    id: row.id,
    date: row.createdAt.toISOString(),
    customerName: row.customerName,
    staff: row.staff,
    items: JSON.parse(row.items),
    subtotal: parseFloat(row.subtotal as string),
    discount: parseFloat(row.discount as string),
    total: parseFloat(row.total as string),
    paymentMethod: row.paymentMethod,
    note: row.note,
    status: row.status,
  };
}

// When an adisyon closes, decrease inventory for any "urun" items and track COGS.
async function processStockOnClose(adisyonId: string, items: Array<{ id: string; type: string; name: string; quantity: number; unitPrice: number; total: number }>, paymentMethod: string) {
  const urunItems = items.filter(i => i.type === "urun");
  if (!urunItems.length) return;

  for (const item of urunItems) {
    // Find matching inventory product by name (case-insensitive)
    const products = await db
      .select()
      .from(inventoryTable)
      .where(sql`lower(${inventoryTable.name}) = lower(${item.name})`)
      .limit(1);

    if (!products.length) continue;
    const product = products[0];

    const newStock = Math.max(0, product.stock - item.quantity);

    // 1. Update inventory
    await db.update(inventoryTable)
      .set({ stock: newStock })
      .where(eq(inventoryTable.id, product.id));

    // 2. Record stock movement
    const movementId = `stk_adisyon_${adisyonId}_${item.id}`;
    await db.insert(stockMovementsTable).values({
      id: movementId,
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      type: "cikis",
      quantity: item.quantity,
      reason: "Hizmet Kullanımı",
      note: `Adisyon #${adisyonId}`,
      stockAfter: newStock,
    }).onConflictDoNothing();

    // 3. Track cost of goods sold (COGS) as expense
    const costPrice = parseFloat(product.costPrice as string) || 0;
    const cogs = item.quantity * costPrice;
    if (cogs > 0) {
      await db.insert(transactionsTable).values({
        id: `txn_cogs_${adisyonId}_${item.id}`,
        type: "gider",
        category: "Hizmet Malzeme",
        description: `${item.name} × ${item.quantity} — Adisyon #${adisyonId}`,
        amount: String(cogs.toFixed(2)),
        paymentMethod,
      }).onConflictDoNothing();
    }
  }
}

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(adisyonlarTable).orderBy(adisyonlarTable.createdAt);
    res.json(all.map(mapRow));
  } catch {
    res.status(500).json({ error: "Failed to fetch adisyonlar" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, customerName, staff, items, subtotal, discount, total, paymentMethod, note, status } = req.body;
    const [created] = await db.insert(adisyonlarTable).values({
      id,
      customerName,
      staff,
      items: JSON.stringify(items),
      subtotal: String(subtotal),
      discount: String(discount),
      total: String(total),
      paymentMethod,
      note: note ?? "",
      status: status ?? "acik",
    }).returning();

    if (status === "kapali") {
      await db.insert(transactionsTable).values({
        id: `txn_${id}`,
        type: "gelir",
        category: "Adisyon",
        description: `Adisyon #${id} — ${customerName}`,
        amount: String(total),
        paymentMethod,
      });
      await processStockOnClose(id, items ?? [], paymentMethod);
    }

    res.status(201).json(mapRow(created));
  } catch {
    res.status(500).json({ error: "Failed to create adisyon" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { customerName, staff, items, subtotal, discount, total, paymentMethod, note, status } = req.body;
    const existing = await db.select().from(adisyonlarTable).where(eq(adisyonlarTable.id, req.params.id));
    if (!existing.length) return res.status(404).json({ error: "Not found" });

    const [updated] = await db.update(adisyonlarTable).set({
      ...(customerName !== undefined && { customerName }),
      ...(staff !== undefined && { staff }),
      ...(items !== undefined && { items: JSON.stringify(items) }),
      ...(subtotal !== undefined && { subtotal: String(subtotal) }),
      ...(discount !== undefined && { discount: String(discount) }),
      ...(total !== undefined && { total: String(total) }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(note !== undefined && { note }),
      ...(status !== undefined && { status }),
    }).where(eq(adisyonlarTable.id, req.params.id)).returning();

    // Only trigger on first close (not re-close)
    if (status === "kapali" && existing[0].status !== "kapali") {
      await db.insert(transactionsTable).values({
        id: `txn_close_${req.params.id}`,
        type: "gelir",
        category: "Adisyon",
        description: `Adisyon #${req.params.id} kapatıldı — ${updated.customerName}`,
        amount: String(updated.total),
        paymentMethod: updated.paymentMethod,
      });

      const parsedItems = items ?? JSON.parse(existing[0].items);
      await processStockOnClose(req.params.id, parsedItems, updated.paymentMethod);
    }

    res.json(mapRow(updated));
  } catch {
    res.status(500).json({ error: "Failed to update adisyon" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(adisyonlarTable).where(eq(adisyonlarTable.id, req.params.id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete adisyon" });
  }
});

export default router;
