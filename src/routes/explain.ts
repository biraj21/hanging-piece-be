import { Router, type Request, type Response } from "express";

import {
  explainRequestSchema,
  generateExplanation,
} from "#src/helpers/explain";
import { requireAuth } from "#src/middlewares/auth";

const router = Router();

const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_MS = 15 * 60 * 1000;

router.post("/explain", requireAuth, async (req: Request, res: Response) => {
  const parsed = explainRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid payload", details: parsed.error.issues });
  }

  try {
    const output = await generateExplanation(parsed.data);
    return res.status(200).json(output);
  } catch (err) {
    console.error("Explain route error", err);
    return res.status(500).json({ error: "Failed to generate explanation" });
  }
});

router.post("/explain/try", async (req: Request, res: Response) => {
  const clientIp = req.ip || "unknown";
  const now = Date.now();
  const lastRequest = rateLimitCache.get(clientIp);

  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    const remainingMs = RATE_LIMIT_MS - (now - lastRequest);
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return res.status(429).json({
      error: "Rate limit exceeded",
      retryAfterMinutes: remainingMinutes,
    });
  }

  const parsed = explainRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid payload", details: parsed.error.issues });
  }

  try {
    rateLimitCache.set(clientIp, now);
    const output = await generateExplanation(parsed.data);
    return res.status(200).json(output);
  } catch (err) {
    console.error("Explain/try route error", err);
    rateLimitCache.delete(clientIp); // delete cache on error to allow retry
    return res.status(500).json({ error: "Failed to generate explanation" });
  }
});

export default router;
