import { describe, expect, it } from "vitest";
import { authCallbackUrl, authErrorMessages, safeReturnPath } from "@/lib/auth";

describe("safeReturnPath", () => {
  it("keeps an in-app path and its query string", () => {
    expect(safeReturnPath("/settings?revoke=google")).toBe("/settings?revoke=google");
  });

  it("rejects external, protocol-relative, and malformed destinations", () => {
    expect(safeReturnPath("https://attacker.example")).toBe("/");
    expect(safeReturnPath("//attacker.example")).toBe("/");
    expect(safeReturnPath("/%E0%A4%A")).toBe("/");
  });
});

describe("auth callback helpers", () => {
  it("creates a callback URL with only safe destinations", () => {
    expect(authCallbackUrl("https://app.example", "/auth/reset")).toBe(
      "https://app.example/auth/callback?next=%2Fauth%2Freset",
    );
    expect(authCallbackUrl("https://app.example", "https://attacker.example")).toBe(
      "https://app.example/auth/callback",
    );
  });

  it("keeps callback errors generic", () => {
    expect(authErrorMessages.invalid_link).not.toContain("Supabase");
  });
});
