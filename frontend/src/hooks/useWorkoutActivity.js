import { useCallback, useEffect, useState } from "react";
import { getExercises } from "../services/exerciseService";
import { getProgramAdherence } from "../services/metricsService";
import { getRoutines } from "../services/routineService";
import { createWorkout, deleteWorkout, getWorkouts } from "../services/workoutService";
import {
  createEmptyExerciseLine,
  hasIncompleteExerciseLines,
  hydrateRoutineLines,
  serializeExerciseLines,
} from "../utils/exerciseLineUtils";

const DEFAULT_WORKOUT_NAME = "Entrenamiento libre";
const RECENT_LIMIT = 5;

/** Lista plana de sesiones de todos los planes visibles, con su estado de cumplimiento. */
export function flattenProgramSessions(programs) {
  return programs.flatMap((program) =>
    program.semanas.flatMap((week) =>
      week.sesiones.map((session) => ({
        id: session.scheduledWorkoutId,
        nombre: session.nombre,
        workoutTemplateId: session.workoutTemplateId,
        completed: session.completada,
        label: `${program.nombre} · Semana ${week.numeroSemana} · ${session.nombre}`,
      })),
    ),
  );
}

/** Líneas de un entrenamiento a partir de una rutina: se precargan ejercicio, reps y peso. */
function linesFromRoutine(routine) {
  const lines = hydrateRoutineLines(routine?.workoutTemplateExercises || []).map((line) => ({
    ...line,
    rir: "",
    rpe: "",
  }));
  return lines.length > 0 ? lines : [createEmptyExerciseLine()];
}

export function useWorkoutActivity({ initialSessionId } = {}) {
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState(DEFAULT_WORKOUT_NAME);
  const [timestamp, setTimestamp] = useState("");
  const [routineId, setRoutineId] = useState("");
  const [scheduledWorkoutId, setScheduledWorkoutId] = useState("");
  const [sets, setSets] = useState([createEmptyExerciseLine()]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRecent = useCallback(async () => {
    const data = await getWorkouts({ page: 1, limit: RECENT_LIMIT });
    setRecentWorkouts(data.workouts);
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      getExercises(),
      getRoutines(),
      getProgramAdherence(),
      getWorkouts({ page: 1, limit: RECENT_LIMIT }),
    ])
      .then(([exerciseData, routineData, programData, workoutData]) => {
        if (!active) return;
        setExercises(exerciseData);
        setRoutines(routineData);
        setRecentWorkouts(workoutData.workouts);

        const sessions = flattenProgramSessions(programData);
        setScheduledWorkouts(sessions);

        // Llegada desde el Dashboard con una sesión sugerida: se abre el formulario precargado.
        const initial = sessions.find((session) => session.id === Number(initialSessionId));
        if (initial && !initial.completed) {
          const routine = routineData.find((item) => item.id === initial.workoutTemplateId);
          setScheduledWorkoutId(String(initial.id));
          setRoutineId(String(initial.workoutTemplateId));
          setName(initial.nombre);
          setSets(linesFromRoutine(routine));
          setFormOpen(true);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialSessionId]);

  function resetForm() {
    setFormOpen(false);
    setRoutineId("");
    setScheduledWorkoutId("");
    setName(DEFAULT_WORKOUT_NAME);
    setTimestamp("");
    setSets([createEmptyExerciseLine()]);
  }

  function toggleForm() {
    if (formOpen) {
      resetForm();
      return;
    }
    setSuccess("");
    setFormOpen(true);
  }

  function selectRoutine(value) {
    setScheduledWorkoutId("");
    setRoutineId(value);

    if (!value) {
      setName(DEFAULT_WORKOUT_NAME);
      setSets([createEmptyExerciseLine()]);
      return;
    }

    const routine = routines.find((item) => item.id === Number(value));
    setName(routine?.nombre || "Entrenamiento de rutina");
    setSets(linesFromRoutine(routine));
  }

  function selectScheduledWorkout(value) {
    setScheduledWorkoutId(value);

    if (!value) {
      setRoutineId("");
      setName(DEFAULT_WORKOUT_NAME);
      setSets([createEmptyExerciseLine()]);
      return;
    }

    const session = scheduledWorkouts.find((item) => item.id === Number(value));
    if (!session) return;

    const routine = routines.find((item) => item.id === session.workoutTemplateId);
    setRoutineId(String(session.workoutTemplateId));
    setName(session.nombre);
    setSets(linesFromRoutine(routine));
  }

  async function submitWorkout(event) {
    event.preventDefault();
    setError("");

    if (hasIncompleteExerciseLines(sets)) {
      setError("Completá ejercicio, repeticiones y peso en todas las series.");
      return;
    }

    setSaving(true);
    try {
      const workout = await createWorkout({
        nombre: name,
        timestamp: timestamp ? new Date(timestamp).toISOString() : undefined,
        workoutTemplateId: routineId ? Number(routineId) : undefined,
        scheduledWorkoutId: scheduledWorkoutId ? Number(scheduledWorkoutId) : undefined,
        series: serializeExerciseLines(sets),
      });

      setScheduledWorkouts((current) =>
        current.map((session) =>
          session.id === workout.scheduledWorkoutId ? { ...session, completed: true } : session,
        ),
      );
      setSuccess(`Se registró "${workout.nombre}" con ${workout.series.length} series.`);
      resetForm();
      await loadRecent();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeWorkout(workout) {
    if (!window.confirm(`¿Eliminar el entrenamiento "${workout.nombre}"?`)) return;

    try {
      await deleteWorkout(workout.id);

      if (workout.scheduledWorkoutId) {
        setScheduledWorkouts((current) =>
          current.map((session) =>
            session.id === workout.scheduledWorkoutId ? { ...session, completed: false } : session,
          ),
        );
      }

      setSuccess("Entrenamiento eliminado.");
      await loadRecent();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return {
    exercises,
    routines,
    scheduledWorkouts,
    recentWorkouts,
    loading,
    formOpen,
    toggleForm,
    name,
    setName,
    timestamp,
    setTimestamp,
    routineId,
    selectRoutine,
    scheduledWorkoutId,
    selectScheduledWorkout,
    sets,
    setSets,
    error,
    success,
    saving,
    submitWorkout,
    removeWorkout,
  };
}
