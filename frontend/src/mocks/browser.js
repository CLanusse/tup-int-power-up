import { setupWorker } from "msw/browser";
import { getDb } from "./data/db";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

/**
 * Inicia la API simulada: un Service Worker intercepta las requests a /api y
 * las responde desde los handlers, sin backend. Las requests se ven en la
 * pestaña Network de las DevTools como si hubiera un servidor real.
 */
export async function startMockApi() {
  getDb(); // crea (o recupera) la base simulada antes de la primera request
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest: "bypass",
    quiet: import.meta.env.PROD,
  });
}
