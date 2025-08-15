import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: "automatic",
    jsxDev: true,
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    coverage: {
      reporter: ["text", "html", "json"],
      provider: "v8",
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "**/*.test.{js,ts,tsx}",
        "src/integrations/**",
        "supabase/migrations/**",
      ],
    },
    include: ["tests/**/*.{test,spec}.{js,ts,tsx}"],
    exclude: ["node_modules/**", "dist/**"],
  },
});
