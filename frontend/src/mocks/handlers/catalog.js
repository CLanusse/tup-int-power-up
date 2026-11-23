import { http } from "msw";
import {
  exerciseWithGroups,
  findById,
  getDb,
  insert,
  persist,
  removeWhere,
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
  isPresent,
  isText,
  json,
  optionalGlobal,
  optionalText,
  parseId,
  requiredText,
  route,
} from "../http";

const DIFICULTADES = ["principiante", "intermedio", "avanzado"];
const byName = (a, b) => a.nombre.localeCompare(b.nombre, "es");

/* ---------------------------- Grupos musculares ---------------------------- */

function getVisibleMuscleGroup(id, user) {
  const group = findById("muscleGroups", id);
  if (!group || !visibleTo(user.id)(group)) fail(404, "Grupo muscular no encontrado");
  return group;
}

/**
 * Evita nombres duplicados visibles: un grupo personal no puede repetir uno
 * global ni otro propio; un grupo global no puede repetir otro global.
 */
function ensureUniqueGroupName(nombre, ownerId, excludeId) {
  const target = nombre.trim().toLowerCase();
  const duplicated = getDb().muscleGroups.find(
    (group) =>
      group.id !== excludeId &&
      group.nombre.toLowerCase() === target &&
      (group.userId === null || (ownerId !== null && group.userId === ownerId)),
  );
  if (duplicated) fail(409, `Ya existe un grupo muscular llamado "${duplicated.nombre}"`);
}

const muscleGroupHandlers = [
  http.get(
    "*/api/muscle-groups",
    route(({ user }) =>
      json({ muscleGroups: getDb().muscleGroups.filter(visibleTo(user.id)).sort(byName) }),
    ),
  ),

  http.get(
    "*/api/muscle-groups/:id",
    route(({ params, user }) =>
      json({ muscleGroup: getVisibleMuscleGroup(parseId(params.id), user) }),
    ),
  ),

  http.post(
    "*/api/muscle-groups",
    route(({ body, user }) => {
      const v = createValidator();
      requiredText(v, body, "nombre", "El nombre del grupo muscular");
      optionalGlobal(v, body);
      v.done();

      const ownerId = resolveOwnerId(user, body.global);
      const nombre = body.nombre.trim();
      ensureUniqueGroupName(nombre, ownerId);

      const muscleGroup = insert("muscleGroups", { nombre, userId: ownerId });
      return json({ message: "Grupo muscular creado exitosamente", muscleGroup }, 201);
    }),
  ),

  http.put(
    "*/api/muscle-groups/:id",
    route(({ params, body, user }) => {
      const id = parseId(params.id);
      const v = createValidator();
      optionalText(v, body, "nombre", "El nombre del grupo muscular", 2);
      v.done();

      const group = getVisibleMuscleGroup(id, user);
      assertCanModify(group.userId, user, "un grupo muscular");
      if (body.nombre !== undefined) ensureUniqueGroupName(body.nombre, group.userId, id);

      update(group, { nombre: body.nombre?.trim() });
      return json({ message: "Grupo muscular actualizado exitosamente", muscleGroup: group });
    }),
  ),

  http.delete(
    "*/api/muscle-groups/:id",
    route(({ params, user }) => {
      const id = parseId(params.id);
      const group = getVisibleMuscleGroup(id, user);
      assertCanModify(group.userId, user, "un grupo muscular");

      // La relación con ejercicios se elimina en cascada; los ejercicios se conservan.
      removeWhere("exerciseMuscleGroups", (link) => link.muscleGroupId === id);
      removeWhere("muscleGroups", (row) => row.id === id);
      return json({ message: "Grupo muscular eliminado exitosamente" });
    }),
  ),
];

/* -------------------------------- Ejercicios -------------------------------- */

function getVisibleExercise(id, user) {
  const exercise = findById("exercises", id);
  if (!exercise || !visibleTo(user.id)(exercise)) fail(404, "Ejercicio no encontrado");
  return exercise;
}

function validateExerciseBody(body, { creating }) {
  const v = createValidator();
  if (creating) {
    requiredText(v, body, "nombre", "El nombre del ejercicio");
    optionalGlobal(v, body);
  } else {
    optionalText(v, body, "nombre", "El nombre del ejercicio", 2);
  }
  optionalText(v, body, "descripcion");

  if (body.imagen) {
    if (v.check(isText(body.imagen), "imagen", "imagen debe ser texto")) {
      v.check(
        /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(body.imagen.trim()),
        "imagen",
        "imagen debe ser una URL http(s) valida",
      );
    }
  }

  if (isPresent(body.dificultad)) {
    v.check(
      DIFICULTADES.includes(body.dificultad),
      "dificultad",
      "dificultad debe ser principiante, intermedio o avanzado",
    );
  }

  if (body.muscleGroupIds !== undefined) {
    if (
      v.check(
        Array.isArray(body.muscleGroupIds),
        "muscleGroupIds",
        "muscleGroupIds debe ser un arreglo",
      )
    ) {
      v.check(
        body.muscleGroupIds.every((id) => isInt(id, 1)),
        "muscleGroupIds",
        "muscleGroupIds debe contener enteros positivos",
      );
    }
  }
  v.done();
}

