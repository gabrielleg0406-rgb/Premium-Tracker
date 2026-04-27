import { Router } from "express";
import { db, productionLotsTable, productsTable, qualityAlertsTable } from "@workspace/db";
import { eq, desc, count, avg, sql } from "drizzle-orm";
import { ListProductionLotsQueryParams, CreateProductionLotBody, UpdateProductionLotBody } from "@workspace/api-zod";

const router = Router();

function generateLotCode() {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  return `LOT-${ts}-${Math.floor(Math.random() * 100000).toString().padStart(5, "0")}`;
}

async function enrichLot(lot: typeof productionLotsTable.$inferSelect) {
  const [product] = await db.select({ name: productsTable.name }).from(productsTable).where(eq(productsTable.id, lot.productId));
  return { ...lot, productName: product?.name ?? "" };
}

router.get("/lots", async (req, res) => {
  const parsed = ListProductionLotsQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  let baseQuery = db
    .select({
      id: productionLotsTable.id,
      lotCode: productionLotsTable.lotCode,
      productId: productionLotsTable.productId,
      orderId: productionLotsTable.orderId,
      rawMaterialId: productionLotsTable.rawMaterialId,
      quantityProduced: productionLotsTable.quantityProduced,
      unit: productionLotsTable.unit,
      status: productionLotsTable.status,
      qualityStatus: productionLotsTable.qualityStatus,
      brixLevel: productionLotsTable.brixLevel,
      temperature: productionLotsTable.temperature,
      qualityNotes: productionLotsTable.qualityNotes,
      shift: productionLotsTable.shift,
      responsible: productionLotsTable.responsible,
      expiresAt: productionLotsTable.expiresAt,
      producedAt: productionLotsTable.producedAt,
      createdAt: productionLotsTable.createdAt,
      updatedAt: productionLotsTable.updatedAt,
      productName: productsTable.name,
    })
    .from(productionLotsTable)
    .leftJoin(productsTable, eq(productionLotsTable.productId, productsTable.id));

  if (status) {
    baseQuery = baseQuery.where(eq(productionLotsTable.status, status)) as typeof baseQuery;
  }

  const lots = await baseQuery.orderBy(desc(productionLotsTable.createdAt));
  res.json(lots.map((l) => ({ ...l, productName: l.productName ?? "" })));
});

router.post("/lots", async (req, res) => {
  const body = CreateProductionLotBody.parse(req.body);
  const [lot] = await db
    .insert(productionLotsTable)
    .values({ ...body, lotCode: generateLotCode() })
    .returning();
  const enriched = await enrichLot(lot);
  res.status(201).json(enriched);
});

router.get("/lots/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [lot] = await db.select().from(productionLotsTable).where(eq(productionLotsTable.id, id));
  if (!lot) {
    res.status(404).json({ error: "Lot not found" });
    return;
  }
  const enriched = await enrichLot(lot);
  res.json(enriched);
});

router.put("/lots/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = UpdateProductionLotBody.parse(req.body);

  const updates: Partial<typeof productionLotsTable.$inferInsert> = { ...body };
  if (body.status === "finished") {
    updates.producedAt = new Date();
  }

  const [updated] = await db.update(productionLotsTable).set(updates).where(eq(productionLotsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Lot not found" });
    return;
  }

  if (body.qualityStatus === "rejected" || (body.temperature !== undefined && body.temperature > 8)) {
    await db.insert(qualityAlertsTable).values({
      type: body.qualityStatus === "rejected" ? "quality_rejected" : "temperature",
      message: body.qualityStatus === "rejected"
        ? `Lote ${updated.lotCode} reprovado no controle de qualidade`
        : `Temperatura fora do padrão no lote ${updated.lotCode}: ${body.temperature}°C`,
      lotCode: updated.lotCode,
      severity: body.qualityStatus === "rejected" ? "high" : "medium",
      resolved: "false",
    }).catch(() => {});
  }

  if (body.brixLevel !== undefined && (body.brixLevel < 8 || body.brixLevel > 14)) {
    await db.insert(qualityAlertsTable).values({
      type: "brix",
      message: `Nível Brix fora do padrão no lote ${updated.lotCode}: ${body.brixLevel}°Brix`,
      lotCode: updated.lotCode,
      severity: "medium",
      resolved: "false",
    }).catch(() => {});
  }

  const enriched = await enrichLot(updated);
  res.json(enriched);
});

router.get("/stats", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [todayRows, weekRows, monthRows, qualityRows, inProductionRows, finishedRows, brixRows] = await Promise.all([
    db.select({ total: sql<number>`sum(quantity_produced)` }).from(productionLotsTable).where(sql`created_at >= ${today}`),
    db.select({ total: sql<number>`sum(quantity_produced)` }).from(productionLotsTable).where(sql`created_at >= ${weekAgo}`),
    db.select({ total: sql<number>`sum(quantity_produced)` }).from(productionLotsTable).where(sql`created_at >= ${monthAgo}`),
    db.select({
      approved: sql<number>`count(*) filter (where quality_status = 'approved')`,
      rejected: sql<number>`count(*) filter (where quality_status = 'rejected')`,
      total: count(),
    }).from(productionLotsTable),
    db.select({ cnt: count() }).from(productionLotsTable).where(eq(productionLotsTable.status, "in_production")),
    db.select({ cnt: count() }).from(productionLotsTable).where(eq(productionLotsTable.status, "finished")),
    db.select({ avg: avg(productionLotsTable.brixLevel) }).from(productionLotsTable),
  ]);

  const qr = qualityRows[0];
  const total = Number(qr?.total ?? 0);
  const approved = Number(qr?.approved ?? 0);
  const rejected = Number(qr?.rejected ?? 0);

  res.json({
    todayProduced: Number(todayRows[0]?.total ?? 0),
    weekProduced: Number(weekRows[0]?.total ?? 0),
    monthProduced: Number(monthRows[0]?.total ?? 0),
    approvalRate: total > 0 ? (approved / total) * 100 : 0,
    rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
    averageBrix: Number(brixRows[0]?.avg ?? 0),
    lotsInProduction: Number(inProductionRows[0]?.cnt ?? 0),
    lotsFinished: Number(finishedRows[0]?.cnt ?? 0),
  });
});

export default router;
