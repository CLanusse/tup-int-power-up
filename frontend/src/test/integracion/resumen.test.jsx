import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { programa } from "../handlers";
import { capturarBody, renderizarApp } from "../renderizarApp";
import { server } from "../server";

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
