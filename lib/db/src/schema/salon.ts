import { pgTable, serial, text, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Users (Clerk-synced) ────────────────────────────────────
export const usersTable = pgTable("salon_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#b84d5b"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertUserSchema = createInsertSchema(usersTable);
export type SalonUser = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// ── Site Users (custom customer auth) ──────────────────────
export const siteUsersTable = pgTable("salon_site_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatarColor: text("avatar_color").notNull().default("#b84d5b"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertSiteUserSchema = createInsertSchema(siteUsersTable).omit({ createdAt: true });
export type DbSiteUser = typeof siteUsersTable.$inferSelect;

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

// ── Store Products ─────────────────────────────────────────
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

// ── Chat ───────────────────────────────────────────────────
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

// ── Site Content (single-row config) ───────────────────────
export const siteContentTable = pgTable("salon_site_content", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Contact Messages ───────────────────────────────────────
export const contactMessagesTable = pgTable("salon_contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Adisyonlar (Bills) ─────────────────────────────────────
export const adisyonlarTable = pgTable("salon_adisyonlar", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  staff: text("staff").notNull(),
  items: text("items").notNull().default("[]"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: text("payment_method").notNull().default("nakit"),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("acik"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Transactions ───────────────────────────────────────────
export const transactionsTable = pgTable("salon_transactions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("nakit"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Inventory ──────────────────────────────────────────────
export const inventoryTable = pgTable("salon_inventory", {
  id: text("id").primaryKey(),
  barcode: text("barcode").notNull().default(""),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  unit: text("unit").notNull().default("adet"),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).notNull().default("0"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Stock Movements ────────────────────────────────────────
export const stockMovementsTable = pgTable("salon_stock_movements", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  barcode: text("barcode").notNull().default(""),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull().default(""),
  note: text("note").notNull().default(""),
  stockAfter: integer("stock_after").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Staff Users (panel access) ─────────────────────────────
export const staffUsersTable = pgTable("salon_staff_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  staffMemberId: text("staff_member_id").notNull().default(""),
  username: text("username").notNull().unique(),
  pin: text("pin").notNull(),
  role: text("role").notNull().default("uzman"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Work Entries (check-in/out) ────────────────────────────
export const workEntriesTable = pgTable("salon_work_entries", {
  id: text("id").primaryKey(),
  staffUserId: text("staff_user_id").notNull(),
  staffName: text("staff_name").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
