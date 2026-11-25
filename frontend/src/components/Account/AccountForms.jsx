import { useState } from "react";
import { KeyRound, Save } from "lucide-react";

export function ProfileForm({ profile, onSave }) {
  const [nombre, setNombre] = useState(profile.nombre);
  const [email, setEmail] = useState(profile.email);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    await onSave({ nombre: nombre.trim(), email: email.trim() });
    setSaving(false);
  }

  const unchanged = nombre.trim() === profile.nombre && email.trim() === profile.email;

  return (
    <form
      className="content-section editor-form"
      onSubmit={handleSubmit}
      aria-label="Editar perfil"
    >
      <div className="section-heading">
        <h2>Datos personales</h2>
      </div>
      <div className="form-grid two-columns">
        <label>
          Nombre
          <input
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
      </div>
      <div className="form-actions">
        <span />
        <button className="primary-button" type="submit" disabled={saving || unchanged}>
          <Save size={16} /> {saving ? "Guardando..." : "Guardar datos"}
        </button>
      </div>
    </form>
  );
}

const EMPTY_PASSWORDS = { passwordActual: "", passwordNueva: "", confirmacion: "" };

export function PasswordForm({ onSave }) {
  const [form, setForm] = useState(EMPTY_PASSWORDS);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const saved = await onSave(form);
    setSaving(false);
    if (saved) setForm(EMPTY_PASSWORDS);
  }

  return (
    <form
      className="content-section editor-form"
      onSubmit={handleSubmit}
      aria-label="Cambiar contraseña"
    >
      <div className="section-heading">
        <h2>Contraseña</h2>
      </div>
      <div className="form-grid two-columns">
        <label>
          Contraseña actual
          <input
            type="password"
            autoComplete="current-password"
            value={form.passwordActual}
            onChange={(event) => update("passwordActual", event.target.value)}
            required
          />
        </label>
        <span />
        <label>
          Nueva contraseña
          <input
            type="password"
            autoComplete="new-password"
            value={form.passwordNueva}
            onChange={(event) => update("passwordNueva", event.target.value)}
            required
            minLength={6}
          />
        </label>
        <label>
          Repetir nueva contraseña
          <input
            type="password"
            autoComplete="new-password"
            value={form.confirmacion}
            onChange={(event) => update("confirmacion", event.target.value)}
            required
            minLength={6}
          />
        </label>
      </div>
      <div className="form-actions">
        <span className="muted">Mínimo 6 caracteres.</span>
        <button className="secondary-button" type="submit" disabled={saving}>
          <KeyRound size={16} /> {saving ? "Actualizando..." : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}
