import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { crearEntrenamiento, pagina } from "../handlers";
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

describe("historial", () => {
  it("pagina los resultados", async () => {
    const pedidos = [];
    server.use(
      http.get("*/api/workouts", ({ request }) => {
        const params = new URL(request.url).searchParams;
        pedidos.push(Object.fromEntries(params));
        const page = Number(params.get("page"));
        return HttpResponse.json({
          workouts: [crearEntrenamiento({ id: page, nombre: `Sesión de la página ${page}` })],
          pagination: { page, limit: 10, total: 25, totalPages: 3 },
        });
      }),
    );
    const { user } = renderizarApp("/actividad/historial");

    expect(await screen.findByText("Sesión de la página 1")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3 · 25 registros")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(await screen.findByText("Sesión de la página 2")).toBeInTheDocument();
    expect(pedidos.at(-1)).toMatchObject({ page: "2", limit: "10" });
  });

  it("filtra por fechas y vuelve a la primera página", async () => {
    const pedidos = [];
    server.use(
      http.get("*/api/workouts", ({ request }) => {
        pedidos.push(Object.fromEntries(new URL(request.url).searchParams));
        return HttpResponse.json(pagina([]));
      }),
    );
    const { user } = renderizarApp("/actividad/historial");

    await screen.findByText("Todas las sesiones");
    await user.type(screen.getByLabelText(/Desde/), "2026-11-01");

    expect(await screen.findByText("Resultados del período")).toBeInTheDocument();
    expect(pedidos.at(-1)).toMatchObject({ page: "1" });
    expect(new Date(pedidos.at(-1).from)).toEqual(new Date(2026, 10, 1));
    expect(screen.getByText("Todavía no hay actividad registrada")).toBeInTheDocument();
  });
});

describe("detalle de entrenamiento", () => {
  it("muestra el resumen y las series agrupadas por ejercicio", async () => {
    renderizarApp("/actividad/300");

    expect(await screen.findByRole("heading", { name: "Piernas del lunes" })).toBeInTheDocument();
    expect(screen.getByText("Basado en la rutina")).toBeInTheDocument();
    const resumen = screen.getByRole("region", { name: "Resumen del entrenamiento" });
    expect(within(resumen).getByText("1.505 kg")).toBeInTheDocument();
    expect(within(resumen).getByText("8.5")).toBeInTheDocument();

    const sentadilla = screen.getByRole("region", { name: "Sentadilla" });
    expect(within(sentadilla).getAllByRole("row")).toHaveLength(3);
  });

  it("edita el entrenamiento y guarda las series", async () => {
    const body = capturarBody();
    server.use(
      http.put("*/api/workouts/:id", async ({ request }) => {
        await body.guardar(request);
        return HttpResponse.json({ workout: crearEntrenamiento({ nombre: "Piernas corregido" }) });
      }),
    );
    const { user } = renderizarApp("/actividad/300");

    await user.click(await screen.findByRole("button", { name: /Editar/ }));
    const form = formulario();
    // En edición no se puede cambiar la sesión o rutina de origen.
    expect(within(form).queryByLabelText(/^Sesión del plan/)).not.toBeInTheDocument();
    await user.clear(within(form).getByLabelText("Peso 2"));
    await user.type(within(form).getByLabelText("Peso 2"), "107.5");
    await user.click(within(form).getByRole("button", { name: "Quitar fila 3" }));
    await user.click(within(form).getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Cambios guardados.")).toBeInTheDocument();
    expect(body.ultima.series).toEqual([
      { exerciseId: 11, repeticiones: 5, peso: 100, rir: 2, rpe: 8 },
      { exerciseId: 11, repeticiones: 5, peso: 107.5, rir: 1, rpe: 9 },
    ]);
  });

  it("elimina y vuelve al historial", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    server.use(http.delete("*/api/workouts/:id", () => new HttpResponse(null, { status: 204 })));
    const { user } = renderizarApp("/actividad/300");

    await user.click(await screen.findByRole("button", { name: "Eliminar entrenamiento" }));

    expect(
      await screen.findByRole("heading", { name: "Historial de entrenamientos" }),
    ).toBeInTheDocument();
  });

  it("informa si el entrenamiento no existe", async () => {
    server.use(
      http.get("*/api/workouts/:id", () =>
        HttpResponse.json({ error: "Entrenamiento no encontrado" }, { status: 404 }),
      ),
    );
    renderizarApp("/actividad/999");

    expect(
      await screen.findByRole("heading", { name: "Entrenamiento no encontrado" }),
    ).toBeInTheDocument();
  });
});
