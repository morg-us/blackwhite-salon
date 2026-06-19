import { Router } from "express";
import { stripeStorage } from "../stripeStorage";
import { getUncachableStripeClient } from "../stripeClient";
import { getAuth } from "@clerk/express";

const router = Router();

// List products with prices (for the store)
router.get("/products", async (_req, res) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices();
    const productsMap = new Map<string, {
      id: string; name: string; description: string; active: boolean;
      metadata: Record<string, string>; images: string[]; prices: {
        id: string; unit_amount: number; currency: string; recurring: unknown; active: boolean;
      }[];
    }>();
    for (const row of rows) {
      const pid = row.product_id as string;
      if (!productsMap.has(pid)) {
        productsMap.set(pid, {
          id: pid,
          name: row.product_name as string,
          description: row.product_description as string,
          active: row.product_active as boolean,
          metadata: (row.product_metadata as Record<string, string>) ?? {},
          images: (row.product_images as string[]) ?? [],
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(pid)!.prices.push({
          id: row.price_id as string,
          unit_amount: row.unit_amount as number,
          currency: row.currency as string,
          recurring: row.recurring,
          active: row.price_active as boolean,
        });
      }
    }
    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: unknown) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

// Create checkout session for a cart
router.post("/checkout", async (req, res) => {
  try {
    const { lineItems, successUrl, cancelUrl } = req.body as {
      lineItems: { price: string; quantity: number }[];
      successUrl: string;
      cancelUrl: string;
    };

    if (!lineItems?.length) {
      return res.status(400).json({ error: "lineItems required" });
    }

    const { userId } = getAuth(req);
    const stripe = await getUncachableStripeClient();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl || `${req.protocol}://${req.get("host")}/?checkout=success`,
      cancel_url: cancelUrl || `${req.protocol}://${req.get("host")}/?checkout=cancel`,
      metadata: userId ? { userId } : undefined,
    });

    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Checkout failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
