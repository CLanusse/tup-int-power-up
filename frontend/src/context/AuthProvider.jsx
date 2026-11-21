import { useCallback, useEffect, useMemo, useState } from "react";
import { TOKEN_KEY, USER_KEY } from "../services/api";
import { login as loginRequest, register as registerRequest } from "../services/authService";
import { getProfile } from "../services/profileService";
import { isAdmin } from "../utils/permissions";
import { AuthContext } from "./authContext";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  // Token con el que se abrió la app: el perfil se refresca una sola vez, al iniciar.
  const [initialToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const saveSession = useCallback((data) => {
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email, password) => saveSession(await loginRequest(email, password)),
    [saveSession],
  );

  const register = useCallback(
    async (nombre, email, password) => saveSession(await registerRequest(nombre, email, password)),
    [saveSession],
  );

  useEffect(() => {
    window.addEventListener("auth:unauthorized", logout);
    return () => window.removeEventListener("auth:unauthorized", logout);
  }, [logout]);

  // Al abrir la app con una sesión guardada se refrescan los datos (por ejemplo, un cambio de rol).
  // No se repite al cambiar el token (login o edición de perfil): esas respuestas ya traen el usuario.
  useEffect(() => {
    if (!initialToken) return undefined;
    let active = true;

    getProfile()
      .then((profile) => {
        if (active) saveSession({ user: profile });
      })
      .catch(() => {
        // Un 401 ya cierra la sesión desde apiRequest; otros errores no deben bloquear la app.
      });

    return () => {
      active = false;
    };
  }, [initialToken, saveSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isAdmin: isAdmin(user),
      login,
      register,
      logout,
      updateSession: saveSession,
    }),
    [user, token, login, register, logout, saveSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
