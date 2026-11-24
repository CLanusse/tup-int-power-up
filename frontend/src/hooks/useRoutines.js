import { useEffect, useState } from "react";
import { getExercises } from "../services/exerciseService";
import {
  createRoutine,
  deleteRoutine,
  getRoutines,
  updateRoutine,
} from "../services/routineService";
import { createEmptyExerciseLine } from "../utils/exerciseLineUtils";
import {
  EMPTY_ROUTINE,
  routineFormToPayload,
  routineLinesToForm,
  routineToForm,
} from "../utils/routineUtils";

export function useRoutines() {
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ROUTINE);
  const [lines, setLines] = useState([createEmptyExerciseLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([getRoutines(), getExercises()])
      .then(([routineData, exerciseData]) => {
        if (!active) return;
        setRoutines(routineData);
        setExercises(exerciseData);
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

  function toggleRoutine(routine) {
    setExpandedId((current) => (current === routine.id ? null : routine.id));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_ROUTINE);
    setLines([createEmptyExerciseLine()]);
    setFormOpen(true);
    setSuccess("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  function openEdit(routine) {
    setEditingId(routine.id);
    setForm(routineToForm(routine));
    const routineLines = routineLinesToForm(routine);
    setLines(routineLines.length > 0 ? routineLines : [createEmptyExerciseLine()]);
    setFormOpen(true);
    setSuccess("");
  }

  async function submitRoutine(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      // La rutina y sus ejercicios se guardan juntos: si algo falla, no queda a medias.
      const payload = routineFormToPayload(form, lines, { creating: !editingId });
      const saved = editingId
        ? await updateRoutine(editingId, payload)
        : await createRoutine(payload);

      setRoutines((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? saved : item))
          : [saved, ...current],
      );
      setSuccess(
        editingId
          ? `Se actualizó la rutina ${saved.nombre}.`
          : `Se creó la rutina ${saved.nombre}.`,
      );
      closeForm();
      setExpandedId(saved.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeRoutine(routine) {
    if (!window.confirm(`¿Eliminar ${routine.nombre}?`)) return;

    try {
      await deleteRoutine(routine.id);
      setRoutines((current) => current.filter((item) => item.id !== routine.id));
      setError("");
      setSuccess(`Se eliminó la rutina ${routine.nombre}.`);
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
    }
  }

  return {
    routines,
    exercises,
    loading,
    expandedId,
    formOpen,
    editing: Boolean(editingId),
    editingRoutine: routines.find((routine) => routine.id === editingId) || null,
    form,
    setForm,
    lines,
    setLines,
    saving,
    error,
    success,
    toggleRoutine,
    openCreate,
    closeForm,
    openEdit,
    submitRoutine,
    removeRoutine,
  };
}
