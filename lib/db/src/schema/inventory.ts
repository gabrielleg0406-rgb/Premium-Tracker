import { pgTable, text, serial, timestamp, real, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryItemsTable = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  lotCode: text("lot_code").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  status: text("status").notNull().default("available").$type<"available" | "reserved" | "depleted" | "discarded">(),
  expiryDate: date("expiry_date"),
  entryDate: timestamp("entry_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItemsTable).omit({ id: true, createdAt: true, entryDate: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;

export const inventoryMovementsTable = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().$type<"entry" | "exit_sale" | "exit_discard">(),
  productId: integer("product_id").notNull(),
  lotCode: text("lot_code").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  reason: text("reason"),
  orderId: integer("order_id"),
  inventoryItemId: integer("inventory_item_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovementsTable).omit({ id: true, createdAt: true });
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type InventoryMovement = typeof inventoryMovementsTable.$inferSelect;
