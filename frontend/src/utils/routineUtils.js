import { hydrateRoutineLines, serializeRoutineLines } from "./exerciseLineUtils";

export const EMPTY_ROUTINE = {
  nombre: "",
  descripcion: "",
  tipo: "",
  grupoMuscularEtiqueta: "",
  dificultad: "",
  tiempoEstimado: "",
  global: false,
};

export function routineToForm(routine) {
  return {
    nombre: routine.nombre,
    descripcion: routine.descripcion || "",
    tipo: routine.tipo || "",
    grupoMuscularEtiqueta: routine.grupoMuscularEtiqueta || "",
    dificultad: routine.dificultad || "",
    tiempoEstimado: routine.tiempoEstimado ?? "",
    global: routine.userId === null,
  };
}

/**
 * Datos de la rutina + ejercicios para enviar en una sola solicitud.
 * "global" solo se envía al crear (no se puede cambiar el ámbito de una rutina existente).
 */
export function routineFormToPayload(form, lines, { creating = false } = {}) {
  const payload = {
    nombre: form.nombre,
    descripcion: form.descripcion,
    tipo: form.tipo,
    grupoMuscularEtiqueta: form.grupoMuscularEtiqueta,
    dificultad: form.dificultad,
    tiempoEstimado: form.tiempoEstimado === "" ? null : Number(form.tiempoEstimado),
    ejercicios: serializeRoutineLines(lines),
  };

  if (creating && form.global) payload.global = true;
  return payload;
}

export function routineLinesToForm(routine) {
  return hydrateRoutineLines(routine?.workoutTemplateExercises || []);
}
