import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Without `test.globals: true` in vitest.config.ts, @testing-library/react's
// automatic per-test DOM cleanup never registers, so unmounted components
// from earlier tests in the same file linger in jsdom's document.
afterEach(cleanup);

// jsdom doesn't implement scrollTo; TanStack Router's scroll-restoration
// feature calls it on every navigation, which otherwise logs a jsdom
// "not implemented" error on every router-based test.
window.scrollTo = () => {};
