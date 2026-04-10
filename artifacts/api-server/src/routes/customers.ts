import { Router } from "express";
import { db, customersTable, ordersTable, productsTable } from "@workspace/db";
import { eq, ilike, or, count, sum, desc } from "drizzle-orm";
import { ListCustomersQueryParams, CreateCustomerBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;
  const page = parsed.success && parsed.data.page ? parsed.data.page : 1;
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 20;
  const offset = (page - 1) * limit;

  let query = db.select().from(customersTable);
  if (search) {
    query = query.where(
      or(
        ilike(customersTable.name, `%${search}%`),
        ilike(customersTable.cnpj, `%${search}%`),
        ilike(customersTable.email, `%${search}%`)
      )
    ) as typeof query;
  }

  const [customers, totalResult] = await Promise.all([
    query.limit(limit).offset(offset).orderBy(desc(customersTable.createdAt)),
    db.select({ count: count() }).from(customersTable),
  ]);

  const total = totalResult[0]?.count ?? 0;

  const customerIds = customers.map((c) => c.id);
  const orderStats: { customerId: number; totalOrders: number; totalSpent: number }[] = [];

  for (const cid of customerIds) {
    const rows = await db
      .select({ totalOrders: count(), totalSpent: sum(ordersTable.totalPrice) })
      .from(ordersTable)
      .where(eq(ordersTable.customerId, cid));
    const row = rows[0];
    orderStats.push({
      customerId: cid,
      totalOrders: row?.totalOrders ?? 0,
      totalSpent: Number(row?.totalSpent ?? 0),
    });
  }

  const statsMap = new Map(orderStats.map((s) => [s.customerId, s]));

  const data = customers.map((c) => ({
    ...c,
    totalOrders: statsMap.get(c.id)?.totalOrders ?? 0,
    totalSpent: statsMap.get(c.id)?.totalSpent ?? 0,
  }));

  res.json({ data, total, page, limit });
});

router.post("/", async (req, res) => {
  const body = CreateCustomerBody.parse(req.body);
  const [customer] = await db.insert(customersTable).values(body).returning();
  res.status(201).json({ ...customer, totalOrders: 0, totalSpent: 0 });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  const rows = await db
    .select({ totalOrders: count(), totalSpent: sum(ordersTable.totalPrice) })
    .from(ordersTable)
    .where(eq(ordersTable.customerId, id));
  const row = rows[0];
  res.json({ ...customer, totalOrders: row?.totalOrders ?? 0, totalSpent: Number(row?.totalSpent ?? 0) });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = CreateCustomerBody.parse(req.body);
  const [updated] = await db.update(customersTable).set(body).where(eq(customersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({ ...updated, totalOrders: 0, totalSpent: 0 });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(customersTable).where(eq(customersTable.id, id));
  res.status(204).send();
});

router.get("/:id/orders", async (req, res) => {
  const id = Number(req.params.id);
  const orders = await db
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
    .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
    .where(eq(ordersTable.customerId, id))
    .orderBy(desc(ordersTable.createdAt));

  res.json(
    orders.map((o) => ({
      ...o,
      customerName: o.customerName ?? "",
      productName: o.productName ?? "",
      unit: o.unit ?? "kg",
    }))
  );
});

export default router;
