import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount any rendered trees between tests so DOM state never leaks across cases.
afterEach(() => {
  cleanup();
});
