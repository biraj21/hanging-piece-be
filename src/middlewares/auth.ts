import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";

import { auth } from "#src/config/auth";

// Infer the session type from Better Auth
type SessionData = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface AuthenticatedRequest extends Request {
  auth: NonNullable<SessionData>;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user || !session.session) {
      return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    }

    // Attach user and session to request object
    (req as AuthenticatedRequest).auth = session;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired session" });
  }
}
