import { http } from "msw";
import { findById, getDb, insert, serializeUser, update } from "../data/db";
import {
  createValidator,
  fail,
  generarToken,
  isEmail,
  isPresent,
  isText,
  json,
  parseId,
  route,
} from "../http";

const normalizeEmail = (email) => email.trim().toLowerCase();

function checkEmail(v, body, { required }) {
  const { email } = body;
  if (!required && email === undefined) return;
  if (!v.check(isText(email), "email", "El email debe ser texto")) return;
  if (!v.check(email.trim() !== "", "email", "El email es obligatorio")) return;
  v.check(isEmail(email), "email", "El email debe tener un formato valido");
}

function checkNombre(v, body, { required }) {
  const { nombre } = body;
  if (!required && nombre === undefined) return;
  if (!v.check(isText(nombre), "nombre", "El nombre debe ser texto")) return;
  if (!v.check(nombre.trim() !== "", "nombre", "El nombre es obligatorio")) return;
  const length = nombre.trim().length;
  v.check(length >= 2 && length <= 100, "nombre", "El nombre debe tener entre 2 y 100 caracteres");
}

function checkNewPassword(v, body, field) {
  const value = body[field];
  if (!v.check(isText(value), field, "La password debe ser texto")) return;
  v.check(
    value.length >= 6 && value.length <= 100,
    field,
    "La password debe tener entre 6 y 100 caracteres",
  );
}

function ensureEmailAvailable(email, excludeUserId) {
  const taken = getDb().users.some((user) => user.email === email && user.id !== excludeUserId);
  if (taken) fail(409, "El email ya esta registrado");
}

function getUserOrFail(id) {
  const user = findById("users", id);
  if (!user) fail(404, "Usuario no encontrado");
  return user;
}

export const authHandlers = [
  http.get(
    "*/api/health",
    route(() => json({ status: "ok", mode: "mock", timestamp: new Date().toISOString() }), {
      auth: false,
    }),
  ),

  http.post(
    "*/api/auth/register",
    route(
      ({ body }) => {
        const v = createValidator();
        checkNombre(v, body, { required: true });
        checkEmail(v, body, { required: true });
        checkNewPassword(v, body, "password");
        v.done();

        const email = normalizeEmail(body.email);
        ensureEmailAvailable(email);

        // El rol nunca se toma del body: toda cuenta nueva es "usuario".
        const user = insert("users", {
          nombre: body.nombre.trim(),
          email,
          password: body.password,
          rol: "usuario",
        });

        return json(
          {
            message: "Usuario registrado exitosamente",
            user: serializeUser(user),
            token: generarToken(user),
          },
          201,
        );
      },
      { auth: false },
    ),
  ),

  http.post(
    "*/api/auth/login",
    route(
      ({ body }) => {
        const v = createValidator();
        checkEmail(v, body, { required: true });
        if (v.check(isText(body.password), "password", "La password debe ser texto")) {
          v.check(body.password !== "", "password", "La password es obligatoria");
        }
        v.done();

        const email = normalizeEmail(body.email);
        const user = getDb().users.find((candidate) => candidate.email === email);
        if (!user || user.password !== body.password) fail(401, "Credenciales invalidas");

        return json({
          message: "Login exitoso",
          user: serializeUser(user),
          token: generarToken(user),
        });
      },
      { auth: false },
    ),
  ),
];

const ROLES = ["usuario", "admin"];

export const userHandlers = [
  // El admin solo ve datos de cuenta y la cantidad de entrenamientos, nunca su contenido.
  http.get(
    "*/api/users",
    route(
      () => {
        const db = getDb();
        const users = [...db.users]
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
          .map((account) => ({
            ...serializeUser(account),
            workoutCount: db.workouts.filter((workout) => workout.userId === account.id).length,
          }));
        return json({ users });
      },
      { role: "admin" },
    ),
  ),

  http.patch(
    "*/api/users/:id/rol",
    route(
      ({ params, body, user }) => {
        const id = parseId(params.id);
        const v = createValidator();
        v.check(
          isPresent(body.rol) && ROLES.includes(body.rol),
          "rol",
          `rol debe ser uno de: ${ROLES.join(", ")}`,
        );
        v.done();

        if (id === user.id && body.rol !== "admin") {
          fail(400, "No podés quitarte tu propio rol de administrador");
        }

        const target = getUserOrFail(id);
        if (target.rol === "admin" && body.rol !== "admin") {
          const admins = getDb().users.filter((account) => account.rol === "admin").length;
          if (admins <= 1) fail(400, "Debe quedar al menos un administrador");
        }

        update(target, { rol: body.rol });
        return json({ message: "Rol actualizado exitosamente", user: serializeUser(target) });
      },
      { role: "admin" },
    ),
  ),
];
