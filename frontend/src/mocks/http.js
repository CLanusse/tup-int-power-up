import { delay, HttpResponse } from "msw";
import { findById } from "./data/db";

/**
 * Utilidades compartidas por los handlers de la API simulada.
 * Reproducen el contrato del backend: mismos códigos HTTP, mismo formato de
 * error ({ error, details }) y autenticación con un JWT en el header Authorization.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Latencia simulada para que se vean los estados de carga. En los tests es 0. */
const LATENCY_MS =
  import.meta.env.MODE === "test" ? 0 : Number(import.meta.env.VITE_MOCK_DELAY ?? 300);

export class MockApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function fail(status, message) {
  throw new MockApiError(message, status);
}

export function json(data, status = 200) {
  return HttpResponse.json(data, { status });
}

/* ---------------------------------- JWT ---------------------------------- */

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(text) {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Genera un token con la misma forma que un JWT real (firma simulada). */
export function generarToken(user) {
  const iat = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlEncode({
    id: user.id,
    email: user.email,
    rol: user.rol,
    iat,
    exp: iat + TOKEN_TTL_MS / 1000,
  });
  return `${header}.${payload}.mock-signature`;
}

function leerPayload(token) {
  try {
    const [, payload, signature] = token.split(".");
    if (signature !== "mock-signature") return null;
    const data = base64UrlDecode(payload);
    if (!data?.id || data.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Verifica el token y carga el usuario desde la base, como el middleware del
 * backend: un cambio de rol tiene efecto inmediato.
 */
export function authenticate(request) {
  const header = request.headers.get("Authorization");
  if (!header) fail(401, "Token no proporcionado");

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) fail(401, "Formato de token invalido");

  const payload = leerPayload(token);
  if (!payload) fail(401, "Token invalido o expirado");

  const user = findById("users", Number(payload.id));
  if (!user) fail(401, "La cuenta asociada al token ya no existe");

  return { id: user.id, email: user.email, rol: user.rol };
}

/* ------------------------------ Validación ------------------------------ */

export const isPresent = (value) => value !== undefined && value !== null;
export const isText = (value) => typeof value === "string";
export const isInt = (value, min = -Infinity, max = Infinity) => {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Number.isInteger(number) && number >= min && number <= max;
};
export const isNumber = (value, min = -Infinity, max = Infinity) => {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number >= min && number <= max;
};
export const isIsoDate = (value) =>
  isText(value) && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
export const isEmail = (value) => isText(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isTimeZone = (value) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

/** Acumula errores por campo y responde 400 "Datos invalidos" como express-validator. */
export function createValidator() {
  const details = [];
  return {
    check(condition, field, message) {
      if (!condition) details.push({ field, message });
      return condition;
    },
    done() {
      if (details.length > 0) throw new MockApiError("Datos invalidos", 400, details);
    },
  };
}

/** Texto obligatorio con al menos 2 caracteres. */
export function requiredText(v, body, field, label) {
  const value = body[field];
  if (!v.check(isText(value), field, `${label} debe ser texto`)) return;
  if (!v.check(value.trim() !== "", field, `${label} es obligatorio`)) return;
  v.check(value.trim().length >= 2, field, `${label} debe tener al menos 2 caracteres`);
}

/** Texto opcional (undefined o null permitidos). */
export function optionalText(v, body, field, label = field, minLength = 0) {
  const value = body[field];
  if (!isPresent(value)) return;
  if (!v.check(isText(value), field, `${label} debe ser texto`)) return;
  if (minLength > 0) {
    v.check(
      value.trim().length >= minLength,
      field,
      `${label} debe tener al menos ${minLength} caracteres`,
    );
  }
}

export function optionalGlobal(v, body) {
  if (body.global === undefined) return;
  v.check(typeof body.global === "boolean", "global", "global debe ser booleano");
}

/** Convierte texto opcional: undefined = no modificar, vacío = null. */
export function cleanText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim() || null;
}

export function toNumberOrNull(value) {
  return isPresent(value) && value !== "" ? Number(value) : null;
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new MockApiError("Datos invalidos", 400, [
      { field: "id", message: "id debe ser un entero positivo" },
    ]);
  }
  return id;
}

/** Valida from/to opcionales de un query string y los devuelve como Date. */
export function parseRange(query) {
  const v = createValidator();
  const from = query.get("from") || undefined;
  const to = query.get("to") || undefined;
  if (from) v.check(isIsoDate(from), "from", "from debe ser una fecha valida");
  if (to) v.check(isIsoDate(to), "to", "to debe ser una fecha valida");
  v.done();

  const range = { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined };
  if (range.from && range.to && range.from > range.to) {
    fail(400, "from no puede ser posterior a to");
  }
  return range;
}

/* -------------------------------- Rutas -------------------------------- */

async function readBody(request) {
  if (!["POST", "PUT", "PATCH"].includes(request.method)) return {};
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new MockApiError("El cuerpo de la solicitud no es un JSON valido", 400);
  }
}

/**
 * Envuelve un handler: aplica latencia, autenticación, rol requerido y
 * traduce los errores al formato de la API.
 */
export function route(handler, { auth = true, role } = {}) {
  return async (info) => {
    if (LATENCY_MS > 0) await delay(LATENCY_MS);

    try {
      const user = auth ? authenticate(info.request) : null;
      if (role && user.rol !== role) fail(403, "No tenés permisos para realizar esta acción");

      const body = await readBody(info.request);
      const query = new URL(info.request.url).searchParams;
      return await handler({ ...info, user, body, query });
    } catch (error) {
      if (error instanceof MockApiError) {
        const payload = { error: error.message };
        if (error.details) payload.details = error.details;
        return json(payload, error.status);
      }
      console.error("[API simulada]", error);
      return json({ error: "Error interno del servidor" }, 500);
    }
  };
}
