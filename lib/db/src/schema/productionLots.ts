import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productionLotsTable = pgTable("production_lots", {
  id: serial("id").primaryKey(),
  lotCode: text("lot_code").notNull().unique(),
  productId: integer("product_id").notNull(),
  orderId: integer("order_id"),
  rawMaterialId: integer("raw_material_id"),
  quantityProduced: real("quantity_produced").notNull(),
  unit: text("unit").notNull(),
  status: text("status").notNull().default("pending").$type<"pending" | "in_production" | "finished" | "quality_approved" | "quality_rejected">(),
  qualityStatus: text("quality_status").notNull().default("pending").$type<"pending" | "approved" | "rejected">(),
  brixLevel: real("brix_level"),
  temperature: real("temperature"),
  qualityNotes: text("quality_notes"),
  producedAt: timestamp("produced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductionLotSchema = createInsertSchema(productionLotsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProductionLot = z.infer<typeof insertProductionLotSchema>;
export type ProductionLot = typeof productionLotsTable.$inferSelect;
