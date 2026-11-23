import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

// Margen para pantallas que se cargan en diferido (por ejemplo Progreso con Chart.js).
configure({ asyncUtilTimeout: 3000 });

// Toda request no contemplada por un handler hace fallar el test.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  vi.restoreAllMocks();
});

afterAll(() => server.close());
