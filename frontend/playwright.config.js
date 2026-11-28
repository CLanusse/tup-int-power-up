import { defineConfig, devices } from "@playwright/test";

/**
 * Tests end-to-end del prototipo: levantan solo el frontend con Vite. La API la
 * responde el mock (MSW) dentro del navegador, sin backend ni base de datos.
 *
 * Cada test usa un contexto de navegador nuevo, así que parte de los datos
 * iniciales (cuenta demo, admin y catálogo).
 */
const WEB_PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: "on-first-retry",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    // El Service Worker de MSW debe poder interceptar las requests.
    serviceWorkers: "allow",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
    url: `http://127.0.0.1:${WEB_PORT}`,
    env: { VITE_USE_MOCK_API: "true", VITE_MOCK_DELAY: "50" },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
