import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, insertAppointmentSchema, staffUsersTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { sendSms } from "../../services/sms";
import { sendWhatsApp } from "../../services/whatsapp";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(appointmentsTable).orderBy(appointmentsTable.createdAt);
    res.json(all);
  } catch {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const parsed = insertAppointmentSchema.safeParse({ ...req.body, userId: userId ?? null });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const [created] = await db.insert(appointmentsTable).values(parsed.data).returning();

    notifyStaff(created).catch(() => {});

    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

async function notifyStaff(appt: typeof appointmentsTable.$inferSelect) {
  const staffList = await db.select().from(staffUsersTable);

  const isFarketmez =
    !appt.staff ||
    appt.staff === "Farketmez" ||
    appt.staff.trim() === "";

  const targets = isFarketmez
    ? staffList.filter(s => s.phone)
    : staffList.filter(
        s =>
          s.phone &&
          (s.name === appt.staff ||
            appt.staff.toLowerCase().includes(s.name.split(" ")[0].toLowerCase()))
      );

  if (targets.length === 0) return;

  const buildMsg = (staffName: string) =>
    `Yeni randevu!\n` +
    `Personel: ${staffName}\n` +
    `Müşteri: ${appt.name}\n` +
    `Tarih: ${appt.date} ${appt.time}\n` +
    `Hizmet: ${appt.category}\n` +
    `Tel: ${appt.phone}`;

  await Promise.all(
    targets.map(async staffUser => {
      const msg = buildMsg(staffUser.name);
      await sendSms({
        to: staffUser.phone,
        recipientName: staffUser.name,
        message: msg,
        type: "appointment",
        appointmentId: appt.id,
      });
      await sendWhatsApp({
        to: staffUser.phone,
        recipientName: staffUser.name,
        message: msg,
        appointmentId: appt.id,
      });
    })
  );
}

router.get("/my", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const appts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.userId, userId));
    res.json(appts);
  } catch {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status: string };
    if (!["pending", "came", "no_show"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const [updated] = await db
      .update(appointmentsTable)
      .set({ status })
      .where(eq(appointmentsTable.id, id))
      .returning();
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update appointment status" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete appointment" });
  }
});

export default router;
