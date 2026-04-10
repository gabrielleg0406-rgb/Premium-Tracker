import { Router } from "express";
import { db, productionLotsTable, ordersTable, inventoryMovementsTable } from "@workspace/db";
import { sql, count, sum, avg } from "drizzle-orm";

const router = Router();

function parseRange(query: Record<string, unknown>) {
  const from = query.from ? new Date(String(query.from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(String(query.to)) : new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function toRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) return (result as { rows: T[] }).rows;
  return [];
}

router.get("/production", async (req, res) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);

  const [totals, qualityRows, byProductResult, dailyResult] = await Promise.all([
    db.select({
      totalProduced: sum(productionLotsTable.quantityProduced).mapWith(Number),
      totalLots: count(),
    }).from(productionLotsTable).where(sql`created_at BETWEEN ${from} AND ${to}`),
    db.select({
      approved: sql<number>`count(*) filter (where quality_status = 'approved')`,
      rejected: sql<number>`count(*) filter (where quality_status = 'rejected')`,
      avgBrix: avg(productionLotsTable.brixLevel).mapWith(Number),
    }).from(productionLotsTable).where(sql`created_at BETWEEN ${from} AND ${to}`),
    db.execute(sql`
      SELECT p.name as product_name, p.unit, COALESCE(SUM(pl.quantity_produced), 0) as quantity
      FROM production_lots pl
      JOIN products p ON pl.product_id = p.id
      WHERE pl.created_at BETWEEN ${from} AND ${to}
      GROUP BY p.name, p.unit
    `),
    db.execute(sql`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN product_id IN (SELECT id FROM products WHERE type = 'juice') THEN quantity_produced ELSE 0 END), 0) as juice_kg,
        COALESCE(SUM(CASE WHEN product_id IN (SELECT id FROM products WHERE type = 'fruit') THEN quantity_produced ELSE 0 END), 0) as orange_kg
      FROM production_lots
      WHERE created_at BETWEEN ${from} AND ${to}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),
  ]);

  const t = totals[0];
  const q = qualityRows[0];
  type BPRow = { product_name: string; unit: string; quantity: string };
  type DRow = { date: Date | string; juice_kg: string; orange_kg: string };

  res.json({
    totalProduced: t?.totalProduced ?? 0,
    totalLots: Number(t?.totalLots ?? 0),
    approvedLots: Number(q?.approved ?? 0),
    rejectedLots: Number(q?.rejected ?? 0),
    averageBrix: q?.avgBrix ?? 0,
    byProduct: toRows<BPRow>(byProductResult).map((r) => ({
      productName: r.product_name,
      unit: r.unit,
      quantity: Number(r.quantity),
    })),
    dailyBreakdown: toRows<DRow>(dailyResult).map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date),
      juiceKg: Number(r.juice_kg),
      orangeKg: Number(r.orange_kg),
    })),
  });
});

router.get("/financial", async (req, res) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);

  const [totals, byPaymentResult, topCustomersResult] = await Promise.all([
    db.select({
      totalRevenue: sum(ordersTable.totalPrice).mapWith(Number),
      totalOrders: count(),
    }).from(ordersTable).where(sql`created_at BETWEEN ${from} AND ${to}`),
    db.execute(sql`
      SELECT payment_type, COUNT(*) as cnt, COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE created_at BETWEEN ${from} AND ${to}
      GROUP BY payment_type
    `),
    db.execute(sql`
      SELECT c.name as customer_name, COALESCE(SUM(o.total_price), 0) as total_spent
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.created_at BETWEEN ${from} AND ${to}
      GROUP BY c.name
      ORDER BY total_spent DESC
      LIMIT 5
    `),
  ]);

  const t = totals[0];
  const totalOrders = Number(t?.totalOrders ?? 0);
  const totalRevenue = t?.totalRevenue ?? 0;
  type PayRow = { payment_type: string; cnt: string; total: string };
  type CustRow = { customer_name: string; total_spent: string };

  res.json({
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    byPaymentType: toRows<PayRow>(byPaymentResult).map((r) => ({
      paymentType: r.payment_type,
      total: Number(r.total),
      count: Number(r.cnt),
    })),
    topCustomers: toRows<CustRow>(topCustomersResult).map((r) => ({
      customerName: r.customer_name,
      totalSpent: Number(r.total_spent),
    })),
  });
});

router.get("/quality", async (req, res) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);

  const [totals] = await db.select({
    totalLotsTested: sql<number>`count(*) filter (where quality_status != 'pending')`,
    approvedLots: sql<number>`count(*) filter (where quality_status = 'approved')`,
    rejectedLots: sql<number>`count(*) filter (where quality_status = 'rejected')`,
    avgBrix: avg(productionLotsTable.brixLevel).mapWith(Number),
    avgTemp: avg(productionLotsTable.temperature).mapWith(Number),
  }).from(productionLotsTable).where(sql`created_at BETWEEN ${from} AND ${to}`);

  const total = Number(totals?.totalLotsTested ?? 0);
  const approved = Number(totals?.approvedLots ?? 0);

  res.json({
    totalLotsTested: total,
    approvedLots: approved,
    rejectedLots: Number(totals?.rejectedLots ?? 0),
    approvalRate: total > 0 ? (approved / total) * 100 : 0,
    averageBrix: totals?.avgBrix ?? 0,
    averageTemperature: totals?.avgTemp ?? 0,
    rejectionReasons: [],
  });
});

router.get("/discards", async (req, res) => {
  const { from, to } = parseRange(req.query as Record<string, unknown>);

  const discards = await db
    .select()
    .from(inventoryMovementsTable)
    .where(sql`type = 'exit_discard' AND created_at BETWEEN ${from} AND ${to}`);

  const totalKg = discards.reduce((acc, d) => acc + d.quantity, 0);

  const byReasonMap: Record<string, { count: number; kg: number }> = {};
  for (const d of discards) {
    const reason = d.reason ?? "Sem motivo especificado";
    if (!byReasonMap[reason]) byReasonMap[reason] = { count: 0, kg: 0 };
    byReasonMap[reason].count++;
    byReasonMap[reason].kg += d.quantity;
  }

  res.json({
    totalDiscardedKg: totalKg,
    totalMovements: discards.length,
    byReason: Object.entries(byReasonMap).map(([reason, { count, kg }]) => ({
      reason,
      quantityKg: kg,
      count,
    })),
  });
});

export default router;
