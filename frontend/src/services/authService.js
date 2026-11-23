import { apiRequest, jsonBody } from "./api";

export function login(email, password) {
  return apiRequest("/auth/login", { method: "POST", body: jsonBody({ email, password }) });
}

export function register(nombre, email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: jsonBody({ nombre, email, password }),
  });
}
