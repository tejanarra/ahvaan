import { describe, expect, it, vi } from "vitest";
import { parsePageSchema } from "./page-schema";

describe("parsePageSchema", () => {
  it("returns null for garbage input", () => {
    expect(parsePageSchema(null)).toBeNull();
    expect(parsePageSchema(undefined)).toBeNull();
    expect(parsePageSchema("not an object")).toBeNull();
    expect(parsePageSchema({})).toBeNull();
    expect(parsePageSchema({ version: 1, blocks: "not-an-array" })).toBeNull();
  });

  it("drops an individual invalid block instead of failing the whole page", () => {
    // This is the exact scenario doc-03's Phase 0 gate calls out: "a
    // corrupt page_schema (hand-set one block's type to 'nope' in SQL)
    // renders the page minus that block — no crash."
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = parsePageSchema({
      version: 1,
      blocks: [
        { id: "a", type: "hero", config: {} },
        { id: "b", type: "nope", config: {} }, // unrecognized type
        { id: "c", type: "text", config: {} },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.blocks.map((b) => b.id)).toEqual(["a", "c"]);
  });

  it("returns null when every block is invalid", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = parsePageSchema({ version: 1, blocks: [{ id: "a", type: "nope", config: {} }] });
    expect(result).toBeNull();
  });

  it("accepts an intentionally empty blocks array", () => {
    // A host deleting every block on the page is a valid, saveable state —
    // distinct from "every block present failed validation" above, which
    // should still fall back to null.
    const result = parsePageSchema({ version: 1, blocks: [] });
    expect(result).not.toBeNull();
    expect(result?.blocks).toEqual([]);
  });

  it("rejects nesting past the depth cap without throwing", () => {
    // 9 levels deep — one past MAX_CONTAINER_DEPTH (8). The schema forces
    // `children` to `undefined` past the cap, so a container this deep
    // fails validation and the whole (now-empty) page falls back to null
    // rather than the parser recursing further or throwing — the actual
    // DoS-prevention behavior this cap exists for.
    let node: Record<string, unknown> = { id: "leaf", type: "text", config: {} };
    for (let i = 0; i < 9; i++) {
      node = { id: `container-${i}`, type: "container", config: {}, children: [node] };
    }
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => parsePageSchema({ version: 1, blocks: [node] })).not.toThrow();
    expect(parsePageSchema({ version: 1, blocks: [node] })).toBeNull();
  });

  it("accepts nesting within the depth cap", () => {
    // 8 levels deep — exactly at MAX_CONTAINER_DEPTH — must still parse.
    let node: Record<string, unknown> = { id: "leaf", type: "text", config: {} };
    for (let i = 0; i < 8; i++) {
      node = { id: `container-${i}`, type: "container", config: {}, children: [node] };
    }
    const result = parsePageSchema({ version: 1, blocks: [node] });
    expect(result).not.toBeNull();
    expect(result?.blocks).toHaveLength(1);
  });

  it("preserves valid page-level fields alongside blocks", () => {
    const result = parsePageSchema({
      version: 1,
      blocks: [{ id: "a", type: "hero", config: {} }],
      pageStyle: "background: red;",
      fontFamily: "Inter",
    });
    expect(result?.pageStyle).toBe("background: red;");
    expect(result?.fontFamily).toBe("Inter");
  });
});
