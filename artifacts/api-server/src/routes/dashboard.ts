import { Router } from "express";
import { db, ordersTable, productionLotsTable, deliveriesTable, inventoryItemsTable, customersTable, qualityAlertsTable } from "@workspace/db";
import { eq, count, sum, gte, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    pendingOrdersResult,
    pendingDeliveriesResult,
    inProductionResult,
    stockResult,
    qualityResult,
    revenueResult,
    activeCustomersResult,
    dailyProductionResult,
  ] = await Promise.all([
    db.select({ cnt: count() }).from(ordersTable).where(eq(ordersTable.status, "pending")),
    db.select({ cnt: count() }).from(deliveriesTable).where(eq(deliveriesTable.status, "pending")),
    db.select({ cnt: count() }).from(ordersTable).where(eq(ordersTable.status, "in_production")),
    db.select({ total: sum(inventoryItemsTable.quantity) }).from(inventoryItemsTable).where(eq(inventoryItemsTable.status, "available")),
    db.select({
      approved: sql<number>`count(*) filter (where quality_status = 'approved')`,
      total: sql<number>`count(*) filter (where quality_status != 'pending')`,
    }).from(productionLotsTable),
    db.select({ total: sum(ordersTable.totalPrice) }).from(ordersTable).where(eq(ordersTable.status, "delivered")),
    db.select({ cnt: count() }).from(customersTable),
    db.select({ total: sql<number>`sum(quantity_produced)` }).from(productionLotsTable).where(sql`created_at >= ${today}`),
  ]);

  const approved = Number(qualityResult[0]?.approved ?? 0);
  const qualityTotal = Number(qualityResult[0]?.total ?? 0);

  res.json({
    dailyProduction: Number(dailyProductionResult[0]?.total ?? 0),
    pendingOrders: Number(pendingOrdersResult[0]?.cnt ?? 0),
    pendingDeliveries: Number(pendingDeliveriesResult[0]?.cnt ?? 0),
    qualityApprovalRate: qualityTotal > 0 ? (approved / qualityTotal) * 100 : 0,
    currentStockKg: Number(stockResult[0]?.total ?? 0),
    ordersInProduction: Number(inProductionResult[0]?.cnt ?? 0),
    monthlyRevenue: Number(revenueResult[0]?.total ?? 0),
    activeCustomers: Number(activeCustomersResult[0]?.cnt ?? 0),
  });
});

router.get("/quality-alerts", async (req, res) => {
  const alerts = await db
    .select()
    .from(qualityAlertsTable)
    .where(eq(qualityAlertsTable.resolved, "false"))
    .orderBy(desc(qualityAlertsTable.createdAt))
    .limit(20);
  res.json(alerts);
});

router.get("/production-chart", async (req, res) => {
  const rows = await db.execute(sql`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(CASE WHEN product_id IN (SELECT id FROM products WHERE type = 'juice') THEN quantity_produced ELSE 0 END), 0) as juice_kg,
      COALESCE(SUM(CASE WHEN product_id IN (SELECT id FROM products WHERE type = 'fruit') THEN quantity_produced ELSE 0 END), 0) as orange_kg
    FROM production_lots
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  const rowData = Array.isArray(rows) ? rows : (rows as { rows: unknown[] }).rows ?? [];
  res.json(
    (rowData as { date: Date | string; juice_kg: string; orange_kg: string }[]).map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date),
      juiceKg: Number(r.juice_kg),
      orangeKg: Number(r.orange_kg),
    }))
  );
});

router.get("/order-status-breakdown", async (req, res) => {
  const rows = await db
    .select({
      status: ordersTable.status,
      cnt: count(),
    })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.status] = Number(row.cnt);
  }

  res.json({
    pending: map["pending"] ?? 0,
    inProduction: map["in_production"] ?? 0,
    ready: map["ready"] ?? 0,
    delivered: map["delivered"] ?? 0,
    cancelled: map["cancelled"] ?? 0,
  });
});

export default router;
