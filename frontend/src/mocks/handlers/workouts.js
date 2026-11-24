import { http, HttpResponse } from "msw";
import { findById, getDb, insert, removeWhere, serializeWorkout, update } from "../data/db";
import { canReadResource, visibleTo } from "../domain/permissions";
import {
  createValidator,
  fail,
  isInt,
  isIsoDate,
  isNumber,
  isPresent,
  isText,
  json,
  parseId,
  parseRange,
  route,
  toNumberOrNull,
} from "../http";
import { getVisibleTemplate } from "./routines";

const DEFAULT_PAGE_SIZE = 20;
// Tolerancia para diferencias de reloj entre cliente y servidor.
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

/** Entrenamientos del usuario dentro de un rango, del más antiguo al más reciente. */
export function workoutsOf(userId, range = {}) {
  return getDb()
    .workouts.filter((workout) => {
      if (workout.userId !== userId) return false;
      const time = Date.parse(workout.timestamp);
      if (range.from && time < range.from.getTime()) return false;
      if (range.to && time > range.to.getTime()) return false;
      return true;
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id - b.id);
}

function validateWorkoutBody(body, { creating }) {
  const v = createValidator();

  if (creating || body.nombre !== undefined) {
    if (v.check(isText(body.nombre), "nombre", "El nombre debe ser texto")) {
      if (creating) {
        v.check(body.nombre.trim() !== "", "nombre", "El nombre del entrenamiento es obligatorio");
      }
      v.check(
        body.nombre.trim().length >= 2,
        "nombre",
        "El nombre debe tener al menos 2 caracteres",
      );
    }
  }
  if (creating) {
    v.check(
      body.series !== undefined,
      "series",
      "El entrenamiento debe incluir al menos una serie",
    );
  }
  if (body.timestamp !== undefined) {
    v.check(isIsoDate(body.timestamp), "timestamp", "timestamp debe ser una fecha valida");
  }
  if (isPresent(body.grupoMuscularEtiqueta)) {
    v.check(
      isText(body.grupoMuscularEtiqueta),
      "grupoMuscularEtiqueta",
      "grupoMuscularEtiqueta debe ser texto",
    );
  }
  for (const field of ["workoutTemplateId", "scheduledWorkoutId"]) {
    if (isPresent(body[field])) {
      v.check(isInt(body[field], 1), field, `${field} debe ser un entero positivo`);
    }
  }

  if (body.series !== undefined) {
    const valid = v.check(
      Array.isArray(body.series) && body.series.length >= 1 && body.series.length <= 200,
      "series",
      "series debe ser un arreglo con entre 1 y 200 series",
    );
    if (valid) {
      for (const serie of body.series) {
        const s = serie ?? {};
        v.check(
          isInt(s.exerciseId, 1),
          "series.exerciseId",
          "series.exerciseId debe ser un entero positivo",
        );
        v.check(
          isInt(s.repeticiones, 1),
          "series.repeticiones",
          "series.repeticiones debe ser un entero positivo",
        );
        v.check(isNumber(s.peso, 0), "series.peso", "series.peso debe ser un numero positivo");
        if (isPresent(s.rir)) {
          v.check(isInt(s.rir, 0, 10), "series.rir", "series.rir debe ser un entero entre 0 y 10");
        }
        if (isPresent(s.rpe)) {
          v.check(isNumber(s.rpe, 1, 10), "series.rpe", "series.rpe debe estar entre 1 y 10");
        }
      }
    }
  }
  v.done();
}

function validateTimestamp(timestamp) {
  if (timestamp && Date.parse(timestamp) > Date.now() + FUTURE_TOLERANCE_MS) {
    fail(400, "No se puede registrar un entrenamiento con fecha futura");
  }
}

function validateSeriesExercises(userId, series) {
  if (series === undefined) return;
  const ids = [...new Set(series.map((serie) => Number(serie.exerciseId)))];
  const visible = getDb().exercises.filter(
    (exercise) => ids.includes(exercise.id) && visibleTo(userId)(exercise),
  );
  if (visible.length !== ids.length) {
    fail(400, "Una o mas series usan ejercicios inexistentes o de otro usuario");
  }
}

/**
 * Si el entrenamiento cumple una sesión del plan, la rutina se toma de la sesión.
 * Si solo indica una rutina, debe ser visible para el usuario.
 */
function normalizePlanning(user, body) {
  const scheduledId = isPresent(body.scheduledWorkoutId)
    ? Number(body.scheduledWorkoutId)
    : body.scheduledWorkoutId;
  const templateId = isPresent(body.workoutTemplateId)
    ? Number(body.workoutTemplateId)
    : body.workoutTemplateId;

  if (isPresent(scheduledId)) {
    const session = findById("scheduledWorkouts", scheduledId);
    const week = session ? findById("programWeeks", session.programWeekId) : null;
    const program = week ? findById("trainingPrograms", week.trainingProgramId) : null;
    if (!session || !program || !canReadResource(program.userId, user.id)) {
      fail(404, "Entrenamiento programado no encontrado");
    }
    if (isPresent(templateId) && templateId !== session.workoutTemplateId) {
      fail(400, "El workoutTemplateId debe coincidir con el entrenamiento programado");
    }
    return { scheduledWorkoutId: scheduledId, workoutTemplateId: session.workoutTemplateId };
  }

  if (isPresent(templateId)) getVisibleTemplate(templateId, user);
  return { scheduledWorkoutId: scheduledId, workoutTemplateId: templateId };
}

function insertSets(workoutId, series) {
  for (const serie of series) {
    insert("workoutSets", {
      workoutId,
      exerciseId: Number(serie.exerciseId),
      repeticiones: Number(serie.repeticiones),
      peso: Number(serie.peso),
      rir: toNumberOrNull(serie.rir),
      rpe: toNumberOrNull(serie.rpe),
    });
  }
}

function getOwnWorkout(id, user) {
  const workout = findById("workouts", id);
  if (!workout || workout.userId !== user.id) fail(404, "Entrenamiento no encontrado");
  return workout;
}

export const workoutHandlers = [
  http.get(
    "*/api/workouts",
    route(({ user, query }) => {
      const v = createValidator();
      const page = query.get("page") ?? "1";
      const limit = query.get("limit") ?? String(DEFAULT_PAGE_SIZE);
      v.check(isInt(page, 1), "page", "page debe ser un entero positivo");
      v.check(isInt(limit, 1, 100), "limit", "limit debe ser un entero entre 1 y 100");
      v.done();
      const range = parseRange(query);

      const pageNumber = Number(page);
      const pageSize = Number(limit);
      const all = workoutsOf(user.id, range).reverse();
      const workouts = all
        .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
        .map(serializeWorkout);

      return json({
        workouts,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: all.length,
          totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
        },
      });
    }),
  ),

  http.get(
    "*/api/workouts/:id",
    route(({ params, user }) =>
      json({ workout: serializeWorkout(getOwnWorkout(parseId(params.id), user)) }),
    ),
  ),

  http.post(
    "*/api/workouts",
    route(({ body, user }) => {
      validateWorkoutBody(body, { creating: true });
      validateTimestamp(body.timestamp);
      validateSeriesExercises(user.id, body.series);
      const planning = normalizePlanning(user, body);

      const workout = insert("workouts", {
        timestamp: body.timestamp
          ? new Date(body.timestamp).toISOString()
          : new Date().toISOString(),
        nombre: body.nombre.trim(),
        userId: user.id,
        grupoMuscularEtiqueta: body.grupoMuscularEtiqueta?.trim() || null,
        workoutTemplateId: planning.workoutTemplateId ?? null,
        scheduledWorkoutId: planning.scheduledWorkoutId ?? null,
      });
      insertSets(workout.id, body.series);

      return json({ workout: serializeWorkout(workout) }, 201);
    }),
  ),

  http.put(
    "*/api/workouts/:id",
    route(({ params, body, user }) => {
      const id = parseId(params.id);
      validateWorkoutBody(body, { creating: false });
      const workout = getOwnWorkout(id, user);
      validateTimestamp(body.timestamp);
      validateSeriesExercises(user.id, body.series);
      const planning = normalizePlanning(user, body);

      update(workout, {
        nombre: body.nombre?.trim(),
        timestamp: body.timestamp ? new Date(body.timestamp).toISOString() : undefined,
        grupoMuscularEtiqueta:
          body.grupoMuscularEtiqueta !== undefined
            ? body.grupoMuscularEtiqueta?.trim() || null
            : undefined,
        workoutTemplateId: planning.workoutTemplateId,
        scheduledWorkoutId: planning.scheduledWorkoutId,
      });

      if (body.series) {
        removeWhere("workoutSets", (set) => set.workoutId === id);
        insertSets(id, body.series);
      }

      return json({ workout: serializeWorkout(workout) });
    }),
  ),

  http.delete(
    "*/api/workouts/:id",
    route(({ params, user }) => {
      const id = parseId(params.id);
      getOwnWorkout(id, user);
      removeWhere("workoutSets", (set) => set.workoutId === id);
      removeWhere("workouts", (row) => row.id === id);
      return new HttpResponse(null, { status: 204 });
    }),
  ),
];
