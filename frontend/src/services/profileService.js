import { apiRequest, jsonBody } from "./api";

export async function getProfile() {
  const data = await apiRequest("/auth/perfil");
  return data.user;
}

/** Devuelve { user, token }: el token se renueva porque incluye el email. */
export function updateProfile(payload) {
  return apiRequest("/auth/perfil", { method: "PUT", body: jsonBody(payload) });
}

export function changePassword(passwordActual, passwordNueva) {
  return apiRequest("/auth/password", {
    method: "PUT",
    body: jsonBody({ passwordActual, passwordNueva }),
  });
}