/**
 * Verifica que los grupos existan y sean visibles. Un ejercicio global solo
 * puede asociarse a grupos globales.
 */
function validateMuscleGroups(muscleGroupIds, user, exerciseIsGlobal) {
  if (muscleGroupIds === undefined) return undefined;

  const uniqueIds = [...new Set(muscleGroupIds.map(Number))];
  const groups = getDb().muscleGroups.filter(
    (group) => uniqueIds.includes(group.id) && visibleTo(user.id)(group),
  );

  if (groups.length !== uniqueIds.length) {
    const found = new Set(groups.map((group) => group.id));
    fail(400, `Grupo muscular ${uniqueIds.find((id) => !found.has(id))} no encontrado`);
  }

  if (exerciseIsGlobal && groups.some((group) => !isGlobalResource(group.userId))) {
    fail(400, "Un ejercicio global solo puede usar grupos musculares globales");
  }

  return uniqueIds;
}

function replaceExerciseGroups(exerciseId, groupIds) {
  const db = getDb();
  db.exerciseMuscleGroups = db.exerciseMuscleGroups
    .filter((link) => link.exerciseId !== exerciseId)
    .concat(groupIds.map((muscleGroupId) => ({ exerciseId, muscleGroupId })));
  persist();
}

const exerciseHandlers = [
  http.get(
    "*/api/exercises",
    route(({ user, query }) => {
      const db = getDb();
      let exercises = db.exercises.filter(visibleTo(user.id));

      const muscleGroupId = query.get("muscleGroupId");
      if (muscleGroupId) {
        const v = createValidator();
        v.check(
          isInt(muscleGroupId, 1),
          "muscleGroupId",
          "muscleGroupId debe ser un entero positivo",
        );
        v.done();
        const groupId = getVisibleMuscleGroup(Number(muscleGroupId), user).id;
        const ids = db.exerciseMuscleGroups
          .filter((link) => link.muscleGroupId === groupId)
          .map((link) => link.exerciseId);
        exercises = exercises.filter((exercise) => ids.includes(exercise.id));
      }

      return json({ exercises: exercises.sort(byName).map(exerciseWithGroups) });
    }),
  ),

  http.get(
    "*/api/exercises/:id",
    route(({ params, user }) =>
      json({ exercise: exerciseWithGroups(getVisibleExercise(parseId(params.id), user)) }),
    ),
  ),

  http.post(
    "*/api/exercises",
    route(({ body, user }) => {
      validateExerciseBody(body, { creating: true });
      const ownerId = resolveOwnerId(user, body.global);
      const groupIds = validateMuscleGroups(body.muscleGroupIds, user, ownerId === null);

      const exercise = insert("exercises", {
        nombre: body.nombre.trim(),
        descripcion: cleanText(body.descripcion) ?? null,
        userId: ownerId,
        dificultad: body.dificultad || null,
        imagen: cleanText(body.imagen) ?? null,
      });
      if (groupIds) replaceExerciseGroups(exercise.id, groupIds);

      return json(
        { message: "Ejercicio creado exitosamente", exercise: exerciseWithGroups(exercise) },
        201,
      );
    }),
  ),

  http.put(
    "*/api/exercises/:id",
    route(({ params, body, user }) => {
      const id = parseId(params.id);
      validateExerciseBody(body, { creating: false });

      const exercise = getVisibleExercise(id, user);
      assertCanModify(exercise.userId, user, "un ejercicio");
      const groupIds = validateMuscleGroups(
        body.muscleGroupIds,
        user,
        isGlobalResource(exercise.userId),
      );

      update(exercise, {
        nombre: body.nombre?.trim(),
        descripcion: cleanText(body.descripcion),
        dificultad: body.dificultad !== undefined ? body.dificultad || null : undefined,
        imagen: body.imagen !== undefined ? cleanText(body.imagen) : undefined,
      });
      if (groupIds) replaceExerciseGroups(id, groupIds);

      return json({
        message: "Ejercicio actualizado exitosamente",
        exercise: exerciseWithGroups(exercise),
      });
    }),
  ),

  http.delete(
    "*/api/exercises/:id",
    route(({ params, user }) => {
      const id = parseId(params.id);
      const exercise = getVisibleExercise(id, user);
      assertCanModify(exercise.userId, user, "un ejercicio");

      // Integridad del historial: no se borra un ejercicio con series o en rutinas.
      const db = getDb();
      const workoutSets = db.workoutSets.filter((set) => set.exerciseId === id).length;
      if (workoutSets > 0) {
        fail(
          409,
          `No se puede eliminar: el ejercicio tiene ${workoutSets} series registradas en entrenamientos`,
        );
      }

      const templates = new Set(
        db.workoutTemplateExercises
          .filter((line) => line.exerciseId === id)
          .map((line) => line.workoutTemplateId),
      ).size;
      if (templates > 0) {
        fail(
          409,
          `No se puede eliminar: el ejercicio forma parte de ${templates} rutina(s). Quitalo de las rutinas primero`,
        );
      }

      removeWhere("exerciseMuscleGroups", (link) => link.exerciseId === id);
      removeWhere("exercises", (row) => row.id === id);
      return json({ message: "Ejercicio eliminado exitosamente" });
    }),
  ),
];

export const catalogHandlers = [...muscleGroupHandlers, ...exerciseHandlers];
