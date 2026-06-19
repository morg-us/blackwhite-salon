import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, insertUserSchema } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";

const router = Router();

// Sync Clerk user to DB after login/signup
router.post("/sync", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { email, name, avatarColor } = req.body;
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (existing.length > 0) {
      const [updated] = await db.update(usersTable)
        .set({ email, name, avatarColor: avatarColor ?? existing[0].avatarColor })
        .where(eq(usersTable.id, userId))
        .returning();
      return res.json(updated);
    }
    const parsed = insertUserSchema.safeParse({ id: userId, email, name, avatarColor: avatarColor ?? "#b84d5b" });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const [created] = await db.insert(usersTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: "Failed to sync user" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Admin: list all users
router.get("/all", async (req, res) => {
  try {
    const all = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
