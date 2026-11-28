import { useCallback, useEffect, useState } from "react";
import { deleteWorkout, getWorkouts } from "../services/workoutService";
import { toApiDateRange } from "../utils/dateUtils";

export const HISTORY_PAGE_SIZE = 10;

function buildRange(from, to) {
  if (!from && !to) return {};
  const range = toApiDateRange(from || "1970-01-01", to || "2999-12-31");
  return { from: from ? range.from : undefined, to: to ? range.to : undefined };
}

export function useWorkoutHistory() {
  const [workouts, setWorkouts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    getWorkouts({ page, limit: HISTORY_PAGE_SIZE, ...buildRange(from, to) })
      .then((data) => {
        if (!active) return;
        setWorkouts(data.workouts);
        setPagination(data.pagination);
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
  }, [page, from, to, reloadKey]);

  // Cada cambio de página o filtro dispara una nueva carga.
  const changePage = useCallback((value) => {
    setLoading(true);
    setPage(value);
  }, []);

  // Cambiar un filtro vuelve a la primera página.
  const changeFrom = useCallback((value) => {
    setLoading(true);
    setFrom(value);
    setPage(1);
  }, []);

  const changeTo = useCallback((value) => {
    setLoading(true);
    setTo(value);
    setPage(1);
  }, []);

  function clearFilters() {
    setLoading(true);
    setFrom("");
    setTo("");
    setPage(1);
  }

  async function removeWorkout(workout) {
    if (!window.confirm(`¿Eliminar el entrenamiento "${workout.nombre}"?`)) return;

    try {
      await deleteWorkout(workout.id);
      // Si era el único de la página, se vuelve a la anterior.
      setLoading(true);
      if (workouts.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return {
    workouts,
    pagination,
    page,
    setPage: changePage,
    from,
    setFrom: changeFrom,
    to,
    setTo: changeTo,
    clearFilters,
    loading,
    error,
    removeWorkout,
  };
}
