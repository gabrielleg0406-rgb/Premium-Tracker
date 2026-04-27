import { Router } from "express";
import {
  db,
  ordersTable,
  customersTable,
  productsTable,
  inventoryItemsTable,
  inventoryMovementsTable,
  productionLotsTable,
  deliveriesTable,
} from "@workspace/db";
import { eq, desc, count, and } from "drizzle-orm";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  UpdateOrderBody,
  CreatePosOrderBody,
  RegisterOrderPaymentBody,
} from "@workspace/api-zod";

const router = Router();

function generateOrderNumber() {
  const now = new Date();
  const ts =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  return `ORD-${ts}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
}

function generateLotCode() {
  const now = new Date();
  const ts =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  return `LOT-${ts}-${Math.floor(Math.random() * 100000).toString().padStart(5, "0")}`;
}

const orderSelect = {
  id: ordersTable.id,
  orderNumber: ordersTable.orderNumber,
  customerId: ordersTable.customerId,
  productId: ordersTable.productId,
  quantity: ordersTable.quantity,
  totalPrice: ordersTable.totalPrice,
  paymentType: ordersTable.paymentType,
  paymentStatus: ordersTable.paymentStatus,
  amountPaid: ordersTable.amountPaid,
  fulfillmentSource: ordersTable.fulfillmentSource,
  status: ordersTable.status,
  deliveryType: ordersTable.deliveryType,
  deliveryAddress: ordersTable.deliveryAddress,
  scheduledAt: ordersTable.scheduledAt,
  notes: ordersTable.notes,
  createdAt: ordersTable.createdAt,
  updatedAt: ordersTable.updatedAt,
  customerName: customersTable.name,
  productName: productsTable.name,
  unit: productsTable.unit,
} as const;

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const [customer] = await db
    .select({ name: customersTable.name })
    .from(customersTable)
    .where(eq(customersTable.id, order.customerId));
  const [product] = await db
    .select({ name: productsTable.name, unit: productsTable.unit })
    .from(productsTable)
    .where(eq(productsTable.id, order.productId));
  return {
    ...order,
    customerName: customer?.name ?? "",
    productName: product?.name ?? "",
    unit: product?.unit ?? "kg",
  };
}

router.get("/", async (req, res) => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;
  const page = parsed.success && parsed.data.page ? parsed.data.page : 1;
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 20;
  const offset = (page - 1) * limit;

  let baseQuery = db
    .select(orderSelect)
    .from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id));

  if (status) {
    baseQuery = baseQuery.where(eq(ordersTable.status, status)) as typeof baseQuery;
  }

  const orders = await baseQuery
    .limit(limit)
    .offset(offset)
    .orderBy(desc(ordersTable.createdAt));
  const totalRows = await db.select({ c: count() }).from(ordersTable);
  const total = totalRows[0]?.c ?? 0;

  res.json({
    data: orders.map((o) => ({
      ...o,
      customerName: o.customerName ?? "",
      productName: o.productName ?? "",
      unit: o.unit ?? "kg",
    })),
    total,
    page,
    limit,
  });
});

router.post("/", async (req, res) => {
  const body = CreateOrderBody.parse(req.body);
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, body.productId));
  const totalPrice = (product?.pricePerUnit ?? 0) * body.quantity;
  const [order] = await db
    .insert(ordersTable)
    .values({ ...body, orderNumber: generateOrderNumber(), totalPrice })
    .returning();
  const enriched = await enrichOrder(order);
  res.status(201).json(enriched);
});

router.post("/pos", async (req, res) => {
  const body = CreatePosOrderBody.parse(req.body);

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, body.productId));
  if (!product) {
    res.status(400).json({ error: "Product not found" });
    return;
  }

  const totalPrice = product.pricePerUnit * body.quantity;
  const amountPaid = body.amountPaid ?? 0;
  const paymentStatus =
    amountPaid >= totalPrice
      ? "paid"
      : amountPaid > 0
        ? "partial"
        : "pending";

  // Determine order status based on fulfillment source + delivery type
  const orderStatus =
    body.fulfillmentSource === "production"
      ? "in_production"
      : body.deliveryType === "pickup"
        ? "ready"
        : "ready";

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber: generateOrderNumber(),
      customerId: body.customerId,
      productId: body.productId,
      quantity: body.quantity,
      totalPrice,
      paymentType: body.paymentType,
      paymentStatus,
      amountPaid,
      fulfillmentSource: body.fulfillmentSource,
      status: orderStatus,
      deliveryType: body.deliveryType,
      deliveryAddress: body.deliveryAddress ?? null,
      scheduledAt: body.scheduledAt ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  // If pulling from stock, create an exit movement against the oldest available lot for this product
  if (body.fulfillmentSource === "stock") {
    const availableItems = await db
      .select()
      .from(inventoryItemsTable)
      .where(
        and(
          eq(inventoryItemsTable.productId, body.productId),
          eq(inventoryItemsTable.status, "available"),
        ),
      )
      .orderBy(inventoryItemsTable.entryDate);

    let remaining = body.quantity;
    for (const item of availableItems) {
      if (remaining <= 0) break;
      const take = Math.min(item.quantity, remaining);
      const newQty = item.quantity - take;
      await db
        .update(inventoryItemsTable)
        .set({
          quantity: newQty,
          status: newQty <= 0 ? "depleted" : item.status,
        })
        .where(eq(inventoryItemsTable.id, item.id));
      await db.insert(inventoryMovementsTable).values({
        type: "exit_sale",
        productId: item.productId,
        lotCode: item.lotCode,
        quantity: take,
        unit: item.unit,
        reason: `POS: pedido ${order.orderNumber}`,
        orderId: order.id,
        inventoryItemId: item.id,
      });
      remaining -= take;
    }
  } else {
    // Send to production: create a pending production lot
    await db.insert(productionLotsTable).values({
      lotCode: generateLotCode(),
      productId: body.productId,
      orderId: order.id,
      quantityProduced: body.quantity,
      unit: product.unit,
      status: "pending",
      qualityStatus: "pending",
    });
  }

  // If delivery, create a delivery record
  if (body.deliveryType === "delivery") {
    await db.insert(deliveriesTable).values({
      orderId: order.id,
      status: "pending",
      scheduledAt: body.scheduledAt ?? null,
    });
  }

  const enriched = await enrichOrder(order);
  res.status(201).json(enriched);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const enriched = await enrichOrder(order);
  res.json(enriched);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateOrderBody.parse(req.body);
  const [updated] = await db
    .update(ordersTable)
    .set(body)
    .where(eq(ordersTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const enriched = await enrichOrder(updated);
  res.json(enriched);
});

router.post("/:id/payment", async (req, res) => {
  const id = Number(req.params.id);
  const body = RegisterOrderPaymentBody.parse(req.body);
  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const newAmountPaid = existing.amountPaid + body.amountPaid;
  const newStatus =
    newAmountPaid >= existing.totalPrice
      ? "paid"
      : newAmountPaid > 0
        ? "partial"
        : "pending";
  const [updated] = await db
    .update(ordersTable)
    .set({
      amountPaid: newAmountPaid,
      paymentStatus: newStatus,
      ...(body.paymentType ? { paymentType: body.paymentType } : {}),
    })
    .where(eq(ordersTable.id, id))
    .returning();
  const enriched = await enrichOrder(updated);
  res.json(enriched);
});

export default router;
