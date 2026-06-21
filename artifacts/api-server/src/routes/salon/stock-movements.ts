import { Router } from "express";
import { db } from "@workspace/db";
import { stockMovementsTable, inventoryTable, transactionsTable } from "@workspace/db";
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

// Determine which financial transaction (if any) to create for a stock movement.
// Returns null for "duzeltme" or zero-amount movements.
async function createFinancialTransaction(
  movementId: string,
  type: string,
  reason: string,
  quantity: number,
  productName: string,
  productId: string,
  note: string
) {
  const [product] = await db.select().from(inventoryTable).where(eq(inventoryTable.id, productId));
  if (!product) return;

  const costPrice = parseFloat(product.costPrice as string) || 0;
  const salePrice = parseFloat(product.salePrice as string) || 0;

  let txnType: string | null = null;
  let txnCategory: string | null = null;
  let txnAmount = 0;

  if (type === "giris") {
    // Every stock entry = expense (purchase cost)
    txnAmount = quantity * costPrice;
    if (txnAmount > 0) {
      txnType = "gider";
      txnCategory = "Ürün Alımı";
    }
  } else if (type === "cikis") {
    if (reason === "Satış") {
      txnAmount = quantity * salePrice;
      if (txnAmount > 0) { txnType = "gelir"; txnCategory = "Stok Satışı"; }
    } else if (reason === "İade") {
      txnAmount = quantity * salePrice;
      if (txnAmount > 0) { txnType = "gelir"; txnCategory = "Stok İadesi"; }
    } else if (reason === "Hizmet Kullanımı") {
      txnAmount = quantity * costPrice;
      if (txnAmount > 0) { txnType = "gider"; txnCategory = "Hizmet Malzeme"; }
    } else if (reason === "Fire / Bozulma") {
      txnAmount = quantity * costPrice;
      if (txnAmount > 0) { txnType = "gider"; txnCategory = "Fire / Bozulma"; }
    } else {
      // Other exits (Sayım Düzeltme, Diğer) → cost expense
      txnAmount = quantity * costPrice;
      if (txnAmount > 0) { txnType = "gider"; txnCategory = "Stok Çıkışı"; }
    }
  }
  // duzeltme → no financial impact

  if (!txnType || !txnCategory || txnAmount <= 0) return;

  const description = note
    ? `${productName} × ${quantity} — ${note}`
    : `${productName} × ${quantity} (${reason})`;

  await db.insert(transactionsTable).values({
    id: `txn_stk_${movementId}`,
    type: txnType,
    category: txnCategory,
    description,
    amount: String(txnAmount.toFixed(2)),
    paymentMethod: "nakit",
  });
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

    // Update inventory stock level
    await db.update(inventoryTable)
      .set({ stock: stockAfter })
      .where(eq(inventoryTable.id, productId));

    // Auto-create matching financial transaction
    await createFinancialTransaction(id, type, reason ?? "", quantity, productName, productId, note ?? "");

    res.status(201).json(mapRow(created));
  } catch {
    res.status(500).json({ error: "Failed to create stock movement" });
  }
});

export default router;
