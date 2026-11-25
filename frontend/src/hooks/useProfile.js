import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { changePassword, getProfile, updateProfile } from "../services/profileService";

export function useProfile() {
  const { updateSession } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    getProfile()
      .then((profileData) => {
        if (active) setProfile(profileData);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    return () => {
      active = false;
    };
  }, []);

  function notify(message) {
    setError("");
    setSuccess(message);
  }

  async function saveProfile({ nombre, email }) {
    try {
      const data = await updateProfile({ nombre, email });
      // El email viaja en el token: se guarda el token renovado.
      updateSession(data);
      setProfile(data.user);
      notify("Perfil actualizado.");
      return true;
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
      return false;
    }
  }

  async function savePassword({ passwordActual, passwordNueva, confirmacion }) {
    if (passwordNueva !== confirmacion) {
      setSuccess("");
      setError("La nueva contraseña y su confirmación no coinciden.");
      return false;
    }

    try {
      await changePassword(passwordActual, passwordNueva);
      notify("Contraseña actualizada.");
      return true;
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
      return false;
    }
  }

  return { profile, error, success, saveProfile, savePassword };
}
