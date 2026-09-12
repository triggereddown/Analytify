import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schema.js";

describe("registerSchema", () => {
  it("accepts a valid payload and trims/lowercases the email", () => {
    const result = registerSchema.safeParse({ name: "Ada", email: "  ADA@Example.com  ", password: "testpass123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("rejects a missing name", () => {
    const result = registerSchema.safeParse({ email: "ada@example.com", password: "testpass123" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    const result = registerSchema.safeParse({ name: "Ada", email: "not-an-email", password: "testpass123" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects a password over bcrypt's 72-byte limit", () => {
    const result = registerSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "a".repeat(73) });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid payload", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});
