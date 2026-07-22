// TEACHING NOTE — "declaration merging":
// Express's own `Request` type doesn't have a `user` or `billing` property.
// This file doesn't create a NEW type — it re-opens Express's existing
// `Request` interface and adds fields to it. TypeScript merges interfaces
// with the same name across files automatically. This is the standard way
// to type middleware-attached properties (req.user set by authMiddleware,
// req.billing set by requireTier) without changing Express's own source.
//
// Because this file has no top-level import/export, TS treats it as a
// "global script" rather than a module — that's required for declaration
// merging against a library's types to work.

import type { Billing } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by authMiddleware after verifying the JWT. Only `id` is
       * guaranteed — the token payload is intentionally minimal (see
       * auth.service.ts signToken) so it can't go stale like a full
       * cached user object would.
       */
      user?: {
        id: string;
      };

      /**
       * Set by requireTier middleware after re-checking billing state
       * from the DB. Only present on routes gated by requireTier.
       */
      billing?: Billing | null;
    }
  }
}

// Required for this file to be treated as a module augmentation, not a
// standalone script that happens to declare globals.
export {};
