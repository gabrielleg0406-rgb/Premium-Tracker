import { Router } from "express";
import { db, productionLotsTable, productsTable, ordersTable, customersTable, deliveriesTable, deliverersTable, rawMaterialsTable, inventoryMovementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/lots", async (req, res) => {
  const lots = await db
    .select({
      lotCode: productionLotsTable.lotCode,
      status: productionLotsTable.status,
      createdAt: productionLotsTable.createdAt,
      productName: productsTable.name,
    })
    .from(productionLotsTable)
    .leftJoin(productsTable, eq(productionLotsTable.productId, productsTable.id))
    .orderBy(desc(productionLotsTable.createdAt));

  res.json(lots.map((l) => ({ ...l, productName: l.productName ?? "" })));
});

router.get("/lots/:lotCode", async (req, res) => {
  const { lotCode } = req.params;

  const [lot] = await db.select().from(productionLotsTable).where(eq(productionLotsTable.lotCode, lotCode));
  if (!lot) {
    res.status(404).json({ error: "Lot not found" });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, lot.productId));
  const rawMaterial = lot.rawMaterialId
    ? (await db.select().from(rawMaterialsTable).where(eq(rawMaterialsTable.id, lot.rawMaterialId)))[0]
    : null;

  const order = lot.orderId
    ? (await db
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
        .where(eq(ordersTable.id, lot.orderId)))[0]
    : null;

  const delivery = order?.id
    ? (await db
        .select({
          id: deliveriesTable.id,
          orderId: deliveriesTable.orderId,
          delivererId: deliveriesTable.delivererId,
          status: deliveriesTable.status,
          scheduledAt: deliveriesTable.scheduledAt,
          deliveredAt: deliveriesTable.deliveredAt,
          notes: deliveriesTable.notes,
          createdAt: deliveriesTable.createdAt,
          updatedAt: deliveriesTable.updatedAt,
          delivererName: deliverersTable.name,
        })
        .from(deliveriesTable)
        .leftJoin(deliverersTable, eq(deliveriesTable.delivererId, deliverersTable.id))
        .where(eq(deliveriesTable.orderId, order.id)))[0]
    : null;

  const timeline = [];

  if (rawMaterial) {
    timeline.push({
      id: 1,
      stage: "raw_material",
      event: "Entrada de Matéria-Prima",
      description: `${rawMaterial.quantityKg}kg de laranja recebidos do fornecedor ${rawMaterial.supplier}`,
      actor: "Sistema",
      timestamp: rawMaterial.entryDate,
      metadata: { supplier: rawMaterial.supplier, quality: rawMaterial.quality, brixLevel: rawMaterial.brixLevel },
    });
  }

  timeline.push({
    id: 2,
    stage: "production",
    event: "Lote Criado",
    description: `Lote ${lotCode} criado para produção de ${lot.quantityProduced} ${lot.unit} de ${product?.name}`,
    actor: "Produção",
    timestamp: lot.createdAt,
    metadata: { lotCode, status: lot.status },
  });

  if (lot.status === "in_production" || lot.status === "finished" || lot.status === "quality_approved" || lot.status === "quality_rejected") {
    timeline.push({
      id: 3,
      stage: "production",
      event: "Em Produção",
      description: `Processo de produção iniciado para o lote ${lotCode}`,
      actor: "Produção",
      timestamp: lot.producedAt ?? lot.createdAt,
      metadata: {},
    });
  }

  if (lot.qualityStatus !== "pending") {
    timeline.push({
      id: 4,
      stage: "quality_control",
      event: lot.qualityStatus === "approved" ? "Qualidade Aprovada" : "Qualidade Reprovada",
      description: `Controle de qualidade: Brix ${lot.brixLevel ?? "-"}°, Temp ${lot.temperature ?? "-"}°C. ${lot.qualityNotes ?? ""}`,
      actor: "Controle de Qualidade",
      timestamp: lot.producedAt ?? lot.updatedAt,
      metadata: { brixLevel: lot.brixLevel, temperature: lot.temperature, notes: lot.qualityNotes },
    });
  }

  const inventoryMvt = await db.select().from(inventoryMovementsTable).where(eq(inventoryMovementsTable.lotCode, lotCode));
  if (inventoryMvt.length > 0) {
    timeline.push({
      id: 5,
      stage: "inventory",
      event: "Entrada no Estoque",
      description: `Lote ${lotCode} registrado no estoque`,
      actor: "Estoque",
      timestamp: inventoryMvt[0].createdAt,
      metadata: { quantity: inventoryMvt[0].quantity, unit: inventoryMvt[0].unit },
    });
  }

  if (delivery) {
    timeline.push({
      id: 6,
      stage: "delivery",
      event: delivery.status === "delivered" ? "Entrega Concluída" : "Em Entrega",
      description: `Entrega ${delivery.status === "delivered" ? "concluída" : "em andamento"} ${delivery.delivererName ? `por ${delivery.delivererName}` : ""}`,
      actor: delivery.delivererName ?? "Entregador",
      timestamp: delivery.deliveredAt ?? delivery.createdAt,
      metadata: { status: delivery.status },
    });
  }

  res.json({
    lotCode,
    productName: product?.name ?? "",
    currentStatus: lot.status,
    timeline,
    rawMaterial,
    productionLot: { ...lot, productName: product?.name ?? "" },
    order: order ? { ...order, customerName: order.customerName ?? "", productName: order.productName ?? "", unit: order.unit ?? "kg" } : null,
    delivery: delivery
      ? {
          ...delivery,
          orderNumber: order?.orderNumber ?? "",
          customerName: order?.customerName ?? "",
          deliveryAddress: order?.deliveryAddress ?? "",
          delivererName: delivery.delivererName ?? "",
        }
      : null,
  });
});

export default router;
