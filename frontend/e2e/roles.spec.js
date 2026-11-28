import { expect, test } from "@playwright/test";
import { ADMIN, DEMO, login, logout, unique } from "./helpers";

test("el admin publica un ejercicio global que los usuarios ven pero no pueden editar", async ({
  page,
}) => {
  const nombre = unique("Press Pallof");

  await login(page, ADMIN);
  await expect(page.getByText("Admin", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Ejercicios" }).click();
  await page.getByRole("button", { name: "Nuevo ejercicio" }).click();
  const form = page.getByRole("form", { name: "Formulario de ejercicio" });
  await form.getByLabel("Nombre").fill(nombre);
  await form.getByLabel(/Publicar en el catálogo global/).check();
  await form.getByLabel("Abdomen").check();
  await form.getByRole("button", { name: "Crear ejercicio" }).click();
  await expect(page.getByText(`Se creó ${nombre}.`)).toBeVisible();

  await logout(page);
  await login(page, DEMO);
  await page.getByRole("link", { name: "Ejercicios" }).click();
  await page.getByPlaceholder("Buscar ejercicio").fill(nombre);
  const item = page.getByRole("button", { name: new RegExp(`^${nombre}`) });
  await expect(item).toContainText("PowerUp");
  await item.click();
  await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
});

test("solo el admin accede a la gestión de usuarios", async ({ page }) => {
  await login(page, DEMO);
  await expect(page.getByRole("link", { name: "Usuarios" })).toHaveCount(0);
  await page.goto("/admin/usuarios");
  await expect(page).toHaveURL(/\/$/);

  await logout(page);
  await login(page, ADMIN);
  await page.getByRole("link", { name: "Usuarios" }).click();
  const fila = page.getByRole("row", { name: /demo@powerup\.com/ });
  await expect(fila).toContainText("Usuario");
  await expect(page.getByRole("row", { name: /\(vos\)/ }).getByRole("button")).toHaveCount(0);
});

test("la cuenta demo muestra su historial, plan y métricas", async ({ page }) => {
  await login(page, DEMO);

  await expect(page.getByRole("region", { name: "Plan en curso" })).toContainText(
    "Hipertrofia base 4 semanas",
  );

  await page.getByRole("link", { name: "Historial" }).click();
  // Entre 9 y 12 sesiones según el día: la semana 3 siempre está en la primera página.
  await expect(page.getByRole("link", { name: /^Demo - Semana 3 - Full body/ })).toBeVisible();

  await page.getByRole("link", { name: "Planes" }).click();
  await expect(page.getByText(/% cumplido/)).toBeVisible();

  await page.getByRole("link", { name: "Mi progreso" }).click();
  await expect(page.getByRole("heading", { name: "Volumen por grupo muscular" })).toBeVisible();
  await expect(page.locator("canvas").first()).toBeVisible();
});
