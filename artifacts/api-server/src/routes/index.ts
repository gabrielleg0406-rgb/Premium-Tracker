import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import productsRouter from "./products";
import ordersRouter from "./orders";
import inventoryRouter from "./inventory";
import productionRouter from "./production";
import rawMaterialsRouter from "./rawMaterials";
import deliveriesRouter from "./deliveries";
import traceabilityRouter from "./traceability";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/customers", customersRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/inventory", inventoryRouter);
router.use("/production", productionRouter);
router.use("/raw-materials", rawMaterialsRouter);
router.use("/deliveries", deliveriesRouter);
router.use("/traceability", traceabilityRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);

export default router;
