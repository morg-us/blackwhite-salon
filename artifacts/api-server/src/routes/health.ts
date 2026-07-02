import { Router, type IRouter } from "express";

const router: IRouter = Router();

const healthBody = { status: "ok" };

router.get("/", (_req, res) => {
  res.json(healthBody);
});

router.get("/healthz", (_req, res) => {
  res.json(healthBody);
});

export default router;
