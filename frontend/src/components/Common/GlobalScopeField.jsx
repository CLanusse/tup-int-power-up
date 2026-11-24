import { Globe } from "lucide-react";
import { useAuth } from "../../context/useAuth";

/**
 * Casilla para que un administrador cree el recurso en el catálogo global.
 * Solo se muestra al crear: el ámbito de un recurso existente no cambia.
 */
function GlobalScopeField({ checked, onChange, creating, hint }) {
  const { isAdmin } = useAuth();

  if (!isAdmin || !creating) return null;

  return (
    <label className="check-option global-scope">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <Globe size={16} /> Publicar en el catálogo global
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

export default GlobalScopeField;
