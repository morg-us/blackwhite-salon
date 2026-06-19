import { pgTable, serial, text, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Users ──────────────────────────────────────────────────
export const usersTable = pgTable("salon_users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#b84d5b"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export type SalonUser = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// ── Appointments ───────────────────────────────────────────
export const appointmentsTable = pgTable("salon_appointments", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  category: text("category").notNull(),
  staff: text("staff").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true });
export type Appointment = typeof appointmentsTable.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// ── Reviews ────────────────────────────────────────────────
export const reviewsTable = pgTable("salon_reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#b84d5b"),
  rating: integer("rating").notNull().default(5),
  text: text("text").notNull(),
  staffMember: text("staff_member").notNull().default("Genel"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type Review = typeof reviewsTable.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// ── Products ───────────────────────────────────────────────
export const productsTable = pgTable("salon_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull().default(""),
  category: text("category").notNull().default(""),
  badge: text("badge"),
  stock: integer("stock").notNull().default(100),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// ── Orders ─────────────────────────────────────────────────
export const ordersTable = pgTable("salon_orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// ── Order Items ────────────────────────────────────────────
export const orderItemsTable = pgTable("salon_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id"),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type OrderItem = typeof orderItemsTable.$inferSelect;

// ── Chat sessions ──────────────────────────────────────────
export const chatSessionsTable = pgTable("salon_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  sessionToken: text("session_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessagesTable = pgTable("salon_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatSessionsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
