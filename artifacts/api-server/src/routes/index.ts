import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appointmentsRouter from "./salon/appointments";
import reviewsRouter from "./salon/reviews";
import usersRouter from "./salon/users";
import chatRouter from "./chat/index";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/appointments", appointmentsRouter);
router.use("/reviews", reviewsRouter);
router.use("/users", usersRouter);
router.use("/chat", chatRouter);
router.use("/stripe", stripeRouter);

export default router;
