import { http } from "msw";
import { exerciseWithGroups, findById, getDb, programWithWeeks } from "../data/db";
import {
  average,
  calculateSetVolume,
  calculateTotalVolume,
  DEFAULT_TIME_ZONE,
  estimateOneRepMax,
  intensityLevel,
  percentage,
  presentValues,
  round,
  toDateKey,
} from "../domain/metrics";
import { visibleTo } from "../domain/permissions";
import { createValidator, fail, isInt, isTimeZone, json, parseRange, route } from "../http";
import { workoutsOf } from "./workouts";

function setsOf(workoutId) {
  return getDb().workoutSets.filter((set) => set.workoutId === workoutId);
}

function parseMetricsQuery(query) {
  const tz = query.get("tz");
  if (tz) {
    const v = createValidator();
    v.check(
      isTimeZone(tz),
      "tz",
      "tz debe ser una zona horaria IANA valida, por ejemplo America/Argentina/Buenos_Aires",
    );
    v.done();
  }
  return { range: parseRange(query), timeZone: tz || DEFAULT_TIME_ZONE };
}

function summary(userId, range) {
  const workouts = workoutsOf(userId, range);
  const sets = workouts.flatMap((workout) => setsOf(workout.id));

  return {
    workouts: workouts.length,
    completedScheduledWorkouts: workouts.filter((w) => w.scheduledWorkoutId !== null).length,
    freeWorkouts: workouts.filter((w) => w.scheduledWorkoutId === null).length,
    totalSets: sets.length,
    totalRepetitions: sets.reduce((total, set) => total + set.repeticiones, 0),
    totalVolume: round(calculateTotalVolume(sets)),
    averageSetsPerWorkout: workouts.length > 0 ? round(sets.length / workouts.length) : 0,
    averageRpe: average(presentValues(sets.map((set) => set.rpe))),
    averageRir: average(presentValues(sets.map((set) => set.rir))),
    range: {
      from: range.from?.toISOString() ?? null,
      to: range.to?.toISOString() ?? null,
    },
  };
}

function activityHeatmap(userId, range, timeZone) {
  const days = new Map();

  for (const workout of workoutsOf(userId, range)) {
    const date = toDateKey(new Date(workout.timestamp), timeZone);
    const sets = setsOf(workout.id);
    const current = days.get(date) ?? {
      date,
      workoutCount: 0,
      completedScheduledWorkouts: 0,
      setCount: 0,
      totalVolume: 0,
    };
    current.workoutCount += 1;
    current.completedScheduledWorkouts += workout.scheduledWorkoutId !== null ? 1 : 0;
    current.setCount += sets.length;
    current.totalVolume += calculateTotalVolume(sets);
    days.set(date, current);
  }

  const activity = [...days.values()];
  const maxVolume = Math.max(0, ...activity.map((day) => day.totalVolume));
  return activity.map((day) => ({
    ...day,
    totalVolume: round(day.totalVolume),
    intensityLevel: intensityLevel(day.totalVolume, maxVolume, day.workoutCount),
  }));
}

function exerciseProgress(userId, exerciseId, range) {
  return workoutsOf(userId, range)
    .map((workout) => {
      const sets = setsOf(workout.id).filter((set) => set.exerciseId === exerciseId);
      if (sets.length === 0) return null;
      return {
        date: new Date(workout.timestamp).toISOString(),
        workoutId: workout.id,
        workoutName: workout.nombre,
        setCount: sets.length,
        maxWeight: round(Math.max(...sets.map((set) => set.peso))),
        maxRepetitions: Math.max(...sets.map((set) => set.repeticiones)),
        totalVolume: round(calculateTotalVolume(sets)),
        estimatedOneRepMax: round(Math.max(...sets.map(estimateOneRepMax))),
        averageRpe: average(presentValues(sets.map((set) => set.rpe))),
        averageRir: average(presentValues(sets.map((set) => set.rir))),
      };
    })
    .filter(Boolean);
}

/**
 * Volumen por grupo muscular. Si un ejercicio trabaja varios grupos, su
 * volumen se suma completo a cada uno.
 */
function muscleGroupVolume(userId, range) {
  const groups = new Map();
  const sets = workoutsOf(userId, range).flatMap((workout) => setsOf(workout.id));

  for (const set of sets) {
    const exercise = findById("exercises", set.exerciseId);
    const muscleGroups = exercise ? exerciseWithGroups(exercise).muscleGroups : [];
    const targets =
      muscleGroups.length > 0
        ? muscleGroups.map((group) => ({ id: group.id, nombre: group.nombre }))
        : [{ id: null, nombre: "Sin grupo muscular" }];

    for (const target of targets) {
      const key = String(target.id);
      const current = groups.get(key) ?? {
        muscleGroupId: target.id,
        nombre: target.nombre,
        setCount: 0,
        totalVolume: 0,
      };
      current.setCount += 1;
      current.totalVolume += calculateSetVolume(set);
      groups.set(key, current);
    }
  }

  return [...groups.values()]
    .map((group) => ({ ...group, totalVolume: round(group.totalVolume) }))
    .sort((a, b) => b.totalVolume - a.totalVolume);
}

