import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { programa } from "../handlers";
import { capturarBody, renderizarApp } from "../renderizarApp";
import { server } from "../server";

// Chart.js necesita canvas, que jsdom no implementa: se reemplazan los gráficos.
vi.mock("react-chartjs-2", () => ({
  Bar: ({ data }) => <div data-testid="grafico-barras">{data.labels.join(", ")}</div>,
  Line: ({ data }) => <div data-testid="grafico-lineas">{data.labels.length} puntos</div>,
}));

describe("dashboard", () => {
  it("muestra las métricas de la semana y el plan en curso con su próxima sesión", async () => {
    const pedidos = [];
    server.use(
      http.get("*/api/metrics/activity-heatmap", ({ request }) => {
        pedidos.push(new URL(request.url).searchParams.get("tz"));
        return HttpResponse.json({ activity: [] });
      }),
    );
    renderizarApp("/");

    expect(await screen.findByText("10.167,5 kg")).toBeInTheDocument();
    expect(screen.getByText("284")).toBeInTheDocument();

    const plan = await screen.findByRole("region", { name: "Plan en curso" });
    expect(within(plan).getByText("50%")).toBeInTheDocument();
    expect(within(plan).getByText("Semana 1 · Día 2")).toBeInTheDocument();
    expect(within(plan).getByRole("link", { name: /Registrar/ })).toHaveAttribute(
      "href",
      "/actividad?sesion=51",
    );
    expect(within(plan).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");

    // La actividad diaria se pide con la zona horaria del navegador.
    expect(pedidos[0]).toBeTruthy();
  });

  it("sin planes invita a crear uno", async () => {
    server.use(
      http.get("*/api/metrics/program-adherence", () => HttpResponse.json({ programs: [] })),
    );
    renderizarApp("/");

    expect(await screen.findByRole("heading", { name: "Sin plan activo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir a planes/ })).toHaveAttribute("href", "/planes");
  });
});

describe("planes", () => {
  it("muestra el cumplimiento por semana y el estado de cada sesión", async () => {
    renderizarApp("/planes");

    expect(await screen.findByText("50% cumplido")).toBeInTheDocument();
    expect(screen.getByText("1 de 2 sesiones realizadas")).toBeInTheDocument();
    expect(screen.getByText("1/2 realizadas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Realizado/ })).toHaveAttribute(
      "href",
      "/actividad/300",
    );
    // La próxima sesión aparece en el resumen y en su semana; ambas llevan al registro precargado.
    for (const enlace of screen.getAllByRole("link", { name: "Registrar Día 2" })) {
      expect(enlace).toHaveAttribute("href", "/actividad?sesion=51");
    }
  });

  it("al editar un plan permite borrar una fecha (envía null)", async () => {
    const body = capturarBody();
    server.use(
      http.get("*/api/training-programs/:id", () =>
        HttpResponse.json({
          trainingProgram: { ...programa, fechaFin: "2026-12-31T00:00:00.000Z" },
        }),
      ),
      http.put("*/api/training-programs/:id", async ({ request }) => {
        await body.guardar(request);
        return HttpResponse.json({ trainingProgram: programa });
      }),
    );
    const { user } = renderizarApp("/planes");

    await screen.findByText("50% cumplido");
    await user.click(screen.getAllByRole("button", { name: /Editar/ })[0]);
    const form = screen.getByRole("form", { name: "Formulario de plan" });
    await user.clear(within(form).getByLabelText("Fecha de finalización"));
    await user.click(within(form).getByRole("button", { name: "Guardar plan" }));

    await vi.waitFor(() => expect(body.ultima).toBeDefined());
    expect(body.ultima.fechaFin).toBeNull();
    expect(body.ultima.fechaInicio).toBe("2026-11-01");
  });

  it("un usuario no puede modificar un plan global", async () => {
    server.use(
      http.get("*/api/training-programs/:id", () =>
        HttpResponse.json({ trainingProgram: { ...programa, userId: null } }),
      ),
    );
    renderizarApp("/planes");

    await screen.findByText("50% cumplido");
    expect(screen.queryByRole("button", { name: /Agregar semana/ })).not.toBeInTheDocument();
    expect(screen.queryByTitle("Eliminar plan")).not.toBeInTheDocument();
  });
});

describe("progreso", () => {
  it("muestra el volumen por grupo muscular y elige un ejercicio con datos", async () => {
    const pedidos = [];
    server.use(
      http.get("*/api/metrics/muscle-group-volume", () =>
        HttpResponse.json({
          muscleGroups: [
            { muscleGroupId: 2, nombre: "Piernas", setCount: 6, totalVolume: 3000 },
            { muscleGroupId: 1, nombre: "Pecho", setCount: 3, totalVolume: 1440 },
          ],
        }),
      ),
      http.get("*/api/metrics/exercise-progress", ({ request }) => {
        pedidos.push(new URL(request.url).searchParams.get("exerciseId"));
        return HttpResponse.json({
          progress: [
            { date: "2026-11-02T18:00:00.000Z", maxWeight: 90, estimatedOneRepMax: 105 },
            { date: "2026-11-09T18:00:00.000Z", maxWeight: 100, estimatedOneRepMax: 116.67 },
          ],
        });
      }),
    );
    renderizarApp("/progreso");

    expect(await screen.findByText("Piernas, Pecho")).toBeInTheDocument();
    // El ejercicio por defecto es el primero del último entrenamiento (Sentadilla, id 11).
    expect(pedidos.at(-1)).toBe("11");
    expect(await screen.findByText(/mejor 1RM estimado 116.67 kg/)).toBeInTheDocument();
    expect(screen.getByText(/variación de carga máxima \+10 kg/)).toBeInTheDocument();
  });
});
