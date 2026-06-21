import { Router } from "express";
import { db } from "@workspace/db";
import { siteUsersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";

const router = Router();

function mapRow(row: typeof siteUsersTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    avatarColor: row.avatarColor,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(siteUsersTable).orderBy(siteUsersTable.createdAt);
    res.json(all.map(mapRow));
  } catch {
    res.status(500).json({ error: "Failed to fetch site users" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { id, name, email, password, avatarColor } = req.body;
    const existing = await db.select().from(siteUsersTable).where(eq(siteUsersTable.email, email));
    if (existing.length > 0) return res.status(409).json({ error: "Email already exists" });
    const [created] = await db.insert(siteUsersTable).values({
      id,
      name,
      email,
      password,
      avatarColor: avatarColor ?? "#b84d5b",
    }).returning();
    res.status(201).json(mapRow(created));
  } catch {
    res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(siteUsersTable).where(eq(siteUsersTable.email, email));
    if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
    res.json(mapRow(user));
  } catch {
    res.status(500).json({ error: "Failed to login" });
  }
});

router.post("/clerk-sync", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email.split("@")[0] || "Kullanıcı";

    const existing = await db.select().from(siteUsersTable).where(
      or(eq(siteUsersTable.id, userId), eq(siteUsersTable.email, email))
    );

    if (existing.length > 0) {
      const user = existing[0];
      if (user.id !== userId || user.name !== name) {
        const [updated] = await db.update(siteUsersTable)
          .set({ id: userId, name, email })
          .where(eq(siteUsersTable.id, user.id))
          .returning();
        return res.json(mapRow(updated));
      }
      return res.json(mapRow(user));
    }

    const COLORS = ["#b84d5b", "#bd8c74", "#8b7355", "#c9a96e", "#d4b896", "#e8a5b2"];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const [created] = await db.insert(siteUsersTable).values({
      id: userId,
      name,
      email,
      password: "__clerk_oauth__",
      avatarColor: color,
    }).returning();
    return res.status(201).json(mapRow(created));
  } catch (e) {
    req.log?.error(e);
    return res.status(500).json({ error: "Failed to sync clerk user" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, avatarColor } = req.body;
    if (email) {
      const existing = await db.select().from(siteUsersTable).where(eq(siteUsersTable.email, email));
      if (existing.length > 0 && existing[0].id !== req.params.id) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }
    const [updated] = await db.update(siteUsersTable).set({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(password !== undefined && { password }),
      ...(avatarColor !== undefined && { avatarColor }),
    }).where(eq(siteUsersTable.id, req.params.id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(mapRow(updated));
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
