import { describe, expect, it } from "vitest";
import { safeImageSrc } from "./safe-url";

describe("safeImageSrc", () => {
  it("allows absolute http(s) URLs", () => {
    expect(safeImageSrc("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
    expect(safeImageSrc("http://example.com/a.jpg")).toBe("http://example.com/a.jpg");
  });

  it("allows same-origin relative paths", () => {
    expect(safeImageSrc("/uploads/a.jpg")).toBe("/uploads/a.jpg");
  });

  it("rejects javascript: and data: schemes", () => {
    expect(safeImageSrc("javascript:alert(1)")).toBeUndefined();
    expect(safeImageSrc("data:text/html,<script>alert(1)</script>")).toBeUndefined();
  });

  it("rejects empty/missing values", () => {
    expect(safeImageSrc("")).toBeUndefined();
    expect(safeImageSrc(null)).toBeUndefined();
    expect(safeImageSrc(undefined)).toBeUndefined();
  });
});
