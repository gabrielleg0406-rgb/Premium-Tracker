import { Router } from "express";
import { db, ordersTable, customersTable, productsTable } from "@workspace/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { GetCashRegisterSummaryQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/summary", async (req, res) => {
  const parsed = GetCashRegisterSummaryQueryParams.safeParse(req.query);
  const dateStr =
    parsed.success && parsed.data.date
      ? parsed.data.date
      : new Date().toISOString().slice(0, 10);

  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);

  const dayWhere = and(
    gte(ordersTable.createdAt, start),
    lte(ordersTable.createdAt, end),
  );

  const [received] = await db
    .select({
      total: sql<number>`coalesce(sum(${ordersTable.amountPaid}), 0)`,
    })
    .from(ordersTable)
    .where(dayWhere);

  const [pending] = await db
    .select({
      total: sql<number>`coalesce(sum(${ordersTable.totalPrice} - ${ordersTable.amountPaid}), 0)`,
    })
    .from(ordersTable)
    .where(
      and(
        dayWhere,
        sql`${ordersTable.paymentStatus} != 'paid'`,
        sql`${ordersTable.status} != 'cancelled'`,
      ),
    );

  const [openCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(ordersTable)
    .where(
      and(
        dayWhere,
        sql`${ordersTable.status} not in ('delivered', 'cancelled')`,
      ),
    );

  const [completedCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(ordersTable)
    .where(and(dayWhere, eq(ordersTable.status, "delivered")));

  const byMethodRows = await db
    .select({
      method: ordersTable.paymentType,
      total: sql<number>`coalesce(sum(${ordersTable.amountPaid}), 0)`,
    })
    .from(ordersTable)
    .where(dayWhere)
    .groupBy(ordersTable.paymentType);

  const receivedByMethod = { cash: 0, card: 0, pix: 0, promissory: 0 };
  for (const row of byMethodRows) {
    if (row.method && row.method in receivedByMethod) {
      (receivedByMethod as Record<string, number>)[row.method] = Number(
        row.total ?? 0,
      );
    }
  }

  const recent = await db
    .select({
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
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
    .where(dayWhere)
    .orderBy(desc(ordersTable.createdAt))
    .limit(20);

  res.json({
    date: dateStr,
    totalReceived: Number(received?.total ?? 0),
    totalPending: Number(pending?.total ?? 0),
    ordersOpen: Number(openCount?.c ?? 0),
    ordersCompleted: Number(completedCount?.c ?? 0),
    receivedByMethod,
    recentOrders: recent.map((o) => ({
      ...o,
      customerName: o.customerName ?? "",
      productName: o.productName ?? "",
      unit: o.unit ?? "kg",
    })),
  });
});

export default router;
