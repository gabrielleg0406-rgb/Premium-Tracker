import { Router } from "express";
import { db, rawMaterialsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { CreateRawMaterialBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const materials = await db.select().from(rawMaterialsTable).orderBy(desc(rawMaterialsTable.entryDate));
  res.json(materials);
});

router.post("/", async (req, res) => {
  const body = CreateRawMaterialBody.parse(req.body);
  const [material] = await db.insert(rawMaterialsTable).values(body).returning();
  res.status(201).json(material);
});

export default router;
