import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../App";
import { AuthProvider } from "../context/AuthProvider";
import { usuario } from "./handlers";

/**
 * Renderiza la aplicación completa en una ruta.
 * Con `user` simula una sesión iniciada (token y usuario en localStorage).
 */
export function renderizarApp(ruta = "/", { user = usuario, token = "token-de-prueba" } = {}) {
  if (user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }

  const usuarioEvento = userEvent.setup();
  const resultado = render(
    <AuthProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );

  return { user: usuarioEvento, ...resultado };
}

/** Captura el cuerpo JSON de la última request que coincida. */
export function capturarBody() {
  const capturas = [];
  return {
    capturas,
    async guardar(request) {
      capturas.push(await request.clone().json());
    },
    get ultima() {
      return capturas[capturas.length - 1];
    },
  };
}
