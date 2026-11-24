/**
 * Líneas editables de ejercicios (series de un entrenamiento o ejercicios de una rutina).
 * En el formulario todos los valores son texto; se convierten al enviar.
 */

let lineSequence = 0;

function nextKey() {
  lineSequence += 1;
  return `line-${lineSequence}`;
}

export function createEmptyExerciseLine(overrides = {}) {
  return {
    key: nextKey(),
    exerciseId: "",
    repeticiones: "",
    peso: "",
    rir: "",
    rpe: "",
    ...overrides,
  };
}

export function updateExerciseLine(lines, index, field, value) {
  return lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [field]: value } : line));
}

function toText(value) {
  return value === null || value === undefined ? "" : String(value);
}

/** Convierte series registradas (rir/rpe) en líneas del formulario. */
export function hydrateExerciseLines(sets) {
  return sets.map((set) =>
    createEmptyExerciseLine({
      exerciseId: toText(set.exerciseId),
      repeticiones: toText(set.repeticiones),
      peso: toText(set.peso ?? 0),
      rir: toText(set.rir),
      rpe: toText(set.rpe),
    }),
  );
}

/**
 * Convierte ejercicios planificados de una rutina (rirObjetivo/rpeObjetivo) en líneas.
 * Se usa tanto para editar la rutina como para precargar un entrenamiento.
 */
export function hydrateRoutineLines(routineExercises = []) {
  return routineExercises.map((line) =>
    createEmptyExerciseLine({
      exerciseId: toText(line.exerciseId),
      repeticiones: toText(line.repeticiones),
      peso: toText(line.peso ?? 0),
      rir: toText(line.rirObjetivo),
      rpe: toText(line.rpeObjetivo),
    }),
  );
}

function optionalNumber(value) {
  return value === "" || value === null || value === undefined ? undefined : Number(value);
}

/** Series para POST/PUT /workouts. */
export function serializeExerciseLines(lines) {
  return lines.map((line) => {
    const payload = {
      exerciseId: Number(line.exerciseId),
      repeticiones: Number(line.repeticiones),
      peso: Number(line.peso || 0),
    };

    const rir = optionalNumber(line.rir);
    const rpe = optionalNumber(line.rpe);
    if (rir !== undefined) payload.rir = rir;
    if (rpe !== undefined) payload.rpe = rpe;

    return payload;
  });
}

/** Ejercicios para POST/PUT /workout-templates (el orden es el de la lista). */
export function serializeRoutineLines(lines) {
  return lines
    .filter((line) => line.exerciseId)
    .map((line) => ({
      exerciseId: Number(line.exerciseId),
      repeticiones: Number(line.repeticiones),
      peso: line.peso === "" ? null : Number(line.peso),
      rirObjetivo: optionalNumber(line.rir) ?? null,
      rpeObjetivo: optionalNumber(line.rpe) ?? null,
    }));
}

export function hasIncompleteExerciseLines(lines) {
  return lines.some((line) => !line.exerciseId || !line.repeticiones || line.peso === "");
}

export function moveExerciseLine(lines, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= lines.length) return lines;
  const next = [...lines];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
