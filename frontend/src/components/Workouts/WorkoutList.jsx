import { ChevronRight, Dumbbell, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../utils/dateUtils";
import { summarizeWorkout } from "../../utils/progressUtils";

function sessionOrigin(workout) {
  const program = workout.scheduledWorkout?.programWeek?.trainingProgram;
  if (program) return `Plan ${program.nombre}`;
  if (workout.workoutTemplate) return `Rutina ${workout.workoutTemplate.nombre}`;
  return "Sesión libre";
}

/** Lista de entrenamientos realizados con acceso al detalle. */
function WorkoutList({
  workouts = [],
  title = "Actividad reciente",
  eyebrow = "Registro",
  onDelete,
  footer,
}) {
  return (
    <section className="content-section" aria-label={title}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {footer}
      </div>

      {workouts.length === 0 ? (
        <div className="empty-state">
          <Dumbbell size={32} />
          <h3>Todavía no hay actividad registrada</h3>
          <p>Las sesiones que registres van a aparecer acá.</p>
        </div>
      ) : (
        <ul className="workout-list">
          {workouts.map((workout) => {
            const summary = summarizeWorkout(workout);

            return (
              <li className="workout-entry" key={workout.id}>
                <Link to={`/actividad/${workout.id}`} className="workout-link">
                  <strong>{workout.nombre}</strong>
                  <span>
                    {formatDateTime(workout.timestamp)} · {sessionOrigin(workout)}
                  </span>
                </Link>

                <div className="workout-sets">
                  <span>{summary.totalSets} series</span>
                  <span>{summary.totalRepetitions} reps</span>
                  <span>{summary.totalVolume.toLocaleString("es-AR")} kg</span>
                  {summary.averageRpe !== null && <span>RPE {summary.averageRpe}</span>}
                </div>

                <div className="inline-actions compact-actions">
                  <Link
                    className="icon-button"
                    to={`/actividad/${workout.id}`}
                    title="Ver detalle"
                    aria-label={`Ver detalle de ${workout.nombre}`}
                  >
                    <ChevronRight size={18} />
                  </Link>
                  {onDelete && (
                    <button
                      className="icon-button danger"
                      title="Eliminar entrenamiento"
                      aria-label={`Eliminar ${workout.nombre}`}
                      onClick={() => onDelete(workout)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default WorkoutList;
