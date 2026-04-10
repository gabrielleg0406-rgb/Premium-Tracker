import { Router } from "express";
import { db, ordersTable, customersTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListOrdersQueryParams, CreateOrderBody, UpdateOrderBody } from "@workspace/api-zod";

const router = Router();

function generateOrderNumber() {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  return `ORD-${ts}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
}

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, order.customerId));
  const [product] = await db.select({ name: productsTable.name, unit: productsTable.unit }).from(productsTable).where(eq(productsTable.id, order.productId));
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
    .select({
      id: ordersTable.id,
      orderNumber: ordersTable.orderNumber,
      customerId: ordersTable.customerId,
      productId: ordersTable.productId,
      quantity: ordersTable.quantity,
      totalPrice: ordersTable.totalPrice,
      paymentType: ordersTable.paymentType,
      status: ordersTable.status,
      deliveryType: ordersTable.deliveryType,
      deliveryAddress: ordersTable.deliveryAddress,
      notes: ordersTable.notes,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
      customerName: customersTable.name,
      productName: productsTable.name,
      unit: productsTable.unit,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id));

  if (status) {
    baseQuery = baseQuery.where(eq(ordersTable.status, status)) as typeof baseQuery;
  }

  const orders = await baseQuery.limit(limit).offset(offset).orderBy(desc(ordersTable.createdAt));
  const totalResult = await db.select().from(ordersTable);
  const total = totalResult.length;

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
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, body.productId));
  const totalPrice = (product?.pricePerUnit ?? 0) * body.quantity;
  const [order] = await db
    .insert(ordersTable)
    .values({ ...body, orderNumber: generateOrderNumber(), totalPrice })
    .returning();
  const enriched = await enrichOrder(order);
  res.status(201).json(enriched);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
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
  const [updated] = await db.update(ordersTable).set(body).where(eq(ordersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const enriched = await enrichOrder(updated);
  res.json(enriched);
});

export default router;
