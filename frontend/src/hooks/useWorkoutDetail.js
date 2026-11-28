import { useEffect, useState } from "react";
import { getExercises } from "../services/exerciseService";
import { deleteWorkout, getWorkout, updateWorkout } from "../services/workoutService";
import { toDateTimeLocalInput } from "../utils/dateUtils";
import {
  hasIncompleteExerciseLines,
  hydrateExerciseLines,
  serializeExerciseLines,
} from "../utils/exerciseLineUtils";

export function useWorkoutDetail(id) {
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([getWorkout(id), getExercises()])
      .then(([workoutData, exerciseData]) => {
        if (!active) return;
        setWorkout(workoutData);
        setExercises(exerciseData);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 404 || requestError.status === 400) setNotFound(true);
        else setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  function startEditing() {
    setName(workout.nombre);
    setTimestamp(toDateTimeLocalInput(workout.timestamp));
    setLines(hydrateExerciseLines(workout.series || []));
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError("");
  }

  async function saveChanges(event) {
    event.preventDefault();
    setError("");

    if (hasIncompleteExerciseLines(lines)) {
      setError("Completá ejercicio, repeticiones y peso en todas las series.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateWorkout(workout.id, {
        nombre: name,
        timestamp: timestamp ? new Date(timestamp).toISOString() : undefined,
        series: serializeExerciseLines(lines),
      });
      setWorkout(updated);
      setEditing(false);
      setSuccess("Cambios guardados.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeWorkout() {
    if (!window.confirm(`¿Eliminar el entrenamiento "${workout.nombre}"?`)) return false;

    try {
      await deleteWorkout(workout.id);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  return {
    workout,
    exercises,
    loading,
    notFound,
    editing,
    startEditing,
    cancelEditing,
    name,
    setName,
    timestamp,
    setTimestamp,
    lines,
    setLines,
    saving,
    saveChanges,
    removeWorkout,
    error,
    success,
  };
}
