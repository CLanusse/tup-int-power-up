import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { canModifyResource } from "../../utils/permissions";
import OwnershipBadge from "../Common/OwnershipBadge";

/** Alta, renombrado y baja de grupos musculares (personales, o globales si es admin). */
function MuscleGroupManager({ groups, onCreate, onRename, onDelete }) {
  const { user, isAdmin } = useAuth();
  const [nombre, setNombre] = useState("");
  const [global, setGlobal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  async function submitNew(event) {
    event.preventDefault();
    if (await onCreate(nombre.trim(), global)) {
      setNombre("");
      setGlobal(false);
    }
  }

  function startEdit(group) {
    setEditingId(group.id);
    setEditingName(group.nombre);
  }

  async function submitEdit(event, group) {
    event.preventDefault();
    if (await onRename(group, editingName.trim())) {
      setEditingId(null);
    }
  }

  return (
    <section className="content-section" aria-labelledby="muscle-groups-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h2 id="muscle-groups-title">Grupos musculares</h2>
        </div>
        <span className="muted">{groups.length} grupos</span>
      </div>

      <form className="inline-form" onSubmit={submitNew} aria-label="Nuevo grupo muscular">
        <input
          aria-label="Nombre del nuevo grupo muscular"
          placeholder="Nuevo grupo, por ejemplo Antebrazos"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          minLength={2}
          maxLength={60}
          required
        />
        {isAdmin && (
          <label className="check-option">
            <input
              type="checkbox"
              checked={global}
              onChange={(event) => setGlobal(event.target.checked)}
            />
            Global
          </label>
        )}
        <button className="secondary-button" type="submit">
          <Plus size={16} /> Agregar
        </button>
      </form>

      <ul className="group-list">
        {groups.map((group) => {
          const editable = canModifyResource(group, user);

          return (
            <li key={group.id} className="group-item">
              {editingId === group.id ? (
                <form className="inline-form" onSubmit={(event) => submitEdit(event, group)}>
                  <input
                    aria-label={`Nuevo nombre para ${group.nombre}`}
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    minLength={2}
                    required
                    autoFocus
                  />
                  <button
                    className="icon-button"
                    type="submit"
                    title="Guardar"
                    aria-label="Guardar nombre"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    title="Cancelar"
                    aria-label="Cancelar edición"
                    onClick={() => setEditingId(null)}
                  >
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <>
                  <span>
                    {group.nombre} <OwnershipBadge resource={group} user={user} />
                  </span>
                  {editable && (
                    <span className="compact-actions inline-actions">
                      <button
                        className="icon-button"
                        title="Renombrar"
                        aria-label={`Renombrar ${group.nombre}`}
                        onClick={() => startEdit(group)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button danger"
                        title="Eliminar"
                        aria-label={`Eliminar grupo ${group.nombre}`}
                        onClick={() => onDelete(group)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default MuscleGroupManager;
