import { apiRequest, toQueryString } from "./api";
import { getBrowserTimeZone } from "../utils/dateUtils";

function withTimeZone(params) {
  return { tz: getBrowserTimeZone(), ...params };
}

export async function getSummary(params = {}) {
  const data = await apiRequest(`/metrics/summary${toQueryString(params)}`);
  return data.summary;
}

export async function getActivity(params = {}) {
  const data = await apiRequest(`/metrics/activity-heatmap${toQueryString(withTimeZone(params))}`);
  return data.activity;
}

export function getExerciseProgress(exerciseId, params = {}) {
  return apiRequest(`/metrics/exercise-progress${toQueryString({ exerciseId, ...params })}`);
}

export async function getMuscleGroupVolume(params = {}) {
  const data = await apiRequest(`/metrics/muscle-group-volume${toQueryString(params)}`);
  return data.muscleGroups;
}

/** Cumplimiento de planes: sesiones programadas vs. realizadas. */
export async function getProgramAdherence(trainingProgramId) {
  const data = await apiRequest(
    `/metrics/program-adherence${toQueryString({ trainingProgramId })}`,
  );
  return data.programs;
}
