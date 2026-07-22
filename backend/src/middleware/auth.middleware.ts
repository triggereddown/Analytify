import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

// TEACHING NOTE — describing the JWT payload shape:
// jsonwebtoken's `verify()` returns `string | JwtPayload` by default
// (it's generic over what you signed). We know our own tokens only ever
// contain `{ id, tier }` (see auth.service.ts signToken), so we describe
// that shape here and assert it after verifying — safe because WE control
// what gets signed elsewhere in this codebase.
interface AccessTokenPayload {
  id: string;
  tier: "free" | "premium";
}

/**
 * Verifies the Authorization: Bearer <token> header and attaches
 * req.user = { id } for downstream handlers. See src/types/express.d.ts
 * for where `req.user` is declared on the Request type.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AccessTokenPayload;
    req.user = { id: decoded.id };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
