import { ChevronDown, ChevronUp, Library, Pencil, Trash2 } from "lucide-react";
import { canModifyResource } from "../../utils/permissions";
import OwnershipBadge from "../Common/OwnershipBadge";

function formatTarget(line) {
  const parts = [`${line.repeticiones} reps`];
  if (line.peso !== null && line.peso !== undefined) parts.push(`${line.peso} kg`);
  if (line.rirObjetivo !== null && line.rirObjetivo !== undefined)
    parts.push(`RIR ${line.rirObjetivo}`);
  if (line.rpeObjetivo !== null && line.rpeObjetivo !== undefined)
    parts.push(`RPE ${line.rpeObjetivo}`);
  return parts.join(" · ");
}

function RoutineList({ routines, user, expandedId, onToggle, onEdit, onDelete }) {
  if (routines.length === 0) {
    return (
      <section className="content-section">
        <div className="empty-state">
          <Library size={30} />
          <p>Todavía no hay rutinas. Creá la primera para reutilizarla en tus entrenamientos.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-section">
      <ul className="resource-list" aria-label="Rutinas">
        {routines.map((routine) => {
          const editable = canModifyResource(routine, user);
          const expanded = routine.id === expandedId;
          const lines = routine.workoutTemplateExercises || [];

          return (
            <li className="resource-item" key={routine.id}>
              <button
                className="resource-summary"
                onClick={() => onToggle(routine)}
                aria-expanded={expanded}
              >
                <span>
                  <strong>{routine.nombre}</strong>
                  <small>
                    <OwnershipBadge resource={routine} user={user} /> · {lines.length} ejercicios ·{" "}
                    {routine.tiempoEstimado ? `${routine.tiempoEstimado} min` : "Duración libre"}
                  </small>
                </span>
                {expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
              </button>
              {expanded && (
                <div className="resource-detail">
                  <div>
                    <p>{routine.descripcion || "Sin descripción."}</p>
                    {lines.length === 0 ? (
                      <p className="muted">Esta rutina todavía no tiene ejercicios.</p>
                    ) : (
                      <ol className="routine-lines">
                        {lines.map((line) => (
                          <li key={line.id}>
                            <span>{line.exercise?.nombre}</span>
                            <strong>{formatTarget(line)}</strong>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                  {editable && (
                    <div className="inline-actions">
                      <button className="secondary-button" onClick={() => onEdit(routine)}>
                        <Pencil size={16} /> Editar
                      </button>
                      <button
                        className="icon-button danger"
                        title="Eliminar rutina"
                        aria-label={`Eliminar ${routine.nombre}`}
                        onClick={() => onDelete(routine)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default RoutineList;
