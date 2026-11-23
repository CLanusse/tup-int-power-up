import { http } from "msw";
import {
  findById,
  getDb,
  insert,
  persist,
  removeWhere,
  templateWithExercises,
  update,
} from "../data/db";
import {
  assertCanModify,
  isGlobalResource,
  resolveOwnerId,
  visibleTo,
} from "../domain/permissions";
import {
  cleanText,
  createValidator,
  fail,
  isInt,
  isNumber,
  isPresent,
  json,
  optionalGlobal,
  optionalText,
  parseId,
  requiredText,
  route,
  toNumberOrNull,
} from "../http";

const LABEL = "El nombre de la plantilla de entrenamiento";

export function getVisibleTemplate(id, user) {
  const template = findById("workoutTemplates", id);
  if (!template || !visibleTo(user.id)(template)) {
    fail(404, "Plantilla de entrenamiento no encontrada");
  }
  return template;
}

/** Reglas de un ejercicio planificado (objetivos de repeticiones, peso, RIR y RPE). */
function checkLine(v, line, prefix, { partial = false } = {}) {
  if (!partial || line.exerciseId !== undefined) {
    v.check(
      isInt(line.exerciseId, 1),
      `${prefix}exerciseId`,
      `${prefix}exerciseId debe ser un entero positivo`,
    );
  }
  if (!partial || line.repeticiones !== undefined) {
    v.check(
      isInt(line.repeticiones, 1),
      `${prefix}repeticiones`,
      `${prefix}repeticiones debe ser un entero positivo`,
    );
  }
  if (line.orden !== undefined) {
    v.check(isInt(line.orden, 1), `${prefix}orden`, `${prefix}orden debe ser un entero positivo`);
  }
  if (isPresent(line.peso)) {
    v.check(isNumber(line.peso, 0), `${prefix}peso`, `${prefix}peso debe ser un numero positivo`);
  }
  if (isPresent(line.rirObjetivo)) {
    v.check(
      isInt(line.rirObjetivo, 0, 10),
      `${prefix}rirObjetivo`,
      `${prefix}rirObjetivo debe ser un entero entre 0 y 10`,
    );
  }
  if (isPresent(line.rpeObjetivo)) {
    v.check(
      isNumber(line.rpeObjetivo, 1, 10),
      `${prefix}rpeObjetivo`,
      `${prefix}rpeObjetivo debe estar entre 1 y 10`,
    );
  }
}

function validateTemplateBody(body, { creating }) {
  const v = createValidator();
  if (creating) {
    requiredText(v, body, "nombre", LABEL);
    optionalGlobal(v, body);
  } else {
    optionalText(v, body, "nombre", LABEL, 2);
  }
  for (const field of ["descripcion", "tipo", "grupoMuscularEtiqueta", "dificultad"]) {
    optionalText(v, body, field);
  }
  if (isPresent(body.tiempoEstimado)) {
    v.check(
      isInt(body.tiempoEstimado, 1),
      "tiempoEstimado",
      "tiempoEstimado debe ser un entero positivo",
    );
  }
  if (body.ejercicios !== undefined) {
    const valid = v.check(
      Array.isArray(body.ejercicios) && body.ejercicios.length <= 50,
      "ejercicios",
      "ejercicios debe ser un arreglo de hasta 50 elementos",
    );
    if (valid) body.ejercicios.forEach((line) => checkLine(v, line ?? {}, "ejercicios."));
  }
  v.done();
}

/** Valida los ejercicios planificados: una rutina global solo usa ejercicios globales. */
function normalizeLines(ejercicios, user, templateIsGlobal) {
  if (ejercicios === undefined) return undefined;

  const ids = [...new Set(ejercicios.map((line) => Number(line.exerciseId)))];
  const exercises = getDb().exercises.filter(
    (exercise) => ids.includes(exercise.id) && visibleTo(user.id)(exercise),
  );

  if (exercises.length !== ids.length) {
    fail(400, "Uno o mas ejercicios de la rutina no existen o no estan disponibles");
  }
  if (templateIsGlobal && exercises.some((exercise) => !isGlobalResource(exercise.userId))) {
    fail(400, "Una rutina global solo puede incluir ejercicios globales");
  }

  return ejercicios.map((line, index) => ({
    exerciseId: Number(line.exerciseId),
    orden: index + 1,
    repeticiones: Number(line.repeticiones),
    peso: toNumberOrNull(line.peso),
    rirObjetivo: toNumberOrNull(line.rirObjetivo),
    rpeObjetivo: toNumberOrNull(line.rpeObjetivo),
  }));
}

