import { describe, expect, it } from "vitest";
import { buildSandboxSrcDoc } from "./sandbox";

describe("buildSandboxSrcDoc", () => {
  it("inlines html/css/js into one document", () => {
    const doc = buildSandboxSrcDoc({ html: "<p>hi</p>", css: "p { color: red; }", js: "console.log(1)" });
    expect(doc).toContain("<p>hi</p>");
    expect(doc).toContain("p { color: red; }");
    expect(doc).toContain("console.log(1)");
  });

  it("escapes a literal </script> inside host js so it can't early-close the tag", () => {
    const doc = buildSandboxSrcDoc({ html: "", css: "", js: "const s = '</script>'; alert(s);" });
    // The escaped form must appear; the raw closing sequence must not
    // appear anywhere except the one real closing tag this function itself
    // adds at the end of the document.
    expect(doc).toContain("<\\/script>");
    const rawOccurrences = doc.split("</script>").length - 1;
    expect(rawOccurrences).toBe(1);
  });

  it("escapes a literal </style> inside host css", () => {
    const doc = buildSandboxSrcDoc({ html: "", css: "/* </style> */", js: "" });
    expect(doc).toContain("<\\/style>");
    const rawOccurrences = doc.split("</style>").length - 1;
    expect(rawOccurrences).toBe(1);
  });

  it("stamps the given nonce onto the inline script tag", () => {
    const doc = buildSandboxSrcDoc({ html: "", css: "", js: "1" }, "abc123");
    expect(doc).toContain('<script nonce="abc123">');
  });

  it("omits the nonce attribute when none is given", () => {
    const doc = buildSandboxSrcDoc({ html: "", css: "", js: "1" });
    expect(doc).toContain("<script>");
    expect(doc).not.toContain("nonce=");
  });
});
