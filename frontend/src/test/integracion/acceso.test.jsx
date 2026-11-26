import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { usuario } from "../handlers";
import { renderizarApp } from "../renderizarApp";
import { server } from "../server";

describe("acceso", () => {
  it("sin sesión redirige al login", async () => {
    renderizarApp("/planes", { user: null });

    expect(await screen.findByText("Tu entrenamiento, medido de verdad.")).toBeInTheDocument();
  });

  it("inicia sesión y vuelve a la página solicitada", async () => {
    server.use(
      http.post("*/api/auth/login", async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ email: "ana@test.com", password: "Clave123!" });
        return HttpResponse.json({ user: usuario, token: "nuevo-token" });
      }),
    );
    const { user } = renderizarApp("/cuenta", { user: null });

    await user.type(await screen.findByPlaceholderText("Correo electrónico"), "ana@test.com");
    await user.type(screen.getByPlaceholderText("Contraseña"), "Clave123!");
    await user.click(screen.getAllByRole("button", { name: "Iniciar sesión" }).at(-1));

    expect(await screen.findByRole("heading", { name: "Mi cuenta" })).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("nuevo-token");
  });

  it("muestra el error de credenciales sin cerrar nada", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ error: "Credenciales invalidas" }, { status: 401 }),
      ),
    );
    const { user } = renderizarApp("/", { user: null });

    await user.type(await screen.findByPlaceholderText("Correo electrónico"), "ana@test.com");
    await user.type(screen.getByPlaceholderText("Contraseña"), "mala");
    await user.click(screen.getAllByRole("button", { name: "Iniciar sesión" }).at(-1));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales invalidas");
  });

  it("valida que las contraseñas coincidan al registrarse", async () => {
    const { user } = renderizarApp("/", { user: null });

    await user.click(await screen.findByRole("button", { name: "Registrarse" }));
    await user.type(screen.getByPlaceholderText("Nombre"), "Ana");
    await user.type(screen.getByPlaceholderText("Correo electrónico"), "ana@test.com");
    await user.type(screen.getByPlaceholderText("Contraseña"), "Clave123!");
    await user.type(screen.getByPlaceholderText("Confirmar contraseña"), "Otra123!");
    await user.click(screen.getAllByRole("button", { name: "Registrarse" }).at(-1));

    expect(await screen.findByRole("alert")).toHaveTextContent("Las contraseñas no coinciden");
  });

  it("cerrar sesión limpia los datos y vuelve al login", async () => {
    const { user } = renderizarApp("/cuenta");

    await user.click(await screen.findByRole("button", { name: /Cerrar sesión/ }));

    expect(await screen.findByText("Tu entrenamiento, medido de verdad.")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("si el token venció, la app vuelve al login", async () => {
    server.use(
      http.get("*/api/auth/perfil", () =>
        HttpResponse.json({ error: "Token invalido" }, { status: 401 }),
      ),
    );
    renderizarApp("/cuenta");

    expect(await screen.findByText("Tu entrenamiento, medido de verdad.")).toBeInTheDocument();
  });
});
