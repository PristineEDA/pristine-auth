import { describe, it, expect } from "vitest";
import { validateRedirectTo } from "@/lib/redirect";

describe("validateRedirectTo", () => {
  it("returns default when null", () => {
    expect(validateRedirectTo(null)).toBe("pristine://auth-callback");
  });

  it("allows pristine:// protocol", () => {
    expect(validateRedirectTo("pristine://auth-callback")).toBe(
      "pristine://auth-callback"
    );
  });

  it("allows pristine:// with path", () => {
    expect(validateRedirectTo("pristine://auth-callback?foo=bar")).toBe(
      "pristine://auth-callback?foo=bar"
    );
  });

  it("rejects http:// protocol", () => {
    expect(validateRedirectTo("http://evil.com")).toBe(
      "pristine://auth-callback"
    );
  });

  it("rejects https:// protocol", () => {
    expect(validateRedirectTo("https://evil.com/callback")).toBe(
      "pristine://auth-callback"
    );
  });

  it("rejects javascript: protocol", () => {
    expect(validateRedirectTo("javascript:alert(1)")).toBe(
      "pristine://auth-callback"
    );
  });

  it("rejects empty string", () => {
    expect(validateRedirectTo("")).toBe("pristine://auth-callback");
  });
});
