import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { usuario } from "../handlers";
import { renderizarApp } from "../renderizarApp";
import { server } from "../server";

describe("mi cuenta", () => {
  it("muestra los datos y el rol", async () => {
    renderizarApp("/cuenta");

    expect(await screen.findByText("ana@test.com")).toBeInTheDocument();
    expect(screen.getByText("Usuario", { selector: "strong" })).toBeInTheDocument();
  });

  it("actualiza el perfil, guarda el token nuevo y refresca el saludo", async () => {
    server.use(
      http.put("*/api/auth/perfil", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ user: { ...usuario, ...body }, token: "token-renovado" });
      }),
    );
    const { user } = renderizarApp("/cuenta");

    const form = await screen.findByRole("form", { name: "Editar perfil" });
    const guardar = within(form).getByRole("button", { name: /Guardar datos/ });
    expect(guardar).toBeDisabled();

    await user.clear(within(form).getByLabelText("Nombre"));
    await user.type(within(form).getByLabelText("Nombre"), "Ana María");
    await user.click(guardar);

    expect(await screen.findByRole("status")).toHaveTextContent("Perfil actualizado.");
    expect(screen.getByText("Hola, Ana María")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("token-renovado");
  });

  it("valida que la nueva contraseña coincida con su confirmación", async () => {
    const { user } = renderizarApp("/cuenta");

    const form = await screen.findByRole("form", { name: "Cambiar contraseña" });
    await user.type(within(form).getByLabelText("Contraseña actual"), "Clave123!");
    await user.type(within(form).getByLabelText("Nueva contraseña"), "Nueva456!");
    await user.type(within(form).getByLabelText("Repetir nueva contraseña"), "Distinta");
    await user.click(within(form).getByRole("button", { name: /Cambiar contraseña/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("no coinciden");
  });

  it("una contraseña actual incorrecta muestra el error sin cerrar la sesión", async () => {
    server.use(
      http.put("*/api/auth/password", () =>
        HttpResponse.json({ error: "La password actual es incorrecta" }, { status: 400 }),
      ),
    );
    const { user } = renderizarApp("/cuenta");

    const form = await screen.findByRole("form", { name: "Cambiar contraseña" });
    await user.type(within(form).getByLabelText("Contraseña actual"), "mala");
    await user.type(within(form).getByLabelText("Nueva contraseña"), "Nueva456!");
    await user.type(within(form).getByLabelText("Repetir nueva contraseña"), "Nueva456!");
    await user.click(within(form).getByRole("button", { name: /Cambiar contraseña/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La password actual es incorrecta");
    expect(localStorage.getItem("token")).toBe("token-de-prueba");
  });

  it("cambia la contraseña y limpia el formulario", async () => {
    let body;
    server.use(
      http.put("*/api/auth/password", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: "ok" });
      }),
    );
    const { user } = renderizarApp("/cuenta");

    const form = await screen.findByRole("form", { name: "Cambiar contraseña" });
    await user.type(within(form).getByLabelText("Contraseña actual"), "Clave123!");
    await user.type(within(form).getByLabelText("Nueva contraseña"), "Nueva456!");
    await user.type(within(form).getByLabelText("Repetir nueva contraseña"), "Nueva456!");
    await user.click(within(form).getByRole("button", { name: /Cambiar contraseña/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("Contraseña actualizada.");
    expect(body).toEqual({ passwordActual: "Clave123!", passwordNueva: "Nueva456!" });
    expect(within(form).getByLabelText("Contraseña actual")).toHaveValue("");
  });
});
