import { http } from "msw";
import {
  findById,
  getDb,
  insert,
  persist,
  programWithWeeks,
  removeWhere,
  update,
  weekWithSessions,
} from "../data/db";
import {
  assertCanModify,
  canReadResource,
  isGlobalResource,
  resolveOwnerId,
  visibleTo,
} from "../domain/permissions";
import {
  cleanText,
  createValidator,
  fail,
  isInt,
  isIsoDate,
  isPresent,
  json,
  optionalGlobal,
  optionalText,
  parseId,
  requiredText,
  route,
} from "../http";
import { getVisibleTemplate } from "./routines";

const ESTADOS = ["activo", "pausado", "finalizado"];
const LABEL = "un programa";

/** undefined = no modificar; null o "" = borrar la fecha; texto = fecha ISO. */
function parseOptionalDate(value) {
  if (value === undefined) return undefined;
  if (value === null || !String(value).trim()) return null;
  return new Date(value).toISOString();
}

function checkOptionalDate(v, body, field) {
  const value = body[field];
  if (!isPresent(value) || value === "") return;
  v.check(isIsoDate(value), field, `${field} debe ser una fecha valida`);
}

/** Desvincula los entrenamientos de las sesiones que se eliminan (se conservan). */
function unlinkWorkouts(sessionIds) {
  if (sessionIds.length === 0) return;
  getDb().workouts.forEach((workout) => {
    if (sessionIds.includes(workout.scheduledWorkoutId)) workout.scheduledWorkoutId = null;
  });
  persist();
}

function removeSessions(predicate) {
  const ids = getDb()
    .scheduledWorkouts.filter(predicate)
    .map((session) => session.id);
  unlinkWorkouts(ids);
  removeWhere("scheduledWorkouts", (session) => ids.includes(session.id));
}

/* -------------------------------- Programas -------------------------------- */

function getVisibleProgram(id, user) {
  const program = findById("trainingPrograms", id);
  if (!program || !visibleTo(user.id)(program))
    fail(404, "Programa de entrenamiento no encontrado");
  return program;
}

function getModifiableProgram(id, user) {
  const program = getVisibleProgram(id, user);
  assertCanModify(program.userId, user, LABEL);
  return program;
}

function validateProgramBody(body, { creating }) {
  const v = createValidator();
  if (creating) {
    requiredText(v, body, "nombre", "El nombre del programa");
    optionalGlobal(v, body);
  } else {
    optionalText(v, body, "nombre", "El nombre del programa", 2);
  }
  optionalText(v, body, "descripcion");
  optionalText(v, body, "objetivo");
  if (isPresent(body.estado)) {
    v.check(
      ESTADOS.includes(body.estado),
      "estado",
      "estado debe ser activo, pausado o finalizado",
    );
  }
  checkOptionalDate(v, body, "fechaInicio");
  checkOptionalDate(v, body, "fechaFin");
  v.done();
}

function assertDateOrder(inicio, fin) {
  if (inicio && fin && new Date(inicio) > new Date(fin)) {
    fail(400, "La fecha de finalizacion no puede ser anterior a la fecha de inicio");
  }
}

