// Prototipo: por defecto la API es /api en el mismo origen y la responde el mock (MSW).
const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

export const TOKEN_KEY = "token";
export const USER_KEY = "user";

export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Arma un mensaje legible a partir de la respuesta de error de la API.
 * Si hay errores de validación por campo, los muestra en lugar del genérico "Datos invalidos".
 */
export function buildErrorMessage(data, status) {
  const details = Array.isArray(data?.details) ? data.details : [];
  const detailMessages = [...new Set(details.map((detail) => detail.message).filter(Boolean))];

  if (detailMessages.length > 0) {
    return detailMessages.join(". ");
  }

  if (data?.error) return data.error;
  if (data?.message) return data.message;
  if (status >= 500) return "El servidor no está disponible. Intentá nuevamente en unos minutos.";
  return "No se pudo completar la solicitud";
}

export function toQueryString(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  );
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revisá tu conexión.", 0);
  }

  // Solo una sesión existente puede vencer: un 401 en el login no debe disparar el cierre.
  if (response.status === 401 && token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(buildErrorMessage(data, response.status), response.status, data?.details);
  }

  return data;
}

export function jsonBody(payload) {
  return JSON.stringify(payload);
}

export { API_BASE_URL };
