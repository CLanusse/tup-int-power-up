import { apiRequest, jsonBody } from "./api";

export async function getExercises() {
  const data = await apiRequest("/exercises");
  return data.exercises;
}

export async function createExercise(payload) {
  const data = await apiRequest("/exercises", { method: "POST", body: jsonBody(payload) });
  return data.exercise;
}

export async function updateExercise(id, payload) {
  const data = await apiRequest(`/exercises/${id}`, { method: "PUT", body: jsonBody(payload) });
  return data.exercise;
}

export function deleteExercise(id) {
  return apiRequest(`/exercises/${id}`, { method: "DELETE" });
}

export async function getMuscleGroups() {
  const data = await apiRequest("/muscle-groups");
  return data.muscleGroups;
}

export async function createMuscleGroup(payload) {
  const data = await apiRequest("/muscle-groups", { method: "POST", body: jsonBody(payload) });
  return data.muscleGroup;
}

export async function updateMuscleGroup(id, payload) {
  const data = await apiRequest(`/muscle-groups/${id}`, { method: "PUT", body: jsonBody(payload) });
  return data.muscleGroup;
}

export function deleteMuscleGroup(id) {
  return apiRequest(`/muscle-groups/${id}`, { method: "DELETE" });
}
