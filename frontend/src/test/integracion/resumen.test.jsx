import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { programa } from "../handlers";
import { capturarBody, renderizarApp } from "../renderizarApp";
import { server } from "../server";

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
