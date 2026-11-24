import { apiRequest, jsonBody } from "./api";

/** Las rutinas incluyen sus ejercicios planificados en workoutTemplateExercises. */
export async function getRoutines() {
  const data = await apiRequest("/workout-templates");
  return data.workoutTemplates;
}

export async function getRoutine(id) {
  const data = await apiRequest(`/workout-templates/${id}`);
  return data.workoutTemplate;
}

/** payload.ejercicios reemplaza la lista completa en una sola transacción. */
export async function createRoutine(payload) {
  const data = await apiRequest("/workout-templates", { method: "POST", body: jsonBody(payload) });
  return data.workoutTemplate;
}

export async function updateRoutine(id, payload) {
  const data = await apiRequest(`/workout-templates/${id}`, {
    method: "PUT",
    body: jsonBody(payload),
  });
  return data.workoutTemplate;
}

export function deleteRoutine(id) {
  return apiRequest(`/workout-templates/${id}`, { method: "DELETE" });
}
