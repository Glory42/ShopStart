import { defineConfig, env } from "prisma/config";

// prisma.config.ts is evaluated before the CLI loads .env itself, so load it
// explicitly — this is what makes env("DATABASE_URL") below resolvable.
try {
  process.loadEnvFile();
} catch {
  // no .env file present (e.g. in CI, where DATABASE_URL is set directly) — fine.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
