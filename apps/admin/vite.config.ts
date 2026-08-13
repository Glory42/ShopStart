import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  server: { port: 3001 },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackRouter({ routesDirectory: "./src/routes", generatedRouteTree: "./src/routeTree.gen.ts" }),
    react(),
  ],
});
