import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart(),
    react(),
  ],
  test: {
    coverage: {
      provider: "v8",
      // Written to apps/*/coverage, which turbo.json's test task declares as
      // its output and .gitignore already excludes.
      reportsDirectory: "./coverage",
      reporter: ["text", "lcov"],
    },
  },
});
