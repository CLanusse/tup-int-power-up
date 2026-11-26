export function filterExercisesByMuscleGroup(exercises, groupId) {
  if (!groupId) return exercises;
  return exercises.filter((exercise) =>
    exercise.muscleGroups?.some((group) => group.id === Number(groupId)),
  );
}

export function buildProgressChartData(progress) {
  return {
    labels: progress.map((entry) =>
      new Date(entry.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
    ),
    datasets: [
      {
        label: "Peso máximo (kg)",
        data: progress.map((entry) => entry.maxWeight),
        borderColor: "#ef233c",
        backgroundColor: "rgba(239,35,60,.16)",
        fill: true,
        tension: 0.25,
      },
      {
        label: "1RM estimado",
        data: progress.map((entry) => entry.estimatedOneRepMax),
        borderColor: "#58c887",
        backgroundColor: "transparent",
        tension: 0.25,
      },
    ],
  };
}

export function buildActivityChartData(activity) {
  return {
    labels: activity.map((entry) =>
      new Date(`${entry.date}T12:00:00`).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
    ),
    datasets: [
      {
        label: "Volumen (kg)",
        data: activity.map((entry) => entry.totalVolume),
        backgroundColor: "#e01e37",
        borderRadius: 3,
      },
    ],
  };
}

export function buildMuscleGroupChartData(muscleGroups) {
  return {
    labels: muscleGroups.map((group) => group.nombre),
    datasets: [
      {
        label: "Volumen (kg)",
        data: muscleGroups.map((group) => group.totalVolume),
        backgroundColor: "#58c887",
        borderRadius: 3,
      },
    ],
  };
}

/** Resumen del progreso de un ejercicio en el período: primera vs. última sesión. */
export function summarizeProgress(progress) {
  if (progress.length === 0) return null;

  const first = progress[0];
  const last = progress[progress.length - 1];
  const bestOneRepMax = Math.max(...progress.map((entry) => entry.estimatedOneRepMax));

  return {
    sessions: progress.length,
    bestOneRepMax,
    weightChange: Number((last.maxWeight - first.maxWeight).toFixed(2)),
  };
}

/** Totales de un entrenamiento para la vista de detalle. */
export function summarizeWorkout(workout) {
  const sets = workout?.series || [];
  const totalVolume = sets.reduce((total, set) => total + set.repeticiones * set.peso, 0);
  const totalRepetitions = sets.reduce((total, set) => total + set.repeticiones, 0);
  const rpeValues = sets
    .map((set) => set.rpe)
    .filter((value) => value !== null && value !== undefined);

  return {
    totalSets: sets.length,
    totalRepetitions,
    totalVolume: Number(totalVolume.toFixed(2)),
    averageRpe: rpeValues.length
      ? Number((rpeValues.reduce((total, value) => total + value, 0) / rpeValues.length).toFixed(1))
      : null,
  };
}

/** Agrupa las series de un entrenamiento por ejercicio, conservando el orden. */
export function groupSetsByExercise(sets = []) {
  const groups = new Map();

  for (const set of sets) {
    const key = set.exerciseId;
    if (!groups.has(key)) {
      groups.set(key, { exerciseId: key, nombre: set.exercise?.nombre || "Ejercicio", sets: [] });
    }
    groups.get(key).sets.push(set);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    volume: group.sets.reduce((total, set) => total + set.repeticiones * set.peso, 0),
    bestOneRepMax: Math.max(
      ...group.sets.map((set) =>
        set.repeticiones <= 1 ? set.peso : set.peso * (1 + set.repeticiones / 30),
      ),
    ),
  }));
}
