import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rawMaterialsTable = pgTable("raw_materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  supplier: text("supplier").notNull(),
  quantityKg: real("quantity_kg").notNull(),
  pricePerKg: real("price_per_kg").notNull(),
  origin: text("origin"),
  quality: text("quality").notNull().$type<"premium" | "standard" | "economy">(),
  brixLevel: real("brix_level"),
  notes: text("notes"),
  invoiceNumber: text("invoice_number"),
  responsible: text("responsible"),
  status: text("status").notNull().default("received").$type<"pending" | "received" | "rejected">(),
  entryDate: timestamp("entry_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRawMaterialSchema = createInsertSchema(rawMaterialsTable).omit({ id: true, createdAt: true, entryDate: true });
export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;
export type RawMaterial = typeof rawMaterialsTable.$inferSelect;
