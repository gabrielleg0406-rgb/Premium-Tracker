import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateProductBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  res.json(products);
});

router.post("/", async (req, res) => {
  const body = CreateProductBody.parse(req.body);
  const [product] = await db.insert(productsTable).values(body).returning();
  res.status(201).json(product);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = CreateProductBody.parse(req.body);
  const [updated] = await db.update(productsTable).set(body).where(eq(productsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

export default router;
