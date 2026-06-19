import { Router } from "express";
import { db } from "@workspace/db";
import { adisyonlarTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

    if (status === "kapali" && existing[0].status !== "kapali") {
      await db.insert(transactionsTable).values({
        id: `txn_close_${req.params.id}`,
        type: "gelir",
        category: "Adisyon",
        description: `Adisyon #${req.params.id} kapatıldı — ${updated.customerName}`,
        amount: String(updated.total),
        paymentMethod: updated.paymentMethod,
      });
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
