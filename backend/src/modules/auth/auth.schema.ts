import { z } from "zod";

// Zod validates SHAPE (right type, right format, sane length) at the route
// boundary — auth.service.ts still owns business rules (duplicate email,
// password matching) that no schema can express. The two layers aren't
// redundant: this one rejects "not even a real request" before it reaches
// business logic at all.

export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, { error: "Name is required" })
    .max(100),
  // trim/lowercase BEFORE the .email() format check runs — chaining them
  // the other way around (z.email().trim()) validates the format against
  // the raw, untrimmed input, so "  a@b.com  " would fail as malformed
  // instead of being normalized first.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address" })),
  // max(72): bcrypt silently truncates/ignores input past 72 bytes — capping
  // here means the error is a clear 400, not a password that "works" at
  // signup but truncates differently than expected.
  password: z.string().min(8, { error: "Password must be at least 8 characters" }).max(72),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address" })),
  password: z.string().min(1, { error: "Password is required" }),
});
