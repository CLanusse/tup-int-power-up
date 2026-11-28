import { expect } from "@playwright/test";

export const DEMO = { email: "demo@powerup.com", password: "Demo1234!" };
export const ADMIN = { email: "admin@powerup.com", password: "Admin1234!" };

export function unique(prefix) {
  return `${prefix} ${Date.now().toString(36)}`;
}

export async function login(page, { email, password }) {
  await page.goto("/acceso");
  await page.getByPlaceholder("Correo electrónico").fill(email);
  await page.getByPlaceholder("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).last().click();
  await expect(page.getByRole("button", { name: /Cerrar sesión/ })).toBeVisible();
}

export async function register(page, { nombre, email, password }) {
  await page.goto("/acceso");
  await page.getByRole("button", { name: "Registrarse" }).first().click();
  await page.getByPlaceholder("Nombre").fill(nombre);
  await page.getByPlaceholder("Correo electrónico").fill(email);
  await page.getByPlaceholder("Contraseña", { exact: true }).fill(password);
  await page.getByPlaceholder("Confirmar contraseña").fill(password);
  await page.getByRole("button", { name: "Registrarse" }).last().click();
  await expect(page.getByRole("heading", { name: `Hola, ${nombre.split(" ")[0]}` })).toBeVisible();
}

export async function logout(page) {
  await page.getByRole("button", { name: /Cerrar sesión/ }).click();
  await expect(page).toHaveURL(/\/acceso/);
}