/**
 * Cumplimiento de los planes: sesiones programadas vs. realizadas por el usuario.
 * Los planes globales se evalúan para cada usuario.
 */
function programAdherence(userId, trainingProgramId) {
  const programs = getDb()
    .trainingPrograms.filter(visibleTo(userId))
    .filter((program) => !trainingProgramId || program.id === trainingProgramId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map(programWithWeeks);

  if (trainingProgramId && programs.length === 0) {
    fail(404, "Programa de entrenamiento no encontrado");
  }

  // En orden cronológico: el último registro de cada sesión queda en el mapa.
  const completed = new Map();
  for (const workout of workoutsOf(userId)) {
    if (workout.scheduledWorkoutId !== null) {
      completed.set(workout.scheduledWorkoutId, {
        workoutId: workout.id,
        timestamp: workout.timestamp,
      });
    }
  }

  return programs.map((program) => {
    const semanas = program.weeks.map((week) => {
      const sesiones = week.scheduledWorkouts.map((session) => {
        const done = completed.get(session.id);
        return {
          scheduledWorkoutId: session.id,
          nombre: session.nombre,
          orden: session.orden,
          diaSemana: session.diaSemana,
          fechaProgramada: session.fechaProgramada,
          workoutTemplateId: session.workoutTemplateId,
          workoutTemplateNombre: session.workoutTemplate?.nombre ?? null,
          completada: Boolean(done),
          workoutId: done?.workoutId ?? null,
          fechaRealizada: done?.timestamp ?? null,
        };
      });
      const realizadas = sesiones.filter((session) => session.completada).length;
      return {
        programWeekId: week.id,
        numeroSemana: week.numeroSemana,
        nombre: week.nombre,
        esDescarga: week.esDescarga,
        programadas: sesiones.length,
        realizadas,
        porcentaje: percentage(realizadas, sesiones.length),
        sesiones,
      };
    });

    const totalProgramadas = semanas.reduce((total, week) => total + week.programadas, 0);
    const totalRealizadas = semanas.reduce((total, week) => total + week.realizadas, 0);
    const proxima = semanas
      .flatMap((week) =>
        week.sesiones.map((session) => ({ ...session, numeroSemana: week.numeroSemana })),
      )
      .find((session) => !session.completada);

    return {
      trainingProgramId: program.id,
      nombre: program.nombre,
      estado: program.estado,
      esGlobal: program.userId === null,
      totalProgramadas,
      totalRealizadas,
      porcentaje: percentage(totalRealizadas, totalProgramadas),
      proximaSesion: proxima ?? null,
      semanas,
    };
  });
}

export const metricsHandlers = [
  http.get(
    "*/api/metrics/summary",
    route(({ user, query }) => {
      const { range } = parseMetricsQuery(query);
      return json({ summary: summary(user.id, range) });
    }),
  ),

  http.get(
    "*/api/metrics/activity-heatmap",
    route(({ user, query }) => {
      const { range, timeZone } = parseMetricsQuery(query);
      return json({ timeZone, activity: activityHeatmap(user.id, range, timeZone) });
    }),
  ),

  http.get(
    "*/api/metrics/exercise-progress",
    route(({ user, query }) => {
      const v = createValidator();
      const exerciseId = query.get("exerciseId");
      v.check(isInt(exerciseId, 1), "exerciseId", "exerciseId debe ser un entero positivo");
      v.done();
      const { range } = parseMetricsQuery(query);

      const exercise = findById("exercises", Number(exerciseId));
      if (!exercise || !visibleTo(user.id)(exercise)) fail(404, "Ejercicio no encontrado");

      return json({
        exercise: exerciseWithGroups(exercise),
        progress: exerciseProgress(user.id, exercise.id, range),
      });
    }),
  ),

  http.get(
    "*/api/metrics/muscle-group-volume",
    route(({ user, query }) => {
      const { range } = parseMetricsQuery(query);
      return json({ muscleGroups: muscleGroupVolume(user.id, range) });
    }),
  ),

  http.get(
    "*/api/metrics/program-adherence",
    route(({ user, query }) => {
      const raw = query.get("trainingProgramId");
      if (raw) {
        const v = createValidator();
        v.check(
          isInt(raw, 1),
          "trainingProgramId",
          "trainingProgramId debe ser un entero positivo",
        );
        v.done();
      }
      return json({ programs: programAdherence(user.id, raw ? Number(raw) : undefined) });
    }),
  ),
];
