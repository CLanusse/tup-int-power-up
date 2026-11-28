import { useEffect, useState } from "react";
import { getExercises, getMuscleGroups } from "../services/exerciseService";
import { getWorkouts } from "../services/workoutService";
import {
  getActivity,
  getExerciseProgress,
  getMuscleGroupVolume,
  getSummary,
} from "../services/metricsService";
import { toApiDateRange, toInputDate } from "../utils/dateUtils";
import { filterExercisesByMuscleGroup } from "../utils/progressUtils";

function getDefaultFrom() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toInputDate(date);
}

export function useProgressMetrics() {
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [exercises, setExercises] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [progress, setProgress] = useState([]);
  const [muscleGroupVolume, setMuscleGroupVolume] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([getExercises(), getMuscleGroups(), getWorkouts({ page: 1, limit: 1 })])
      .then(([exerciseData, groupData, latest]) => {
        if (!active) return;
        setExercises(exerciseData);
        setGroups(groupData);
        // Por defecto se muestra el primer ejercicio del último entrenamiento (tiene datos);
        // si todavía no hay registros, el primero del catálogo.
        const recentExerciseId = latest.workouts[0]?.series?.[0]?.exerciseId;
        const defaultId = recentExerciseId ?? exerciseData[0]?.id;
        if (defaultId) setExerciseId(String(defaultId));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!from || !to) return undefined;

    let active = true;
    const range = toApiDateRange(from, to);

    Promise.all([
      getSummary(range),
      getActivity(range),
      getMuscleGroupVolume(range),
      exerciseId ? getExerciseProgress(exerciseId, range) : Promise.resolve({ progress: [] }),
    ])
      .then(([summaryData, activityData, groupData, progressData]) => {
        if (!active) return;
        setSummary(summaryData);
        setActivity(activityData);
        setMuscleGroupVolume(groupData);
        setProgress(progressData.progress);
        setError("");
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
  }, [from, to, exerciseId]);

  function selectGroup(value) {
    setGroupId(value);
    setExerciseId("");
  }

  return {
    from,
    setFrom,
    to,
    setTo,
    groups,
    exercises: filterExercisesByMuscleGroup(exercises, groupId),
    groupId,
    selectGroup,
    exerciseId,
    setExerciseId,
    summary,
    activity,
    progress,
    muscleGroupVolume,
    loading,
    error,
  };
}
