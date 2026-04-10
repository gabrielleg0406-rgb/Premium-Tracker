import { Router } from "express";
import { db, deliveriesTable, deliverersTable, ordersTable, customersTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { ListDeliveriesQueryParams, CreateDeliveryBody, UpdateDeliveryBody } from "@workspace/api-zod";

const router = Router();

async function enrichDelivery(delivery: typeof deliveriesTable.$inferSelect) {
  const [order] = await db
    .select({ orderNumber: ordersTable.orderNumber, deliveryAddress: ordersTable.deliveryAddress, customerId: ordersTable.customerId })
    .from(ordersTable)
    .where(eq(ordersTable.id, delivery.orderId));
  const [customer] = order?.customerId
    ? await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, order.customerId))
    : [null];
  const [deliverer] = delivery.delivererId
    ? await db.select({ name: deliverersTable.name }).from(deliverersTable).where(eq(deliverersTable.id, delivery.delivererId))
    : [null];

  return {
    ...delivery,
    orderNumber: order?.orderNumber ?? "",
    customerName: customer?.name ?? "",
    deliveryAddress: order?.deliveryAddress ?? "",
    delivererName: deliverer?.name ?? "",
  };
}

router.get("/", async (req, res) => {
  const parsed = ListDeliveriesQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;
  const delivererId = parsed.success ? parsed.data.delivererId : undefined;

  let baseQuery = db.select().from(deliveriesTable);
  if (status) {
    baseQuery = baseQuery.where(eq(deliveriesTable.status, status)) as typeof baseQuery;
  }
  if (delivererId) {
    baseQuery = baseQuery.where(eq(deliveriesTable.delivererId, delivererId)) as typeof baseQuery;
  }

  const deliveries = await baseQuery.orderBy(desc(deliveriesTable.createdAt));
  const enriched = await Promise.all(deliveries.map(enrichDelivery));
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const body = CreateDeliveryBody.parse(req.body);
  const [delivery] = await db.insert(deliveriesTable).values(body).returning();
  const enriched = await enrichDelivery(delivery);
  res.status(201).json(enriched);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateDeliveryBody.parse(req.body);
  const [updated] = await db.update(deliveriesTable).set(body).where(eq(deliveriesTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }
  const enriched = await enrichDelivery(updated);
  res.json(enriched);
});

router.get("/stats", async (req, res) => {
  const deliverers = await db.select().from(deliverersTable);

  const stats = await Promise.all(
    deliverers.map(async (deliverer) => {
      const rows = await db
        .select({
          total: count(),
          completed: sql<number>`count(*) filter (where status = 'delivered')`,
          pending: sql<number>`count(*) filter (where status = 'pending' or status = 'in_transit')`,
        })
        .from(deliveriesTable)
        .where(eq(deliveriesTable.delivererId, deliverer.id));

      const row = rows[0];
      const total = Number(row?.total ?? 0);
      const completed = Number(row?.completed ?? 0);
      const pending = Number(row?.pending ?? 0);

      return {
        delivererId: deliverer.id,
        delivererName: deliverer.name,
        totalDeliveries: total,
        completedDeliveries: completed,
        pendingDeliveries: pending,
        successRate: total > 0 ? (completed / total) * 100 : 0,
      };
    })
  );

  res.json(stats);
});

export default router;
