import { crearDatosIniciales } from "./seed";

/**
 * "Base de datos" de la API simulada.
 *
 * Vive en memoria y se guarda en localStorage después de cada escritura, así
 * los datos sobreviven a recargas de la página y al cierre de sesión (por
 * ejemplo, lo que publica el admin lo ve después la cuenta demo).
 */

export const STORAGE_KEY = "powerup:mock-db";
const VERSION = 1;

let state = null;

function leerGuardado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.version === VERSION ? parsed.data : null;
  } catch {
    return null;
  }
}

function guardar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, data: state }));
  } catch {
    // Sin almacenamiento disponible (modo privado): los datos quedan solo en memoria.
  }
}

/** Devuelve el estado actual, creándolo con los datos iniciales si hace falta. */
export function getDb() {
  if (!state) {
    state = leerGuardado() ?? crearDatosIniciales();
    guardar();
  }
  return state;
}

/** Vuelve a los datos iniciales (cuenta demo, admin y catálogo). */
export function resetDb(now = new Date()) {
  state = crearDatosIniciales(now);
  guardar();
  return state;
}

/** Descarta el estado en memoria (los tests lo usan para partir de cero). */
export function clearMemory() {
  state = null;
}

export function nowIso() {
  return new Date().toISOString();
}

/** Inserta una fila con id autoincremental y marcas de tiempo. */
export function insert(table, data) {
  const db = getDb();
  db.seq[table] = (db.seq[table] ?? 0) + 1;
  const fecha = nowIso();
  const row = { id: db.seq[table], ...data, createdAt: fecha, updatedAt: fecha };
  db[table].push(row);
  guardar();
  return row;
}

/** Actualiza solo los campos definidos (undefined = no modificar), como Sequelize. */
export function update(row, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) row[key] = value;
  }
  row.updatedAt = nowIso();
  guardar();
  return row;
}

export function removeWhere(table, predicate) {
  const db = getDb();
  db[table] = db[table].filter((row) => !predicate(row));
  guardar();
}

export function persist() {
  guardar();
}

export function findById(table, id) {
  return getDb()[table].find((row) => row.id === id) ?? null;
}

/* ---------- Serialización: equivale a los include de los repositorios ---------- */

export function serializeUser(user) {
  const publicData = { ...user };
  delete publicData.password;
  return publicData;
}

export function exerciseWithGroups(exercise) {
  const db = getDb();
  const ids = db.exerciseMuscleGroups
    .filter((link) => link.exerciseId === exercise.id)
    .map((link) => link.muscleGroupId);
  const muscleGroups = db.muscleGroups.filter((group) => ids.includes(group.id));
  return { ...exercise, muscleGroups: muscleGroups.map((group) => ({ ...group })) };
}

export function templateWithExercises(template) {
  const db = getDb();
  const lines = db.workoutTemplateExercises
    .filter((line) => line.workoutTemplateId === template.id)
    .sort((a, b) => a.orden - b.orden)
    .map((line) => ({ ...line, exercise: { ...findById("exercises", line.exerciseId) } }));
  return { ...template, workoutTemplateExercises: lines };
}

export function weekWithSessions(week) {
  const db = getDb();
  const scheduledWorkouts = db.scheduledWorkouts
    .filter((session) => session.programWeekId === week.id)
    .sort((a, b) => a.orden - b.orden)
    .map((session) => ({
      ...session,
      workoutTemplate: { ...findById("workoutTemplates", session.workoutTemplateId) },
    }));
  return { ...week, scheduledWorkouts };
}

export function programWithWeeks(program) {
  const weeks = getDb()
    .programWeeks.filter((week) => week.trainingProgramId === program.id)
    .sort((a, b) => a.numeroSemana - b.numeroSemana)
    .map(weekWithSessions);
  return { ...program, weeks };
}

export function serializeWorkout(workout) {
  const db = getDb();
  const series = db.workoutSets
    .filter((set) => set.workoutId === workout.id)
    .sort((a, b) => a.id - b.id)
    .map((set) => ({ ...set, exercise: { ...findById("exercises", set.exerciseId) } }));

  const template = workout.workoutTemplateId
    ? findById("workoutTemplates", workout.workoutTemplateId)
    : null;

  let scheduledWorkout = null;
  const session = workout.scheduledWorkoutId
    ? findById("scheduledWorkouts", workout.scheduledWorkoutId)
    : null;

  if (session) {
    const week = findById("programWeeks", session.programWeekId);
    const program = week ? findById("trainingPrograms", week.trainingProgramId) : null;
    scheduledWorkout = {
      ...session,
      workoutTemplate: { ...findById("workoutTemplates", session.workoutTemplateId) },
      programWeek: week && {
        id: week.id,
        numeroSemana: week.numeroSemana,
        nombre: week.nombre,
        trainingProgramId: week.trainingProgramId,
        trainingProgram: program && { id: program.id, nombre: program.nombre },
      },
    };
  }

  return {
    ...workout,
    series,
    workoutTemplate: template ? { ...template } : null,
    scheduledWorkout,
  };
}
