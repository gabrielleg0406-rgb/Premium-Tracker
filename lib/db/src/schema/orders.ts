import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: real("quantity").notNull(),
  totalPrice: real("total_price").notNull(),
  paymentType: text("payment_type").notNull().$type<"cash" | "card" | "pix" | "promissory">(),
  paymentStatus: text("payment_status").notNull().default("pending").$type<"pending" | "paid" | "partial">(),
  amountPaid: real("amount_paid").notNull().default(0),
  fulfillmentSource: text("fulfillment_source").notNull().default("stock").$type<"stock" | "production">(),
  status: text("status").notNull().default("pending").$type<"pending" | "in_production" | "ready" | "delivered" | "cancelled">(),
  deliveryType: text("delivery_type").notNull().$type<"delivery" | "pickup">(),
  deliveryAddress: text("delivery_address"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  notes: text("notes"),
  responsible: text("responsible"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
