import {
  db,
  pool,
  customersTable,
  productsTable,
  rawMaterialsTable,
  ordersTable,
  productionLotsTable,
  inventoryItemsTable,
  inventoryMovementsTable,
  deliverersTable,
  deliveriesTable,
  qualityAlertsTable,
} from "@workspace/db";

function daysAgo(n: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysFromNow(n: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function pad(n: number, len = 4) {
  return n.toString().padStart(len, "0");
}

async function reset() {
  console.log("→ Limpando dados existentes...");
  await db.delete(qualityAlertsTable);
  await db.delete(deliveriesTable);
  await db.delete(deliverersTable);
  await db.delete(inventoryMovementsTable);
  await db.delete(inventoryItemsTable);
  await db.delete(productionLotsTable);
  await db.delete(ordersTable);
  await db.delete(rawMaterialsTable);
  await db.delete(productsTable);
  await db.delete(customersTable);
  await pool.query(`
    ALTER SEQUENCE customers_id_seq RESTART WITH 1;
    ALTER SEQUENCE products_id_seq RESTART WITH 1;
    ALTER SEQUENCE raw_materials_id_seq RESTART WITH 1;
    ALTER SEQUENCE orders_id_seq RESTART WITH 1;
    ALTER SEQUENCE production_lots_id_seq RESTART WITH 1;
    ALTER SEQUENCE inventory_items_id_seq RESTART WITH 1;
    ALTER SEQUENCE inventory_movements_id_seq RESTART WITH 1;
    ALTER SEQUENCE deliverers_id_seq RESTART WITH 1;
    ALTER SEQUENCE deliveries_id_seq RESTART WITH 1;
    ALTER SEQUENCE quality_alerts_id_seq RESTART WITH 1;
  `);
}

async function seedProducts() {
  console.log("→ Criando produtos...");
  const rows = await db
    .insert(productsTable)
    .values([
      {
        name: "Suco de Laranja Premium 1L",
        type: "juice",
        unit: "liter",
        pricePerUnit: 12.9,
        description: "Suco 100% natural, prensado a frio, sem aditivos, com laranjas pera selecionadas.",
      },
      {
        name: "Suco de Laranja Integral 500ml",
        type: "juice",
        unit: "liter",
        pricePerUnit: 7.5,
        description: "Suco integral pasteurizado, ideal para food service e cafeterias.",
      },
      {
        name: "Suco de Laranja com Acerola 1L",
        type: "juice",
        unit: "liter",
        pricePerUnit: 14.5,
        description: "Blend de laranja pera com acerola, rico em vitamina C.",
      },
      {
        name: "Laranja Pera Caixa 18kg",
        type: "fruit",
        unit: "box",
        pricePerUnit: 65.0,
        description: "Caixa de laranja pera in natura, padrão A, classificada e higienizada.",
      },
      {
        name: "Laranja Lima Caixa 18kg",
        type: "fruit",
        unit: "box",
        pricePerUnit: 78.0,
        description: "Laranja lima doce, ideal para sucos premium e consumo direto.",
      },
      {
        name: "Bagaço de Laranja",
        type: "byproduct",
        unit: "kg",
        pricePerUnit: 0.85,
        description: "Subproduto destinado à indústria de ração animal e adubação orgânica.",
      },
    ])
    .returning();
  return rows;
}

async function seedCustomers() {
  console.log("→ Criando clientes...");
  const rows = await db
    .insert(customersTable)
    .values([
      {
        name: "Padaria Pão Dourado Ltda",
        cnpj: "12.345.678/0001-90",
        address: "Av. Paulista, 1.500",
        city: "São Paulo",
        state: "SP",
        phone: "(11) 3456-7890",
        email: "compras@paodourado.com.br",
        preferredProducts: ["juice"],
      },
      {
        name: "Café & Sabor Bistrô",
        cnpj: "23.456.789/0001-12",
        address: "Rua Oscar Freire, 234",
        city: "São Paulo",
        state: "SP",
        phone: "(11) 2345-6789",
        email: "pedidos@cafesabor.com.br",
        preferredProducts: ["juice", "fruit"],
      },
      {
        name: "Mercado Verde Distribuidora",
        cnpj: "34.567.890/0001-23",
        address: "Rod. Anhanguera, km 32",
        city: "Jundiaí",
        state: "SP",
        phone: "(11) 4524-1100",
        email: "compras@mercadoverde.com",
        preferredProducts: ["fruit"],
      },
      {
        name: "Hotel Vista Alegre",
        cnpj: "45.678.901/0001-34",
        address: "Av. Atlântica, 2.500",
        city: "Rio de Janeiro",
        state: "RJ",
        phone: "(21) 2547-8800",
        email: "fb@vistaalegre.com.br",
        preferredProducts: ["juice"],
      },
      {
        name: "Restaurante Sabores do Sul",
        cnpj: "56.789.012/0001-45",
        address: "Rua dos Andradas, 950",
        city: "Porto Alegre",
        state: "RS",
        phone: "(51) 3221-4400",
        email: "compras@saboresdosul.com.br",
        preferredProducts: ["juice"],
      },
      {
        name: "Supermercados Bom Preço",
        cnpj: "67.890.123/0001-56",
        address: "Av. Brasil, 12.000",
        city: "Belo Horizonte",
        state: "MG",
        phone: "(31) 3344-5566",
        email: "fornecedores@bompreco.com",
        preferredProducts: ["juice", "fruit"],
      },
      {
        name: "Academia FitLife",
        cnpj: "78.901.234/0001-67",
        address: "Av. Faria Lima, 3.000",
        city: "São Paulo",
        state: "SP",
        phone: "(11) 3838-9090",
        email: "nutricao@fitlife.com.br",
        preferredProducts: ["juice"],
      },
      {
        name: "Distribuidora Citrus Nordeste",
        cnpj: "89.012.345/0001-78",
        address: "Av. Tancredo Neves, 450",
        city: "Salvador",
        state: "BA",
        phone: "(71) 3271-9900",
        email: "comercial@citrusnordeste.com",
        preferredProducts: ["juice", "fruit", "byproduct"],
      },
      {
        name: "Lanchonete Estação Verão",
        cnpj: "90.123.456/0001-89",
        address: "Rua das Flores, 88",
        city: "Florianópolis",
        state: "SC",
        phone: "(48) 3025-1100",
        email: "estacaoverao@gmail.com",
        preferredProducts: ["juice"],
      },
      {
        name: "Fazenda Bom Retiro Ração",
        cnpj: "01.234.567/0001-90",
        address: "Estrada Vicinal, km 12",
        city: "Limeira",
        state: "SP",
        phone: "(19) 3441-2200",
        email: "compras@fazendabomretiro.com.br",
        preferredProducts: ["byproduct"],
      },
    ])
    .returning();
  return rows;
}

async function seedRawMaterials() {
  console.log("→ Criando recebimentos de matéria-prima...");
  const responsibles = ["Carlos Mendes", "Joana Lima", "Ricardo Alves", "Pedro Souza"];
  const suppliers = [
    { name: "Citrus Tropical SA", origin: "Bebedouro - SP" },
    { name: "Pomar São Bento", origin: "Limeira - SP" },
    { name: "Cooperativa Citrícola Norte", origin: "Itápolis - SP" },
    { name: "Fazenda Sol Nascente", origin: "Araraquara - SP" },
  ];
  const values = Array.from({ length: 10 }, (_, i) => {
    const sup = suppliers[i % suppliers.length]!;
    const day = 28 - i * 2;
    const isPera = i % 2 === 0;
    const quality = (i % 3 === 0 ? "premium" : i % 3 === 1 ? "standard" : "economy") as
      | "premium"
      | "standard"
      | "economy";
    return {
      name: isPera ? "Laranja Pera" : "Laranja Lima",
      supplier: sup.name,
      quantityKg: 1500 + i * 320,
      pricePerKg: 1.85 + (i % 4) * 0.12,
      origin: sup.origin,
      quality,
      brixLevel: 10.5 + (i % 5) * 0.3,
      notes: i === 3 ? "Carga aprovada com ressalvas: leve marca em 5% das frutas." : null,
      invoiceNumber: `NF-${pad(2026000 + i + 1, 7)}`,
      responsible: responsibles[i % responsibles.length]!,
      status: (i === 9 ? "pending" : "received") as "pending" | "received" | "rejected",
      entryDate: daysAgo(day, 7 + (i % 6), (i * 13) % 60),
    };
  });
  const rows = await db.insert(rawMaterialsTable).values(values).returning();
  return rows;
}

async function seedProductionLots(products: { id: number; name: string; unit: string }[], rawMaterials: { id: number }[]) {
  console.log("→ Criando lotes de produção...");
  const responsibles = ["Mariana Oliveira", "Felipe Costa", "Ana Beatriz", "Roberto Tavares"];
  const shifts: Array<"morning" | "afternoon" | "night"> = ["morning", "afternoon", "night"];
  const juiceProducts = products.filter(p => p.name.toLowerCase().includes("suco"));
  const fruitProducts = products.filter(p => p.name.toLowerCase().includes("caixa"));

  const values: Array<typeof productionLotsTable.$inferInsert> = [];
  for (let i = 0; i < 14; i++) {
    const isJuice = i % 5 !== 0;
    const product = isJuice ? juiceProducts[i % juiceProducts.length]! : fruitProducts[i % fruitProducts.length]!;
    const day = 26 - i * 2;
    let status: "pending" | "in_production" | "finished" | "quality_approved" | "quality_rejected";
    let qualityStatus: "pending" | "approved" | "rejected";
    if (i < 2) {
      status = "in_production";
      qualityStatus = "pending";
    } else if (i === 2) {
      status = "pending";
      qualityStatus = "pending";
    } else if (i === 5) {
      status = "quality_rejected";
      qualityStatus = "rejected";
    } else {
      status = "quality_approved";
      qualityStatus = "approved";
    }
    const producedDate = daysAgo(day, 8 + (i % 8), 0);
    values.push({
      lotCode: `LOT-${pad(100 + i)}`,
      productId: product.id,
      rawMaterialId: rawMaterials[i % rawMaterials.length]!.id,
      quantityProduced: isJuice ? 380 + (i % 6) * 45 : 28 + (i % 4) * 6,
      unit: product.unit,
      status,
      qualityStatus,
      brixLevel: 10.8 + (i % 6) * 0.25,
      temperature: 4.0 + (i % 3) * 0.4,
      qualityNotes:
        status === "quality_rejected"
          ? "Brix abaixo do mínimo aceitável. Lote redirecionado para subproduto."
          : status === "quality_approved"
            ? "Análise sensorial dentro do padrão. Liberado para distribuição."
            : null,
      shift: shifts[i % shifts.length]!,
      responsible: responsibles[i % responsibles.length]!,
      expiresAt: daysFromNow(15 - (i % 4), 23, 59),
      producedAt: producedDate,
    });
  }
  const rows = await db.insert(productionLotsTable).values(values).returning();
  return rows;
}

async function seedInventory(lots: typeof productionLotsTable.$inferSelect[]) {
  console.log("→ Criando itens de estoque a partir dos lotes aprovados...");
  const approvedLots = lots.filter(l => l.qualityStatus === "approved");
  const values = approvedLots.map((lot, i) => ({
    productId: lot.productId,
    lotCode: lot.lotCode,
    quantity: lot.quantityProduced * (i % 3 === 0 ? 0.6 : 1),
    unit: lot.unit,
    status: (i % 7 === 0 ? "reserved" : "available") as "available" | "reserved" | "depleted" | "discarded",
    expiryDate: lot.expiresAt ? lot.expiresAt.toISOString().slice(0, 10) : null,
  }));
  const items = await db.insert(inventoryItemsTable).values(values).returning();

  await db.insert(inventoryMovementsTable).values(
    items.map(item => ({
      type: "entry" as const,
      productId: item.productId,
      lotCode: item.lotCode,
      quantity: item.quantity,
      unit: item.unit,
      reason: "Entrada por aprovação de qualidade",
      inventoryItemId: item.id,
    })),
  );
  return items;
}

async function seedOrders(customers: { id: number }[], products: { id: number; pricePerUnit: number; unit: string; type: string }[]) {
  console.log("→ Criando pedidos...");
  const responsibles = ["Patrícia Nunes", "Lucas Almeida", "Gabriela Reis", "Eduardo Pires"];
  const paymentTypes: Array<"cash" | "card" | "pix" | "promissory"> = ["cash", "card", "pix", "promissory"];
  const statuses: Array<{ status: "pending" | "in_production" | "ready" | "delivered" | "cancelled"; weight: number }> = [
    { status: "delivered", weight: 8 },
    { status: "in_production", weight: 3 },
    { status: "ready", weight: 2 },
    { status: "pending", weight: 2 },
    { status: "cancelled", weight: 1 },
  ];
  const flatStatuses = statuses.flatMap(s => Array(s.weight).fill(s.status)) as Array<
    "pending" | "in_production" | "ready" | "delivered" | "cancelled"
  >;

  const values: Array<typeof ordersTable.$inferInsert> = [];
  for (let i = 0; i < 18; i++) {
    const customer = customers[i % customers.length]!;
    const product = products[i % products.length]!;
    const status = flatStatuses[i % flatStatuses.length]!;
    const quantity = product.unit === "box" ? 5 + (i % 8) : product.unit === "kg" ? 20 + (i % 6) * 10 : 24 + (i % 6) * 12;
    const totalPrice = +(quantity * product.pricePerUnit).toFixed(2);
    const paymentType = paymentTypes[i % paymentTypes.length]!;
    const paymentStatus = (status === "delivered" ? "paid" : status === "cancelled" ? "pending" : i % 4 === 0 ? "partial" : "pending") as
      | "pending"
      | "paid"
      | "partial";
    const amountPaid = paymentStatus === "paid" ? totalPrice : paymentStatus === "partial" ? +(totalPrice * 0.5).toFixed(2) : 0;
    const day = 25 - i;
    values.push({
      orderNumber: `PED-${pad(2026000 + i + 1, 7)}`,
      customerId: customer.id,
      productId: product.id,
      quantity,
      totalPrice,
      paymentType,
      paymentStatus,
      amountPaid,
      fulfillmentSource: i % 3 === 0 ? "production" : "stock",
      status,
      deliveryType: i % 4 === 0 ? "pickup" : "delivery",
      deliveryAddress: i % 4 === 0 ? null : `Endereço de entrega do cliente #${customer.id}`,
      scheduledAt: daysFromNow(2 + (i % 5), 10, 0),
      notes: i === 4 ? "Cliente solicitou entrega antes das 10h." : null,
      responsible: responsibles[i % responsibles.length]!,
      createdAt: daysAgo(day, 9 + (i % 8), (i * 7) % 60),
    });
  }
  const rows = await db.insert(ordersTable).values(values).returning();
  return rows;
}

async function seedDeliveries(orders: typeof ordersTable.$inferSelect[]) {
  console.log("→ Criando entregadores e entregas...");
  const deliverers = await db
    .insert(deliverersTable)
    .values([
      { name: "André Ribeiro", phone: "(11) 99812-3344", email: "andre@orangetrack.com" },
      { name: "Marcos Pereira", phone: "(11) 99765-4321", email: "marcos@orangetrack.com" },
      { name: "Júlio Tavares", phone: "(11) 99888-1100", email: "julio@orangetrack.com" },
    ])
    .returning();

  const deliverableOrders = orders.filter(o => o.deliveryType === "delivery" && o.status !== "cancelled");
  const values = deliverableOrders.map((order, i) => {
    let status: "pending" | "in_transit" | "delivered" | "failed";
    let deliveredAt: Date | null = null;
    if (order.status === "delivered") {
      status = "delivered";
      deliveredAt = order.scheduledAt ?? new Date();
    } else if (order.status === "ready") {
      status = "in_transit";
    } else {
      status = "pending";
    }
    return {
      orderId: order.id,
      delivererId: deliverers[i % deliverers.length]!.id,
      status,
      scheduledAt: order.scheduledAt,
      deliveredAt,
      notes: status === "delivered" ? "Entrega concluída sem ocorrências." : null,
    };
  });
  if (values.length > 0) {
    await db.insert(deliveriesTable).values(values);
  }
}

async function seedQualityAlerts(lots: typeof productionLotsTable.$inferSelect[]) {
  console.log("→ Criando alertas de qualidade...");
  const rejected = lots.filter(l => l.qualityStatus === "rejected");
  const values: Array<typeof qualityAlertsTable.$inferInsert> = [];
  rejected.forEach(lot => {
    values.push({
      type: "quality_rejected",
      message: `Lote ${lot.lotCode} reprovado no controle de qualidade.`,
      lotCode: lot.lotCode,
      severity: "high",
    });
  });
  values.push({
    type: "brix",
    message: "Lote LOT-104 com nível de Brix limítrofe (10,2°Bx).",
    lotCode: "LOT-104",
    severity: "medium",
  });
  values.push({
    type: "temperature",
    message: "Câmara fria #2 registrou variação de temperatura de 6,2°C às 03h12.",
    lotCode: "LOT-103",
    severity: "low",
  });
  if (values.length > 0) {
    await db.insert(qualityAlertsTable).values(values);
  }
}

async function main() {
  console.log("🌱 Iniciando seed do OrangeTrack...\n");
  await reset();
  const products = await seedProducts();
  const customers = await seedCustomers();
  const rawMaterials = await seedRawMaterials();
  const lots = await seedProductionLots(products, rawMaterials);
  await seedInventory(lots);
  const orders = await seedOrders(customers, products);
  await seedDeliveries(orders);
  await seedQualityAlerts(lots);
  console.log("\n✅ Seed concluído com sucesso!");
  console.log(`   ${products.length} produtos · ${customers.length} clientes · ${rawMaterials.length} recebimentos`);
  console.log(`   ${lots.length} lotes de produção · ${orders.length} pedidos`);
  await pool.end();
}

main().catch(async err => {
  console.error("❌ Erro durante o seed:", err);
  await pool.end();
  process.exit(1);
});
