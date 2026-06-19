import { Router } from "express";
import { db } from "@workspace/db";
import { staffUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function mapRow(row: typeof staffUsersTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    staffMemberId: row.staffMemberId,
    username: row.username,
    pin: row.pin,
    role: row.role,
    phone: row.phone,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(staffUsersTable).orderBy(staffUsersTable.createdAt);
    res.json(all.map(mapRow));
  } catch {
    res.status(500).json({ error: "Failed to fetch staff users" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, name, staffMemberId, username, pin, role, phone } = req.body;
    const existing = await db.select().from(staffUsersTable).where(eq(staffUsersTable.username, username));
    if (existing.length > 0) return res.status(409).json({ error: "Username already exists" });
    const [created] = await db.insert(staffUsersTable).values({
      id,
      name,
      staffMemberId: staffMemberId ?? "",
      username,
      pin,
      role: role ?? "uzman",
      phone: phone ?? "",
    }).returning();
    res.status(201).json(mapRow(created));
  } catch {
    res.status(500).json({ error: "Failed to create staff user" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, staffMemberId, username, pin, role, phone } = req.body;
    const [updated] = await db.update(staffUsersTable).set({
      ...(name !== undefined && { name }),
      ...(staffMemberId !== undefined && { staffMemberId }),
      ...(username !== undefined && { username }),
      ...(pin !== undefined && { pin }),
      ...(role !== undefined && { role }),
      ...(phone !== undefined && { phone }),
    }).where(eq(staffUsersTable.id, req.params.id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(mapRow(updated));
  } catch {
    res.status(500).json({ error: "Failed to update staff user" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(staffUsersTable).where(eq(staffUsersTable.id, req.params.id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete staff user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) return res.status(400).json({ error: "Missing credentials" });
    const [user] = await db.select().from(staffUsersTable)
      .where(eq(staffUsersTable.username, username));
    if (!user || user.pin !== pin) return res.status(401).json({ error: "Invalid credentials" });
    res.json(mapRow(user));
  } catch {
    res.status(500).json({ error: "Failed to login" });
  }
});

export default router;
