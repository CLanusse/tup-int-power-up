import { apiRequest, jsonBody, toQueryString } from "./api";

/** Devuelve { workouts, pagination }. */
export function getWorkouts(params = {}) {
  return apiRequest(`/workouts${toQueryString(params)}`);
}

export async function getWorkout(id) {
  const data = await apiRequest(`/workouts/${id}`);
  return data.workout;
}

export async function createWorkout(payload) {
  const data = await apiRequest("/workouts", { method: "POST", body: jsonBody(payload) });
  return data.workout;
}

export async function updateWorkout(id, payload) {
  const data = await apiRequest(`/workouts/${id}`, { method: "PUT", body: jsonBody(payload) });
  return data.workout;
}

export function deleteWorkout(id) {
  return apiRequest(`/workouts/${id}`, { method: "DELETE" });
}
