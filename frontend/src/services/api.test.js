import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../test/server";
import { apiRequest, buildErrorMessage, toQueryString } from "./api";

describe("cliente HTTP", () => {
  it("envía el token guardado", async () => {
    localStorage.setItem("token", "abc");
    let authorization;
    server.use(
      http.get("*/api/eco", ({ request }) => {
        authorization = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await expect(apiRequest("/eco")).resolves.toEqual({ ok: true });
    expect(authorization).toBe("Bearer abc");
  });

  it("muestra los mensajes de validación por campo en lugar del genérico", async () => {
    server.use(
      http.post("*/api/eco", () =>
        HttpResponse.json(
          {
            error: "Datos invalidos",
            details: [
              { field: "nombre", message: "El nombre es obligatorio" },
              { field: "email", message: "El email debe tener un formato valido" },
            ],
          },
          { status: 400 },
        ),
      ),
    );

    await expect(apiRequest("/eco", { method: "POST", body: "{}" })).rejects.toMatchObject({
      status: 400,
      message: "El nombre es obligatorio. El email debe tener un formato valido",
    });
  });

  it("si una sesión vence, limpia el almacenamiento y avisa a la app", async () => {
    localStorage.setItem("token", "vencido");
    localStorage.setItem("user", "{}");
    const listener = vi.fn();
    window.addEventListener("auth:unauthorized", listener);
    server.use(
      http.get("*/api/eco", () => HttpResponse.json({ error: "Token invalido" }, { status: 401 })),
    );

    await expect(apiRequest("/eco")).rejects.toThrow("Token invalido");
    expect(localStorage.getItem("token")).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("auth:unauthorized", listener);
  });

  it("un 401 sin sesión (login fallido) no dispara el cierre de sesión", async () => {
    const listener = vi.fn();
    window.addEventListener("auth:unauthorized", listener);
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ error: "Credenciales invalidas" }, { status: 401 }),
      ),
    );

    await expect(apiRequest("/auth/login", { method: "POST", body: "{}" })).rejects.toThrow(
      "Credenciales invalidas",
    );
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener("auth:unauthorized", listener);
  });

  it("informa cuando no hay conexión con el servidor", async () => {
    server.use(http.get("*/api/eco", () => HttpResponse.error()));
    await expect(apiRequest("/eco")).rejects.toMatchObject({
      status: 0,
      message: expect.stringMatching(/conectar/),
    });
  });

  it("devuelve null en respuestas 204", async () => {
    server.use(http.delete("*/api/eco", () => new HttpResponse(null, { status: 204 })));
    await expect(apiRequest("/eco", { method: "DELETE" })).resolves.toBeNull();
  });
});

describe("utilidades del cliente", () => {
  it("arma query strings omitiendo valores vacíos", () => {
    expect(toQueryString({ page: 2, from: "", to: undefined, tz: null })).toBe("?page=2");
    expect(toQueryString({})).toBe("");
  });

  it("usa un mensaje amable para errores del servidor", () => {
    expect(buildErrorMessage(null, 500)).toMatch(/servidor no está disponible/);
    expect(buildErrorMessage({ error: "Ya existe" }, 409)).toBe("Ya existe");
  });
});
