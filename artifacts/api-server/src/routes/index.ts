import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appointmentsRouter from "./salon/appointments";
import reviewsRouter from "./salon/reviews";
import usersRouter from "./salon/users";
import chatRouter from "./chat/index";
import stripeRouter from "./stripe";
import siteContentRouter from "./salon/site-content";
import contactMessagesRouter from "./salon/contact-messages";
import adisyonlarRouter from "./salon/adisyonlar";
import transactionsRouter from "./salon/transactions";
import inventoryRouter from "./salon/inventory";
import stockMovementsRouter from "./salon/stock-movements";
import staffUsersRouter from "./salon/staff-users";
import workEntriesRouter from "./salon/work-entries";
import siteUsersRouter from "./salon/site-users";
import smsNotificationsRouter from "./salon/sms-notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/appointments", appointmentsRouter);
router.use("/reviews", reviewsRouter);
router.use("/users", usersRouter);
router.use("/chat", chatRouter);
router.use("/stripe", stripeRouter);
router.use("/site-content", siteContentRouter);
router.use("/contact-messages", contactMessagesRouter);
router.use("/adisyonlar", adisyonlarRouter);
router.use("/transactions", transactionsRouter);
router.use("/inventory", inventoryRouter);
router.use("/stock-movements", stockMovementsRouter);
router.use("/staff-users", staffUsersRouter);
router.use("/work-entries", workEntriesRouter);
router.use("/site-users", siteUsersRouter);
router.use("/sms-notifications", smsNotificationsRouter);

export default router;
