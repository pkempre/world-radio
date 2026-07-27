import { Router, type IRouter } from "express";
import healthRouter from "./health";
import radioRouter from "./radio";
import stripeRouter from "./stripe";
import youtubeRouter from "./youtube";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/radio", radioRouter);
router.use("/stripe", stripeRouter);
router.use("/youtube", youtubeRouter);

export default router;