const programHandlers = [
  http.get(
    "*/api/training-programs",
    route(({ user }) => {
      const trainingPrograms = getDb()
        .trainingPrograms.filter(visibleTo(user.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
      return json({ trainingPrograms });
    }),
  ),

  http.get(
    "*/api/training-programs/:id",
    route(({ params, user }) =>
      json({ trainingProgram: programWithWeeks(getVisibleProgram(parseId(params.id), user)) }),
    ),
  ),

  http.post(
    "*/api/training-programs",
    route(({ body, user }) => {
      validateProgramBody(body, { creating: true });
      const ownerId = resolveOwnerId(user, body.global);
      const fechaInicio = parseOptionalDate(body.fechaInicio) ?? null;
      const fechaFin = parseOptionalDate(body.fechaFin) ?? null;
      assertDateOrder(fechaInicio, fechaFin);

      const trainingProgram = insert("trainingPrograms", {
        nombre: body.nombre.trim(),
        descripcion: cleanText(body.descripcion) ?? null,
        objetivo: cleanText(body.objetivo) ?? null,
        userId: ownerId,
        fechaInicio,
        fechaFin,
        estado: cleanText(body.estado) ?? "activo",
      });
      return json(
        { message: "Programa de entrenamiento creado exitosamente", trainingProgram },
        201,
      );
    }),
  ),

  http.put(
    "*/api/training-programs/:id",
    route(({ params, body, user }) => {
      const id = parseId(params.id);
      validateProgramBody(body, { creating: false });
      const program = getModifiableProgram(id, user);

      const fechaInicio = parseOptionalDate(body.fechaInicio);
      const fechaFin = parseOptionalDate(body.fechaFin);
      assertDateOrder(
        fechaInicio === undefined ? program.fechaInicio : fechaInicio,
        fechaFin === undefined ? program.fechaFin : fechaFin,
      );

      // update() ignora undefined: para borrar una fecha se asigna null explícitamente.
      update(program, {
        nombre: body.nombre?.trim(),
        descripcion: cleanText(body.descripcion),
        objetivo: cleanText(body.objetivo),
        estado: body.estado !== undefined ? (cleanText(body.estado) ?? "activo") : undefined,
      });
      if (fechaInicio !== undefined) program.fechaInicio = fechaInicio;
      if (fechaFin !== undefined) program.fechaFin = fechaFin;
      persist();

      return json({
        message: "Programa de entrenamiento actualizado exitosamente",
        trainingProgram: programWithWeeks(program),
      });
    }),
  ),

  http.delete(
    "*/api/training-programs/:id",
    route(({ params, user }) => {
      const id = parseId(params.id);
      getModifiableProgram(id, user);

      // Semanas y sesiones se eliminan en cascada; los entrenamientos realizados se conservan.
      const weekIds = getDb()
        .programWeeks.filter((week) => week.trainingProgramId === id)
        .map((week) => week.id);
      removeSessions((session) => weekIds.includes(session.programWeekId));
      removeWhere("programWeeks", (week) => week.trainingProgramId === id);
      removeWhere("trainingPrograms", (row) => row.id === id);
      return json({ message: "Programa de entrenamiento eliminado exitosamente" });
    }),
  ),
];

/* --------------------------------- Semanas --------------------------------- */

function getWeek(id) {
  const week = findById("programWeeks", id);
  if (!week) fail(404, "Semana de programa no encontrada");
  return week;
}

function ensureWeekNumberAvailable(trainingProgramId, numeroSemana, excludeId) {
  const existing = getDb().programWeeks.find(
    (week) =>
      week.trainingProgramId === trainingProgramId &&
      week.numeroSemana === numeroSemana &&
      week.id !== excludeId,
  );
  if (existing) fail(409, `Ya existe la semana ${numeroSemana} en este programa`);
}

function validateWeekBody(body, { creating }) {
  const v = createValidator();
  for (const field of ["trainingProgramId", "numeroSemana"]) {
    if (creating || body[field] !== undefined) {
      v.check(isInt(body[field], 1), field, `${field} debe ser un entero positivo`);
    }
  }
  optionalText(v, body, "nombre");
  optionalText(v, body, "objetivo");
  optionalText(v, body, "notas");
  if (body.esDescarga !== undefined) {
    v.check(typeof body.esDescarga === "boolean", "esDescarga", "esDescarga debe ser booleano");
  }
  v.done();
}

const weekHandlers = [
  http.get(
    "*/api/program-weeks",
    route(({ query, user }) => {
      const v = createValidator();
      const programId = query.get("trainingProgramId");
      v.check(
        isInt(programId, 1),
        "trainingProgramId",
        "trainingProgramId debe ser un entero positivo",
      );
      v.done();
      return json({
        programWeeks: programWithWeeks(getVisibleProgram(Number(programId), user)).weeks,
      });
    }),
  ),

  http.get(
    "*/api/program-weeks/:id",
    route(({ params, user }) => {
      const week = getWeek(parseId(params.id));
      getVisibleProgram(week.trainingProgramId, user);
      return json({ programWeek: weekWithSessions(week) });
    }),
  ),

  http.post(
    "*/api/program-weeks",
    route(({ body, user }) => {
      validateWeekBody(body, { creating: true });
      const trainingProgramId = Number(body.trainingProgramId);
      const numeroSemana = Number(body.numeroSemana);
      getModifiableProgram(trainingProgramId, user);
      ensureWeekNumberAvailable(trainingProgramId, numeroSemana);

      const programWeek = insert("programWeeks", {
        trainingProgramId,
        numeroSemana,
        nombre: cleanText(body.nombre) ?? null,
        objetivo: cleanText(body.objetivo) ?? null,
        notas: cleanText(body.notas) ?? null,
        esDescarga: body.esDescarga ?? false,
      });
      return json({ message: "Semana de programa creada exitosamente", programWeek }, 201);
    }),
  ),

  http.put(
    "*/api/program-weeks/:id",
    route(({ params, body, user }) => {
      const id = parseId(params.id);
      validateWeekBody(body, { creating: false });
      const week = getWeek(id);
      getModifiableProgram(week.trainingProgramId, user);

      const targetProgramId =
        body.trainingProgramId !== undefined
          ? Number(body.trainingProgramId)
          : week.trainingProgramId;
      if (targetProgramId !== week.trainingProgramId) getModifiableProgram(targetProgramId, user);
      const numeroSemana =
        body.numeroSemana !== undefined ? Number(body.numeroSemana) : week.numeroSemana;
      ensureWeekNumberAvailable(targetProgramId, numeroSemana, id);

      update(week, {
        trainingProgramId: targetProgramId,
        numeroSemana,
        nombre: cleanText(body.nombre),
        objetivo: cleanText(body.objetivo),
        notas: cleanText(body.notas),
        esDescarga: body.esDescarga,
      });
      return json({ message: "Semana de programa actualizada exitosamente", programWeek: week });
    }),
  ),

  http.delete(
    "*/api/program-weeks/:id",
    route(({ params, user }) => {
      const id = parseId(params.id);
      const week = getWeek(id);
      getModifiableProgram(week.trainingProgramId, user);
      removeSessions((session) => session.programWeekId === id);
      removeWhere("programWeeks", (row) => row.id === id);
      return json({ message: "Semana de programa eliminada exitosamente" });
    }),
  ),
];

/* -------------------------------- Sesiones -------------------------------- */

function getVisibleWeekWithProgram(programWeekId, user) {
  const week = findById("programWeeks", programWeekId);
  const program = week ? findById("trainingPrograms", week.trainingProgramId) : null;
  if (!week || !program || !canReadResource(program.userId, user.id)) {
    fail(404, "Semana de programa no encontrada");
  }
  return { week, program };
}

function getModifiableWeekWithProgram(programWeekId, user) {
  const result = getVisibleWeekWithProgram(programWeekId, user);
  assertCanModify(result.program.userId, user, LABEL);
  return result;
}

/** Un programa global solo puede referenciar rutinas globales. */
function ensureTemplateUsable(workoutTemplateId, user, programIsGlobal) {
  const template = getVisibleTemplate(workoutTemplateId, user);
  if (programIsGlobal && !isGlobalResource(template.userId)) {
    fail(400, "Un programa global solo puede usar rutinas globales");
  }
}

function ensureOrderAvailable(programWeekId, orden, excludeId) {
  const existing = getDb().scheduledWorkouts.find(
    (session) =>
      session.programWeekId === programWeekId &&
      session.orden === orden &&
      session.id !== excludeId,
  );
  if (existing) fail(409, `Ya existe una sesion con el orden ${orden} en esta semana`);
}

function getSession(id) {
  const session = findById("scheduledWorkouts", id);
  if (!session) fail(404, "Entrenamiento programado no encontrado");
  return session;
}

function validateSessionBody(body, { creating }) {
  const v = createValidator();
  for (const field of ["programWeekId", "workoutTemplateId", "orden"]) {
    if (creating || body[field] !== undefined) {
      v.check(isInt(body[field], 1), field, `${field} debe ser un entero positivo`);
    }
  }
  if (creating) requiredText(v, body, "nombre", "El nombre del entrenamiento programado");
  else optionalText(v, body, "nombre", "El nombre del entrenamiento programado", 2);
  if (isPresent(body.diaSemana)) {
    v.check(isInt(body.diaSemana, 1, 7), "diaSemana", "diaSemana debe ser un entero entre 1 y 7");
  }
  checkOptionalDate(v, body, "fechaProgramada");
  optionalText(v, body, "notas");
  v.done();
}

const sessionHandlers = [
  http.get(
    "*/api/scheduled-workouts",
    route(({ query, user }) => {
      const v = createValidator();
      const weekId = query.get("programWeekId");
      v.check(isInt(weekId, 1), "programWeekId", "programWeekId debe ser un entero positivo");
      v.done();
      const { week } = getVisibleWeekWithProgram(Number(weekId), user);
      return json({ scheduledWorkouts: weekWithSessions(week).scheduledWorkouts });
    }),
  ),

  http.get(
    "*/api/scheduled-workouts/:id",
    route(({ params, user }) => {
      const session = getSession(parseId(params.id));
      getVisibleWeekWithProgram(session.programWeekId, user);
      return json({
        scheduledWorkout: {
          ...session,
          workoutTemplate: findById("workoutTemplates", session.workoutTemplateId),
        },
      });
    }),
  ),

  http.post(
    "*/api/scheduled-workouts",
    route(({ body, user }) => {
      validateSessionBody(body, { creating: true });
      const programWeekId = Number(body.programWeekId);
      const { program } = getModifiableWeekWithProgram(programWeekId, user);
      ensureTemplateUsable(Number(body.workoutTemplateId), user, isGlobalResource(program.userId));
      ensureOrderAvailable(programWeekId, Number(body.orden));

      const scheduledWorkout = insert("scheduledWorkouts", {
        programWeekId,
        workoutTemplateId: Number(body.workoutTemplateId),
        nombre: body.nombre.trim(),
        diaSemana: isPresent(body.diaSemana) ? Number(body.diaSemana) : null,
        fechaProgramada: parseOptionalDate(body.fechaProgramada) ?? null,
        orden: Number(body.orden),
        notas: cleanText(body.notas) ?? null,
      });
      return json(
        { message: "Entrenamiento programado creado exitosamente", scheduledWorkout },
        201,
      );
    }),
  ),

  http.put(
    "*/api/scheduled-workouts/:id",
    route(({ params, body, user }) => {
      const id = parseId(params.id);
      validateSessionBody(body, { creating: false });
      const session = getSession(id);
      let { program } = getModifiableWeekWithProgram(session.programWeekId, user);

      const targetWeekId =
        body.programWeekId !== undefined ? Number(body.programWeekId) : session.programWeekId;
      if (targetWeekId !== session.programWeekId) {
        ({ program } = getModifiableWeekWithProgram(targetWeekId, user));
      }
      if (body.workoutTemplateId !== undefined) {
        ensureTemplateUsable(
          Number(body.workoutTemplateId),
          user,
          isGlobalResource(program.userId),
        );
      }
      const orden = body.orden !== undefined ? Number(body.orden) : session.orden;
      ensureOrderAvailable(targetWeekId, orden, id);

      update(session, {
        programWeekId: targetWeekId,
        workoutTemplateId:
          body.workoutTemplateId !== undefined ? Number(body.workoutTemplateId) : undefined,
        nombre: body.nombre?.trim(),
        orden,
        notas: cleanText(body.notas),
      });
      // Campos que se pueden vaciar (null) explícitamente.
      if (body.diaSemana !== undefined) {
        session.diaSemana = isPresent(body.diaSemana) ? Number(body.diaSemana) : null;
      }
      const fecha = parseOptionalDate(body.fechaProgramada);
      if (fecha !== undefined) session.fechaProgramada = fecha;
      persist();

      return json({
        message: "Entrenamiento programado actualizado exitosamente",
        scheduledWorkout: session,
      });
    }),
  ),

  http.delete(
    "*/api/scheduled-workouts/:id",
    route(({ params, user }) => {
      const id = parseId(params.id);
      const session = getSession(id);
      getModifiableWeekWithProgram(session.programWeekId, user);
      removeSessions((row) => row.id === id);
      return json({ message: "Entrenamiento programado eliminado exitosamente" });
    }),
  ),
];

export const planningHandlers = [...programHandlers, ...weekHandlers, ...sessionHandlers];
