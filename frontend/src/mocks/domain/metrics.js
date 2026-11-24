/**
 * Cálculos puros de métricas de entrenamiento (mismas fórmulas que el backend).
 */

export const DEFAULT_TIME_ZONE = "UTC";

export function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

/** Volumen de una serie: repeticiones * peso. */
export const calculateSetVolume = (set) => set.repeticiones * set.peso;

export const calculateTotalVolume = (sets) =>
  sets.reduce((total, set) => total + calculateSetVolume(set), 0);

/** 1RM estimado con la fórmula de Epley: peso * (1 + repeticiones / 30). */
export function estimateOneRepMax(set) {
  if (set.repeticiones <= 1) return set.peso;
  return set.peso * (1 + set.repeticiones / 30);
}

export function average(values) {
  if (values.length === 0) return null;
  return round(values.reduce((total, value) => total + value, 0) / values.length);
}

export const presentValues = (values) =>
  values.filter((value) => value !== null && value !== undefined);

export function percentage(part, total) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** Fecha calendario (YYYY-MM-DD) de un instante en una zona horaria. */
export function toDateKey(date, timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Nivel de intensidad de 1 a 4 relativo al día de mayor volumen del período. */
export function intensityLevel(dayVolume, maxVolume, workoutCount) {
  if (maxVolume > 0) return Math.max(1, Math.ceil((dayVolume / maxVolume) * 4));
  return Math.min(workoutCount, 4);
}
