import { ChevronDown, ChevronUp, Pencil, Search, Trash2 } from "lucide-react";
import { canModifyResource } from "../../utils/permissions";
import OwnershipBadge from "../Common/OwnershipBadge";

const DIFFICULTY_LABELS = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

function ExerciseList({ exercises, user, selectedId, onSelect, onEdit, onDelete }) {
  if (exercises.length === 0) {
    return (
      <div className="empty-state">
        <Search size={30} />
        <p>No hay ejercicios para estos filtros.</p>
      </div>
    );
  }

  return (
    <ul className="resource-list" aria-label="Ejercicios">
      {exercises.map((exercise) => {
        const editable = canModifyResource(exercise, user);
        const expanded = selectedId === exercise.id;

        return (
          <li className="resource-item" key={exercise.id}>
            <button
              className="resource-summary"
              onClick={() => onSelect(expanded ? null : exercise.id)}
              aria-expanded={expanded}
            >
              <span>
                <strong>{exercise.nombre}</strong>
                <small>
                  <OwnershipBadge resource={exercise} user={user} /> ·{" "}
                  {DIFFICULTY_LABELS[exercise.dificultad] || "Sin dificultad"}
                </small>
              </span>
              {expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
            </button>
            {expanded && (
              <div className="resource-detail">
                <div>
                  {exercise.imagen && (
                    <img
                      className="exercise-image"
                      src={exercise.imagen}
                      alt={exercise.nombre}
                      loading="lazy"
                    />
                  )}
                  <p>{exercise.descripcion || "Sin descripción."}</p>
                  <div className="tag-row">
                    {exercise.muscleGroups?.map((group) => (
                      <span key={group.id}>{group.nombre}</span>
                    ))}
                  </div>
                </div>
                {editable && (
                  <div className="inline-actions">
                    <button className="secondary-button" onClick={() => onEdit(exercise)}>
                      <Pencil size={16} /> Editar
                    </button>
                    <button
                      className="icon-button danger"
                      title="Eliminar ejercicio"
                      aria-label={`Eliminar ${exercise.nombre}`}
                      onClick={() => onDelete(exercise)}
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
  );
}

export default ExerciseList;
