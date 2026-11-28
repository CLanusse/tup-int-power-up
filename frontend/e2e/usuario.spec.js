import { expect, test } from "@playwright/test";
import { register, unique } from "./helpers";

test("una cuenta nueva arma su catálogo, una rutina y registra un entrenamiento", async ({
  page,
}) => {
  const suffix = Date.now().toString(36);
  const nombreEjercicio = unique("Remo con banda");
  const nombreRutina = unique("Espalda en casa");

  await register(page, {
    nombre: "Lucía Test",
    email: `lucia.${suffix}@test.com`,
    password: "Clave123!",
  });

  // Cuenta nueva: dashboard sin actividad.
  await expect(page.getByRole("region", { name: "Métricas de la semana" })).toContainText("0");

  // 1. Grupo muscular y ejercicio personales.
  await page.getByRole("link", { name: "Ejercicios" }).click();
  await page.getByLabel("Nombre del nuevo grupo muscular").fill(`Dorsales ${suffix}`);
  await page.getByRole("button", { name: "Agregar" }).click();
  await expect(page.getByText(`Se creó el grupo Dorsales ${suffix}.`)).toBeVisible();

  await page.getByRole("button", { name: "Nuevo ejercicio" }).click();
  const formEjercicio = page.getByRole("form", { name: "Formulario de ejercicio" });
  await formEjercicio.getByLabel("Nombre").fill(nombreEjercicio);
  await formEjercicio.getByLabel(`Dorsales ${suffix}`).check();
  await formEjercicio.getByRole("button", { name: "Crear ejercicio" }).click();
  await expect(page.getByText(`Se creó ${nombreEjercicio}.`)).toBeVisible();

  // 2. Rutina con el ejercicio propio y uno del catálogo global.
  await page.getByRole("link", { name: "Rutinas" }).click();
  await page.getByRole("button", { name: "Crear rutina" }).click();
  const formRutina = page.getByRole("form", { name: "Formulario de rutina" });
  await formRutina.getByLabel("Nombre").fill(nombreRutina);
  await formRutina
    .getByLabel("Ejercicio 1", { exact: true })
    .selectOption({ label: nombreEjercicio });
  await formRutina.getByLabel("Repeticiones 1", { exact: true }).fill("12");
  await formRutina.getByLabel("Peso 1", { exact: true }).fill("20");
  await formRutina.getByLabel("RPE objetivo 1", { exact: true }).fill("8");
  await formRutina.getByRole("button", { name: "Agregar ejercicio" }).click();
  await formRutina.getByLabel("Ejercicio 2", { exact: true }).selectOption({ label: "Dominadas" });
  await formRutina.getByLabel("Repeticiones 2", { exact: true }).fill("6");
  await formRutina.getByLabel("Peso 2", { exact: true }).fill("0");
  await formRutina.getByRole("button", { name: "Guardar rutina" }).click();
  await expect(page.getByText(`Se creó la rutina ${nombreRutina}.`)).toBeVisible();
  await expect(page.getByText("12 reps · 20 kg · RPE 8")).toBeVisible();

  // 3. Entrenamiento a partir de la rutina.
  await page.getByRole("link", { name: "Registrar" }).click();
  await page.getByRole("button", { name: "Cargar actividad" }).click();
  const formEntrenamiento = page.getByRole("form", { name: "Formulario de entrenamiento" });
  await formEntrenamiento.getByLabel("Usar una rutina").selectOption({ label: nombreRutina });
  await expect(formEntrenamiento.getByLabel("Repeticiones 1", { exact: true })).toHaveValue("12");
  await formEntrenamiento.getByLabel("RPE 1", { exact: true }).fill("8.5");
  await formEntrenamiento.getByRole("button", { name: "Finalizar entrenamiento" }).click();
  await expect(page.getByText(`Se registró "${nombreRutina}" con 2 series.`)).toBeVisible();

  // 4. Historial y detalle: 12 x 20 + 6 x 0 = 240 kg.
  await page.getByRole("link", { name: "Ver historial completo" }).click();
  await page.getByRole("link", { name: new RegExp(`^${nombreRutina}`) }).click();
  await expect(page.getByRole("heading", { name: nombreRutina })).toBeVisible();
  await expect(page.getByRole("region", { name: "Resumen del entrenamiento" })).toContainText(
    "240 kg",
  );

  // 5. El dashboard refleja la sesión de la semana.
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("region", { name: "Métricas de la semana" })).toContainText("240 kg");
});

test("el historial se protege: no se puede borrar un ejercicio ya registrado", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const nombreEjercicio = unique("Sentadilla búlgara");

  await register(page, {
    nombre: "Tomás Test",
    email: `tomas.${suffix}@test.com`,
    password: "Clave123!",
  });

  await page.getByRole("link", { name: "Ejercicios" }).click();
  await page.getByRole("button", { name: "Nuevo ejercicio" }).click();
  const formEjercicio = page.getByRole("form", { name: "Formulario de ejercicio" });
  await formEjercicio.getByLabel("Nombre").fill(nombreEjercicio);
  await formEjercicio.getByRole("button", { name: "Crear ejercicio" }).click();

  await page.getByRole("link", { name: "Registrar" }).click();
  await page.getByRole("button", { name: "Cargar actividad" }).click();
  const form = page.getByRole("form", { name: "Formulario de entrenamiento" });
  await form.getByLabel("Ejercicio 1", { exact: true }).selectOption({ label: nombreEjercicio });
  await form.getByLabel("Repeticiones 1", { exact: true }).fill("10");
  await form.getByLabel("Peso 1", { exact: true }).fill("16");
  await form.getByRole("button", { name: "Finalizar entrenamiento" }).click();
  await expect(page.getByText(/Se registró/)).toBeVisible();

  await page.getByRole("link", { name: "Ejercicios" }).click();
  await page.getByRole("button", { name: new RegExp(`^${nombreEjercicio}`) }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Eliminar ${nombreEjercicio}` }).click();

  await expect(page.getByRole("alert")).toContainText("1 series registradas");
});
