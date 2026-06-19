import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, insertAppointmentSchema } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(appointmentsTable).orderBy(appointmentsTable.createdAt);
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const parsed = insertAppointmentSchema.safeParse({ ...req.body, userId: userId ?? null });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const [created] = await db.insert(appointmentsTable).values(parsed.data).returning();
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

router.get("/my", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const appts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.userId, userId));
    res.json(appts);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete appointment" });
  }
});

export default router;
