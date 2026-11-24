import { http } from "msw";
import { json, route } from "../http";
import { authHandlers, userHandlers } from "./auth";
import { catalogHandlers } from "./catalog";
import { metricsHandlers } from "./metrics";
import { planningHandlers } from "./planning";
import { routineHandlers } from "./routines";
import { workoutHandlers } from "./workouts";

/**
 * Todos los endpoints de la API REST de PowerUp, simulados con MSW.
 * Mismo contrato que el backend: rutas, cuerpos, códigos HTTP y mensajes.
 */
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...catalogHandlers,
  ...routineHandlers,
  ...planningHandlers,
  ...workoutHandlers,
  ...metricsHandlers,

  // Cualquier otra ruta de la API responde 404, como el notFoundHandler del backend.
  http.all(
    "*/api/*",
    route(
      ({ request }) =>
        json({ error: "Ruta no encontrada", path: new URL(request.url).pathname }, 404),
      { auth: false },
    ),
  ),
];
