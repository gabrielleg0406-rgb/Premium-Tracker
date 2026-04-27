import { Router } from "express";
import { db, inventoryItemsTable, inventoryMovementsTable, productsTable } from "@workspace/db";
import { eq, desc, sum, sql } from "drizzle-orm";
import { CreateInventoryEntryBody, CreateInventoryExitBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const items = await db
    .select({
      id: inventoryItemsTable.id,
      productId: inventoryItemsTable.productId,
      lotCode: inventoryItemsTable.lotCode,
      quantity: inventoryItemsTable.quantity,
      unit: inventoryItemsTable.unit,
      status: inventoryItemsTable.status,
      expiryDate: inventoryItemsTable.expiryDate,
      entryDate: inventoryItemsTable.entryDate,
      createdAt: inventoryItemsTable.createdAt,
      productName: productsTable.name,
    })
    .from(inventoryItemsTable)
    .leftJoin(productsTable, eq(inventoryItemsTable.productId, productsTable.id))
    .orderBy(desc(inventoryItemsTable.entryDate));

  res.json(items.map((i) => ({ ...i, productName: i.productName ?? "" })));
});

router.get("/summary", async (req, res) => {
  const rows = await db
    .select({
      productId: inventoryItemsTable.productId,
      productName: productsTable.name,
      unit: productsTable.unit,
      totalQuantity: sum(inventoryItemsTable.quantity).mapWith(Number),
    })
    .from(inventoryItemsTable)
    .leftJoin(productsTable, eq(inventoryItemsTable.productId, productsTable.id))
    .groupBy(inventoryItemsTable.productId, productsTable.name, productsTable.unit);

  const availableRows = await db
    .select({
      productId: inventoryItemsTable.productId,
      available: sum(inventoryItemsTable.quantity).mapWith(Number),
    })
    .from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.status, "available"))
    .groupBy(inventoryItemsTable.productId);

  const reservedRows = await db
    .select({
      productId: inventoryItemsTable.productId,
      reserved: sum(inventoryItemsTable.quantity).mapWith(Number),
    })
    .from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.status, "reserved"))
    .groupBy(inventoryItemsTable.productId);

  const availMap = new Map(availableRows.map((r) => [r.productId, r.available ?? 0]));
  const resMap = new Map(reservedRows.map((r) => [r.productId, r.reserved ?? 0]));

  res.json(
    rows.map((r) => ({
      productId: r.productId,
      productName: r.productName ?? "",
      unit: r.unit ?? "kg",
      totalQuantity: r.totalQuantity ?? 0,
      availableQuantity: availMap.get(r.productId) ?? 0,
      reservedQuantity: resMap.get(r.productId) ?? 0,
    }))
  );
});

router.post("/entries", async (req, res) => {
  const body = CreateInventoryEntryBody.parse(req.body);
  const [product] = await db.select({ unit: productsTable.unit }).from(productsTable).where(eq(productsTable.id, body.productId));
  const [item] = await db
    .insert(inventoryItemsTable)
    .values({
      productId: body.productId,
      lotCode: body.lotCode,
      quantity: body.quantity,
      unit: body.unit ?? product?.unit ?? "kg",
      expiryDate: body.expiryDate ? body.expiryDate.toISOString().slice(0, 10) : undefined,
      status: "available",
    })
    .returning();
  await db.insert(inventoryMovementsTable).values({
    type: "entry",
    productId: body.productId,
    lotCode: body.lotCode,
    quantity: body.quantity,
    unit: body.unit ?? product?.unit ?? "kg",
    inventoryItemId: item.id,
  });
  const [productName] = await db.select({ name: productsTable.name }).from(productsTable).where(eq(productsTable.id, body.productId));
  res.status(201).json({
    id: item.id,
    type: "entry",
    productId: item.productId,
    productName: productName?.name ?? "",
    lotCode: item.lotCode,
    quantity: item.quantity,
    unit: item.unit,
    reason: null,
    orderId: null,
    createdAt: item.entryDate,
  });
});

router.post("/exits", async (req, res) => {
  const body = CreateInventoryExitBody.parse(req.body);
  const [item] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, body.inventoryItemId));
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  const newQty = item.quantity - body.quantity;
  const newStatus = newQty <= 0 ? (body.type === "exit_discard" ? "discarded" : "depleted") : item.status;
  await db
    .update(inventoryItemsTable)
    .set({ quantity: Math.max(0, newQty), status: newStatus })
    .where(eq(inventoryItemsTable.id, item.id));
  const [movement] = await db
    .insert(inventoryMovementsTable)
    .values({
      type: body.type,
      productId: item.productId,
      lotCode: item.lotCode,
      quantity: body.quantity,
      unit: item.unit,
      reason: body.reason,
      orderId: body.orderId,
      inventoryItemId: item.id,
    })
    .returning();
  const [product] = await db.select({ name: productsTable.name }).from(productsTable).where(eq(productsTable.id, item.productId));
  res.status(201).json({ ...movement, productName: product?.name ?? "" });
});

router.get("/movements", async (req, res) => {
  const movements = await db
    .select({
      id: inventoryMovementsTable.id,
      type: inventoryMovementsTable.type,
      productId: inventoryMovementsTable.productId,
      lotCode: inventoryMovementsTable.lotCode,
      quantity: inventoryMovementsTable.quantity,
      unit: inventoryMovementsTable.unit,
      reason: inventoryMovementsTable.reason,
      orderId: inventoryMovementsTable.orderId,
      createdAt: inventoryMovementsTable.createdAt,
      productName: productsTable.name,
    })
    .from(inventoryMovementsTable)
    .leftJoin(productsTable, eq(inventoryMovementsTable.productId, productsTable.id))
    .orderBy(desc(inventoryMovementsTable.createdAt));

  res.json(movements.map((m) => ({ ...m, productName: m.productName ?? "" })));
});

export default router;