function replaceLines(workoutTemplateId, lines) {
  removeWhere("workoutTemplateExercises", (line) => line.workoutTemplateId === workoutTemplateId);
  for (const line of lines) insert("workoutTemplateExercises", { ...line, workoutTemplateId });
}

const templateHandlers = [
  http.get(
    "*/api/workout-templates",
    route(({ user }) => {
      const workoutTemplates = getDb()
        .workoutTemplates.filter(visibleTo(user.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
        .map(templateWithExercises);
      return json({ workoutTemplates });
    }),
  ),

  http.get(
    "*/api/workout-templates/:id",
    route(({ params, user }) =>
      json({
        workoutTemplate: templateWithExercises(getVisibleTemplate(parseId(params.id), user)),
      }),
    ),
  ),

  http.post(
    "*/api/workout-templates",
    route(({ body, user }) => {
      validateTemplateBody(body, { creating: true });
      const ownerId = resolveOwnerId(user, body.global);
      const lines = normalizeLines(body.ejercicios, user, ownerId === null);

      // La rutina y sus ejercicios se guardan juntos: si algo falla, no se crea nada.
      const template = insert("workoutTemplates", {
        nombre: body.nombre.trim(),
        descripcion: cleanText(body.descripcion) ?? null,
        tipo: cleanText(body.tipo) ?? null,
        userId: ownerId,
        grupoMuscularEtiqueta: cleanText(body.grupoMuscularEtiqueta) ?? null,
        dificultad: cleanText(body.dificultad) ?? null,
        tiempoEstimado: toNumberOrNull(body.tiempoEstimado),
      });
      if (lines) replaceLines(template.id, lines);

      return json(
        {
          message: "Plantilla de entrenamiento creada exitosamente",
          workoutTemplate: templateWithExercises(template),
        },
        201,
      );
    }),
  ),

  http.put(
    "*/api/workout-templates/:id",
    route(({ params, body, user }) => {
      const id = parseId(params.id);
      validateTemplateBody(body, { creating: false });

      const template = getVisibleTemplate(id, user);
      assertCanModify(template.userId, user, "una rutina");
      const lines = normalizeLines(body.ejercicios, user, isGlobalResource(template.userId));

      update(template, {
        nombre: body.nombre?.trim(),
        descripcion: cleanText(body.descripcion),
        tipo: cleanText(body.tipo),
        grupoMuscularEtiqueta: cleanText(body.grupoMuscularEtiqueta),
        dificultad: cleanText(body.dificultad),
        tiempoEstimado:
          body.tiempoEstimado !== undefined ? toNumberOrNull(body.tiempoEstimado) : undefined,
      });
      if (lines) replaceLines(id, lines);

      return json({
        message: "Plantilla de entrenamiento actualizada exitosamente",
        workoutTemplate: templateWithExercises(template),
      });
    }),
  ),

  http.delete(
    "*/api/workout-templates/:id",
    route(({ params, user }) => {
      const id = parseId(params.id);
      const template = getVisibleTemplate(id, user);
      assertCanModify(template.userId, user, "una rutina");

      const db = getDb();
      const scheduled = db.scheduledWorkouts.filter((s) => s.workoutTemplateId === id).length;
      if (scheduled > 0) {
        fail(
          409,
          `No se puede eliminar: la rutina esta programada en ${scheduled} sesion(es) de planes. Quitala de los planes primero`,
        );
      }

      // Los entrenamientos realizados con esta rutina se conservan (el vínculo pasa a null).
      db.workouts.forEach((workout) => {
        if (workout.workoutTemplateId === id) workout.workoutTemplateId = null;
      });
      persist();
      removeWhere("workoutTemplateExercises", (line) => line.workoutTemplateId === id);
      removeWhere("workoutTemplates", (row) => row.id === id);
      return json({ message: "Plantilla de entrenamiento eliminada exitosamente" });
    }),
  ),
];

/* ------------- Ejercicios de rutina (recurso individual de la API) ------------- */

function getLineForUser(id, user) {
  const line = findById("workoutTemplateExercises", id);
  if (!line) fail(404, "Ejercicio de plantilla no encontrado");
  const template = getVisibleTemplate(line.workoutTemplateId, user);
  return { line, template };
}

function ensureExerciseUsable(exerciseId, user, templateIsGlobal) {
  const exercise = findById("exercises", exerciseId);
  if (!exercise || !visibleTo(user.id)(exercise)) fail(404, "Ejercicio no encontrado");
  if (templateIsGlobal && !isGlobalResource(exercise.userId)) {
    fail(400, "Una rutina global solo puede incluir ejercicios globales");
  }
}

function ensureOrderAvailable(workoutTemplateId, orden, excludeId) {
  const existing = getDb().workoutTemplateExercises.find(
    (line) =>
      line.workoutTemplateId === workoutTemplateId && line.orden === orden && line.id !== excludeId,
  );
  if (existing) fail(409, `Ya existe un ejercicio con el orden ${orden} en esta plantilla`);
}

const lineHandlers = [
  http.get(
    "*/api/workout-template-exercises",
    route(({ query, user }) => {
      const v = createValidator();
      const templateId = query.get("workoutTemplateId");
      v.check(
        isInt(templateId, 1),
        "workoutTemplateId",
        "workoutTemplateId debe ser un entero positivo",
      );
      v.done();
      const template = getVisibleTemplate(Number(templateId), user);
      return json({
        workoutTemplateExercises: templateWithExercises(template).workoutTemplateExercises,
      });
    }),
  ),

  http.get(
    "*/api/workout-template-exercises/:id",
    route(({ params, user }) => {
      const { line } = getLineForUser(parseId(params.id), user);
      return json({
        workoutTemplateExercise: { ...line, exercise: findById("exercises", line.exerciseId) },
      });
    }),
  ),

  http.post(
    "*/api/workout-template-exercises",
    route(({ body, user }) => {
      const v = createValidator();
      v.check(
        isInt(body.workoutTemplateId, 1),
        "workoutTemplateId",
        "workoutTemplateId debe ser un entero positivo",
      );
      v.check(isInt(body.orden, 1), "orden", "orden debe ser un entero positivo");
      checkLine(v, body, "");
      v.done();

      const template = getVisibleTemplate(Number(body.workoutTemplateId), user);
      assertCanModify(template.userId, user, "una rutina");
      ensureExerciseUsable(Number(body.exerciseId), user, isGlobalResource(template.userId));
      ensureOrderAvailable(template.id, Number(body.orden));

      const line = insert("workoutTemplateExercises", {
        workoutTemplateId: template.id,
        exerciseId: Number(body.exerciseId),
        orden: Number(body.orden),
        repeticiones: Number(body.repeticiones),
        peso: toNumberOrNull(body.peso),
        rirObjetivo: toNumberOrNull(body.rirObjetivo),
        rpeObjetivo: toNumberOrNull(body.rpeObjetivo),
      });
      return json(
        { message: "Ejercicio agregado a la plantilla", workoutTemplateExercise: line },
        201,
      );
    }),
  ),

  http.put(
    "*/api/workout-template-exercises/:id",
    route(({ params, body, user }) => {
      const v = createValidator();
      checkLine(v, body, "", { partial: true });
      v.done();

      const { line, template } = getLineForUser(parseId(params.id), user);
      assertCanModify(template.userId, user, "una rutina");
      if (body.exerciseId !== undefined) {
        ensureExerciseUsable(Number(body.exerciseId), user, isGlobalResource(template.userId));
      }
      if (body.orden !== undefined) ensureOrderAvailable(template.id, Number(body.orden), line.id);

      update(line, {
        exerciseId: body.exerciseId !== undefined ? Number(body.exerciseId) : undefined,
        orden: body.orden !== undefined ? Number(body.orden) : undefined,
        repeticiones: body.repeticiones !== undefined ? Number(body.repeticiones) : undefined,
        peso: body.peso !== undefined ? toNumberOrNull(body.peso) : undefined,
        rirObjetivo: body.rirObjetivo !== undefined ? toNumberOrNull(body.rirObjetivo) : undefined,
        rpeObjetivo: body.rpeObjetivo !== undefined ? toNumberOrNull(body.rpeObjetivo) : undefined,
      });
      return json({ message: "Ejercicio de plantilla actualizado", workoutTemplateExercise: line });
    }),
  ),

  http.delete(
    "*/api/workout-template-exercises/:id",
    route(({ params, user }) => {
      const { line, template } = getLineForUser(parseId(params.id), user);
      assertCanModify(template.userId, user, "una rutina");
      removeWhere("workoutTemplateExercises", (row) => row.id === line.id);
      return json({ message: "Ejercicio quitado de la plantilla" });
    }),
  ),
];

export const routineHandlers = [...templateHandlers, ...lineHandlers];
