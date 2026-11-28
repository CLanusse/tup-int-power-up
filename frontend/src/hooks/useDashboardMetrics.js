import { useEffect, useState } from "react";
import { getActivity, getProgramAdherence, getSummary } from "../services/metricsService";
import { getWorkouts } from "../services/workoutService";
import { getWeekRange } from "../utils/dateUtils";

/**
 * Plan a destacar: el primero activo con sesiones pendientes;
 * si no hay, el primero activo con sesiones.
 */
export function pickFeaturedProgram(programs) {
  const active = programs.filter(
    (program) => program.estado !== "finalizado" && program.totalProgramadas > 0,
  );
  return active.find((program) => program.proximaSesion) || active[0] || null;
}

export function useDashboardMetrics() {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [featuredProgram, setFeaturedProgram] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const range = getWeekRange();

    Promise.all([
      getSummary(range),
      getActivity(range),
      getProgramAdherence(),
      getWorkouts({ page: 1, limit: 3 }),
    ])
      .then(([summaryData, activityData, programs, workoutData]) => {
        if (!active) return;
        setSummary(summaryData);
        setActivity(activityData);
        setFeaturedProgram(pickFeaturedProgram(programs));
        setRecentWorkouts(workoutData.workouts);
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
  }, []);

  return { summary, activity, featuredProgram, recentWorkouts, loading, error };
}
