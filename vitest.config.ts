import { defineConfig } from "vitest/config";
import path from "node:path";

// Deliberately narrow scope: pure-function/unit coverage for the
// correctness-critical logic that doesn't require a live Supabase project
// (schema validation, the sandbox's HTML-generation escaping, safe-URL
// scheme checks, the rate limiter/cache primitives). Tenancy-isolation and
// cache-invalidation integration tests (docs-audit "Missing Tests") need a
// real database and aren't set up here — this is a starting point, not
// full coverage.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
