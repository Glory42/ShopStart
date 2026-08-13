import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Without `test.globals: true` in vitest.config.ts, @testing-library/react's
// automatic per-test DOM cleanup never registers, so unmounted components
// from earlier tests in the same file linger in jsdom's document.
afterEach(cleanup);
