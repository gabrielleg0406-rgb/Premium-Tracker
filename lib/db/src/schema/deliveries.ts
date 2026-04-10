import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliverersTable = pgTable("deliverers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDelivererSchema = createInsertSchema(deliverersTable).omit({ id: true, createdAt: true });
export type InsertDeliverer = z.infer<typeof insertDelivererSchema>;
export type Deliverer = typeof deliverersTable.$inferSelect;

export const deliveriesTable = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  delivererId: integer("deliverer_id"),
  status: text("status").notNull().default("pending").$type<"pending" | "in_transit" | "delivered" | "failed">(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveriesTable.$inferSelect;

export const qualityAlertsTable = pgTable("quality_alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().$type<"temperature" | "brix" | "quality_rejected">(),
  message: text("message").notNull(),
  lotCode: text("lot_code").notNull(),
  severity: text("severity").notNull().$type<"low" | "medium" | "high">(),
  resolved: text("resolved").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQualityAlertSchema = createInsertSchema(qualityAlertsTable).omit({ id: true, createdAt: true });
export type InsertQualityAlert = z.infer<typeof insertQualityAlertSchema>;
export type QualityAlert = typeof qualityAlertsTable.$inferSelect;
