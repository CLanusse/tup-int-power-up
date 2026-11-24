import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { capturarBody, renderizarApp } from "../renderizarApp";
import { server } from "../server";

describe("rutinas", () => {
  it("muestra los ejercicios planificados con sus objetivos", async () => {
    const { user } = renderizarApp("/rutinas");

    await user.click(await screen.findByRole("button", { name: /Piernas pesadas/ }));

    expect(screen.getByText("Sentadilla")).toBeInTheDocument();
    expect(screen.getByText("5 reps · 100 kg · RIR 2 · RPE 8")).toBeInTheDocument();
    // Rutina global: un usuario no la puede editar.
    expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument();
  });

  it("crea la rutina con todos sus ejercicios en una sola solicitud", async () => {
    const body = capturarBody();
    let solicitudes = 0;
    server.use(
      http.post("*/api/workout-templates", async ({ request }) => {
        solicitudes += 1;
        await body.guardar(request);
        return HttpResponse.json(
          { workoutTemplate: { id: 90, nombre: "Push", userId: 2, workoutTemplateExercises: [] } },
          { status: 201 },
        );
      }),
    );
    const { user } = renderizarApp("/rutinas");

    await user.click(await screen.findByRole("button", { name: /Crear rutina/ }));
    const form = screen.getByRole("form", { name: "Formulario de rutina" });
    await user.type(within(form).getByLabelText("Nombre"), "Push");
    await user.selectOptions(within(form).getByLabelText("Ejercicio 1"), "Press de banca");
    await user.type(within(form).getByLabelText("Repeticiones 1"), "8");
    await user.type(within(form).getByLabelText("Peso 1"), "60");
    await user.type(within(form).getByLabelText("RPE objetivo 1"), "8");

    await user.click(within(form).getByRole("button", { name: "Agregar ejercicio" }));
    // La fila nueva repite el ejercicio anterior.
    expect(within(form).getByLabelText("Ejercicio 2")).toHaveValue("10");
    await user.selectOptions(within(form).getByLabelText("Ejercicio 2"), "Sentadilla");
    await user.type(within(form).getByLabelText("Repeticiones 2"), "5");
    await user.type(within(form).getByLabelText("RIR objetivo 2"), "2");

    // Reordena: sentadilla primero.
    await user.click(within(form).getByRole("button", { name: "Subir ejercicio 2" }));
    await user.click(within(form).getByRole("button", { name: "Guardar rutina" }));

    expect(await screen.findByText("Se creó la rutina Push.")).toBeInTheDocument();
    expect(solicitudes).toBe(1);
    expect(body.ultima.ejercicios).toEqual([
      { exerciseId: 11, repeticiones: 5, peso: null, rirObjetivo: 2, rpeObjetivo: null },
      { exerciseId: 10, repeticiones: 8, peso: 60, rirObjetivo: null, rpeObjetivo: 8 },
    ]);
  });

  it("edita una rutina propia precargando sus datos", async () => {
    const body = capturarBody();
    server.use(
      http.put("*/api/workout-templates/:id", async ({ request }) => {
        await body.guardar(request);
        return HttpResponse.json({
          workoutTemplate: { id: 21, nombre: "Brazos", userId: 2, workoutTemplateExercises: [] },
        });
      }),
    );
    const { user } = renderizarApp("/rutinas");

    await user.click(await screen.findByRole("button", { name: /Mi rutina de brazos/ }));
    await user.click(screen.getByRole("button", { name: /Editar/ }));
    const form = screen.getByRole("form", { name: "Formulario de rutina" });
    expect(within(form).getByLabelText("Nombre")).toHaveValue("Mi rutina de brazos");
    // Sin global: los usuarios no ven la opción de catálogo.
    expect(within(form).queryByText(/catálogo global/)).not.toBeInTheDocument();

    await user.clear(within(form).getByLabelText("Nombre"));
    await user.type(within(form).getByLabelText("Nombre"), "Brazos");
    await user.selectOptions(within(form).getByLabelText("Ejercicio 1"), "Curl martillo de Ana");
    await user.type(within(form).getByLabelText("Repeticiones 1"), "12");
    await user.click(within(form).getByRole("button", { name: "Guardar rutina" }));

    expect(await screen.findByText("Se actualizó la rutina Brazos.")).toBeInTheDocument();
    expect(body.ultima).toMatchObject({
      nombre: "Brazos",
      ejercicios: [{ exerciseId: 12, repeticiones: 12 }],
    });
    expect(body.ultima).not.toHaveProperty("global");
  });

  it("explica por qué no se puede borrar una rutina programada", async () => {
    window.confirm = () => true;
    server.use(
      http.delete("*/api/workout-templates/:id", () =>
        HttpResponse.json(
          { error: "No se puede eliminar: la rutina esta programada en 2 sesion(es) de planes" },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderizarApp("/rutinas");

    await user.click(await screen.findByRole("button", { name: /Mi rutina de brazos/ }));
    await user.click(screen.getByRole("button", { name: "Eliminar Mi rutina de brazos" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("programada en 2 sesion");
  });
});
