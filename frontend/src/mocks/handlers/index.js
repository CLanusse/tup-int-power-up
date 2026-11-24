import { http } from "msw";
import { json, route } from "../http";
import { authHandlers, userHandlers } from "./auth";
import { catalogHandlers } from "./catalog";
import { planningHandlers } from "./planning";
import { routineHandlers } from "./routines";
import { workoutHandlers } from "./workouts";

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...catalogHandlers,
  ...routineHandlers,
  ...planningHandlers,
  ...workoutHandlers,

  // Cualquier otra ruta de la API responde 404, como el backend.
  http.all(
    "*/api/*",
    route(
      ({ request }) =>
        json({ error: "Ruta no encontrada", path: new URL(request.url).pathname }, 404),
      { auth: false },
    ),
  ),
];
