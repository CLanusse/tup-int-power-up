export const EMPTY_EXERCISE = {
  nombre: "",
  descripcion: "",
  dificultad: "principiante",
  imagen: "",
  muscleGroupIds: [],
  global: false,
};

export function exerciseToForm(exercise) {
  return {
    nombre: exercise.nombre,
    descripcion: exercise.descripcion || "",
    dificultad: exercise.dificultad || "principiante",
    imagen: exercise.imagen || "",
    muscleGroupIds: (exercise.muscleGroups || []).map((group) => group.id),
    global: exercise.userId === null,
  };
}

/** "global" solo se envía al crear: el ámbito de un ejercicio existente no cambia. */
export function exerciseFormToPayload(form, { creating = false } = {}) {
  const payload = {
    nombre: form.nombre,
    descripcion: form.descripcion,
    dificultad: form.dificultad,
    imagen: form.imagen,
    muscleGroupIds: form.muscleGroupIds,
  };

  if (creating && form.global) payload.global = true;
  return payload;
}

function normalize(text) {
  return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Búsqueda sin distinguir mayúsculas ni acentos ("press" encuentra "Press de banca"). */
export function filterExercises(exercises, search, difficulty, groupId = "") {
  const normalizedSearch = normalize(search.trim());

  return exercises.filter((exercise) => {
    const termMatch =
      normalize(exercise.nombre).includes(normalizedSearch) ||
      normalize(exercise.descripcion).includes(normalizedSearch);
    const groupMatch =
      !groupId || exercise.muscleGroups?.some((group) => group.id === Number(groupId));
    return termMatch && (!difficulty || exercise.dificultad === difficulty) && groupMatch;
  });
}

/** Ejercicios compatibles con un recurso global: solo los globales. */
export function selectableExercises(exercises, onlyGlobal) {
  return onlyGlobal ? exercises.filter((exercise) => exercise.userId === null) : exercises;
}
