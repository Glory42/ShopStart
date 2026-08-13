import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * e2e tests boot the real AppModule, which validates process.env via
 * envSchema (see infrastructure/config/env.validation.ts) — so env vars must
 * be set before any app code loads. No `dotenv` dependency needed for
 * something this small; just parse KEY=VALUE lines.
 */
const envPath = join(__dirname, "..", ".env.test");
const contents = readFileSync(envPath, "utf-8");

for (const line of contents.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
  process.env[key] = value;
}
