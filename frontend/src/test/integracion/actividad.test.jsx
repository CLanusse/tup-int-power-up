import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { crearEntrenamiento } from "../handlers";
import { capturarBody, renderizarApp } from "../renderizarApp";
import { server } from "../server";

function formulario() {
  return screen.getByRole("form", { name: "Formulario de entrenamiento" });
}

describe("registrar entrenamiento", () => {
  it("registra una sesión libre con series, RIR y RPE", async () => {
    const body = capturarBody();
    server.use(
      http.post("*/api/workouts", async ({ request }) => {
        await body.guardar(request);
        return HttpResponse.json(
          { workout: crearEntrenamiento({ id: 301, nombre: "Pecho" }) },
          { status: 201 },
        );
      }),
    );
    const { user } = renderizarApp("/actividad");

    await user.click(await screen.findByRole("button", { name: /Cargar actividad/ }));
    const form = formulario();
    await user.clear(within(form).getByLabelText("Nombre de la sesión"));
    await user.type(within(form).getByLabelText("Nombre de la sesión"), "Pecho");
    await user.selectOptions(within(form).getByLabelText("Ejercicio 1"), "Press de banca");
    await user.type(within(form).getByLabelText("Repeticiones 1"), "10");
    await user.type(within(form).getByLabelText("Peso 1"), "60");
    await user.type(within(form).getByLabelText("RPE 1"), "8");
    await user.click(within(form).getByRole("button", { name: "Agregar serie" }));
    await user.type(within(form).getByLabelText("Repeticiones 2"), "8");
    await user.type(within(form).getByLabelText("Peso 2"), "62.5");
    await user.click(within(form).getByRole("button", { name: "Finalizar entrenamiento" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Se registró "Pecho" con 3 series.',
    );
    expect(body.ultima).toEqual({
      nombre: "Pecho",
      series: [
        { exerciseId: 10, repeticiones: 10, peso: 60, rpe: 8 },
        { exerciseId: 10, repeticiones: 8, peso: 62.5 },
      ],
    });
  });

  it("al elegir una rutina precarga sus ejercicios", async () => {
    const { user } = renderizarApp("/actividad");

    await user.click(await screen.findByRole("button", { name: /Cargar actividad/ }));
    await user.selectOptions(
      within(formulario()).getByLabelText("Usar una rutina"),
      "Piernas pesadas",
    );

    expect(within(formulario()).getByLabelText("Nombre de la sesión")).toHaveValue(
      "Piernas pesadas",
    );
    expect(within(formulario()).getByLabelText("Ejercicio 1")).toHaveValue("11");
    expect(within(formulario()).getByLabelText("Repeticiones 1")).toHaveValue(5);
    expect(within(formulario()).getByLabelText("Peso 1")).toHaveValue(100);
  });

  it("llegando con ?sesion= abre el formulario con la sesión del plan", async () => {
    const body = capturarBody();
    server.use(
      http.post("*/api/workouts", async ({ request }) => {
        await body.guardar(request);
        return HttpResponse.json(
          { workout: crearEntrenamiento({ id: 302, scheduledWorkoutId: 51 }) },
          { status: 201 },
        );
      }),
    );
    const { user } = renderizarApp("/actividad?sesion=51");

    const sesion = await screen.findByLabelText(/^Sesión del plan/);
    expect(sesion).toHaveValue("51");
    // Las sesiones ya realizadas no se ofrecen.
    expect(within(sesion).queryByRole("option", { name: /Día 1/ })).not.toBeInTheDocument();
    expect(within(formulario()).getByLabelText("Nombre de la sesión")).toHaveValue("Día 2");

    await user.click(within(formulario()).getByRole("button", { name: "Finalizar entrenamiento" }));

    await screen.findByRole("status");
    expect(body.ultima).toMatchObject({
      scheduledWorkoutId: 51,
      workoutTemplateId: 20,
      nombre: "Día 2",
    });
  });

  it("no envía series incompletas", async () => {
    let enviado = false;
    server.use(
      http.post("*/api/workouts", () => {
        enviado = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const { user } = renderizarApp("/actividad");

    await user.click(await screen.findByRole("button", { name: /Cargar actividad/ }));
    // El formulario HTML exige los campos: se envía con submit directo para probar la validación propia.
    const form = formulario();
    form.noValidate = true;
    await user.click(within(form).getByRole("button", { name: "Finalizar entrenamiento" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Completá ejercicio, repeticiones y peso",
    );
    expect(enviado).toBe(false);
  });

  it("lista la actividad reciente con acceso al detalle", async () => {
    renderizarApp("/actividad");

    const enlace = await screen.findByRole("link", { name: /^Piernas del lunes/ });
    expect(enlace).toHaveAttribute("href", "/actividad/300");
    expect(screen.getByText("1.505 kg")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver historial completo/ })).toBeInTheDocument();
  });
});
