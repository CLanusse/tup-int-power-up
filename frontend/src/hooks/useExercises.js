import { useEffect, useState } from "react";
import {
  createExercise,
  createMuscleGroup,
  deleteExercise,
  deleteMuscleGroup,
  getExercises,
  getMuscleGroups,
  updateExercise,
  updateMuscleGroup,
} from "../services/exerciseService";
import {
  EMPTY_EXERCISE,
  exerciseFormToPayload,
  exerciseToForm,
  filterExercises,
} from "../utils/exerciseUtils";

function byName(a, b) {
  return a.nombre.localeCompare(b.nombre, "es");
}

export function useExercises() {
  const [exercises, setExercises] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [groupId, setGroupId] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_EXERCISE);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([getExercises(), getMuscleGroups()])
      .then(([exerciseData, groupData]) => {
        if (!active) return;
        setExercises(exerciseData);
        setGroups(groupData);
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

  function notify(message) {
    setError("");
    setSuccess(message);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_EXERCISE);
    setFormOpen(true);
    setSuccess("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  function openEdit(exercise) {
    setEditingId(exercise.id);
    setForm(exerciseToForm(exercise));
    setFormOpen(true);
    setSuccess("");
  }

  async function submitExercise(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = exerciseFormToPayload(form, { creating: !editingId });
      const saved = editingId
        ? await updateExercise(editingId, payload)
        : await createExercise(payload);

      setExercises((current) =>
        (editingId
          ? current.map((item) => (item.id === editingId ? saved : item))
          : [...current, saved]
        ).sort(byName),
      );
      notify(editingId ? `Se actualizó ${saved.nombre}.` : `Se creó ${saved.nombre}.`);
      closeForm();
      setSelectedId(saved.id);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeExercise(exercise) {
    if (!window.confirm(`¿Eliminar ${exercise.nombre}?`)) return;

    try {
      await deleteExercise(exercise.id);
      setExercises((current) => current.filter((item) => item.id !== exercise.id));
      notify(`Se eliminó ${exercise.nombre}.`);
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
    }
  }

  async function addGroup(nombre, global = false) {
    setError("");
    try {
      const created = await createMuscleGroup(global ? { nombre, global: true } : { nombre });
      setGroups((current) => [...current, created].sort(byName));
      notify(`Se creó el grupo ${created.nombre}.`);
      return true;
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
      return false;
    }
  }

  async function renameGroup(group, nombre) {
    setError("");
    try {
      const updated = await updateMuscleGroup(group.id, { nombre });
      setGroups((current) =>
        current.map((item) => (item.id === group.id ? updated : item)).sort(byName),
      );
      // Los ejercicios muestran el nombre del grupo: se actualiza en memoria.
      setExercises((current) =>
        current.map((exercise) => ({
          ...exercise,
          muscleGroups: exercise.muscleGroups?.map((item) =>
            item.id === group.id ? updated : item,
          ),
        })),
      );
      notify(`Se renombró el grupo a ${updated.nombre}.`);
      return true;
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
      return false;
    }
  }

  async function removeGroup(group) {
    if (!window.confirm(`¿Eliminar el grupo ${group.nombre}? Los ejercicios se conservan.`)) return;

    try {
      await deleteMuscleGroup(group.id);
      setGroups((current) => current.filter((item) => item.id !== group.id));
      setExercises((current) =>
        current.map((exercise) => ({
          ...exercise,
          muscleGroups: exercise.muscleGroups?.filter((item) => item.id !== group.id),
        })),
      );
      if (String(group.id) === groupId) setGroupId("");
      notify(`Se eliminó el grupo ${group.nombre}.`);
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
    }
  }

  return {
    exercises: filterExercises(exercises, search, difficulty, groupId),
    totalExercises: exercises.length,
    groups,
    loading,
    search,
    setSearch,
    difficulty,
    setDifficulty,
    groupId,
    setGroupId,
    selectedId,
    setSelectedId,
    editing: Boolean(editingId),
    form,
    setForm,
    formOpen,
    openCreate,
    closeForm,
    openEdit,
    error,
    success,
    submitExercise,
    removeExercise,
    addGroup,
    renameGroup,
    removeGroup,
  };
}
