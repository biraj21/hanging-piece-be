import { fromNodeHeaders } from "better-auth/node";
import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import { auth } from "#src/config/auth";
import { requireAuth, type AuthenticatedRequest } from "#src/middlewares/auth";

const router = Router();

const updateProfileSchema = z.object({
  chesscomId: z.string().nullable().optional(),
  lichessId: z.string().nullable().optional(),
});

router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const authenticatedReq = req as AuthenticatedRequest;

    // Update user using Better Auth API
    const updatedUser = await auth.api.updateUser({
      headers: fromNodeHeaders(req.headers),
      body: {
        name: authenticatedReq.auth.user.name,
        ...body,
      },
    });

    if (!updatedUser) {
      return res.status(400).json({ error: "Failed to update user" });
    }

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request body", details: error.issues });
    }
    console.error("Error updating user profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
