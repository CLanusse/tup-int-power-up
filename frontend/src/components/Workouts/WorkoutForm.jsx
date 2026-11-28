import ExerciseLineTable from "../ExerciseLineTable/ExerciseLineTable";
import { toDateTimeLocalInput } from "../../utils/dateUtils";

/**
 * Formulario de un entrenamiento realizado.
 * Al registrar permite partir de una sesión del plan o de una rutina;
 * al editar (sin scheduledWorkouts) solo se modifican nombre, fecha y series.
 */
function WorkoutForm({
  name,
  onNameChange,
  timestamp,
  onTimestampChange,
  scheduledWorkoutId,
  scheduledWorkouts,
  onScheduledWorkoutChange,
  routineId,
  routines,
  onRoutineChange,
  lines,
  exercises,
  onLinesChange,
  saving,
  submitLabel = "Finalizar entrenamiento",
  onSubmit,
  onCancel,
}) {
  const showPlanning = Array.isArray(scheduledWorkouts) && Array.isArray(routines);
  const pendingSessions = showPlanning
    ? scheduledWorkouts.filter((session) => !session.completed)
    : [];

  return (
    <form
      className="workout-builder content-section"
      onSubmit={onSubmit}
      aria-label="Formulario de entrenamiento"
    >
      <div className="form-grid two-columns">
        <label>
          Nombre de la sesión
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            minLength={2}
            maxLength={120}
          />
        </label>

        <label>
          Fecha y hora
          <input
            type="datetime-local"
            value={timestamp}
            max={toDateTimeLocalInput(new Date())}
            onChange={(event) => onTimestampChange(event.target.value)}
          />
          <small className="muted">Dejalo vacío para registrar la hora actual.</small>
        </label>

        {showPlanning && (
          <>
            <label>
              Sesión del plan
              <select
                value={scheduledWorkoutId}
                onChange={(event) => onScheduledWorkoutChange(event.target.value)}
              >
                <option value="">Sin sesión programada</option>
                {pendingSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.label}
                  </option>
                ))}
              </select>
              <small className="muted">
                {pendingSessions.length} pendientes · las sesiones ya realizadas no se listan.
              </small>
            </label>

            <label>
              Usar una rutina
              <select
                value={routineId}
                onChange={(event) => onRoutineChange(event.target.value)}
                disabled={Boolean(scheduledWorkoutId)}
              >
                <option value="">Sesión libre</option>
                {routines.map((routine) => (
                  <option key={routine.id} value={routine.id}>
                    {routine.nombre}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <ExerciseLineTable
        lines={lines}
        exercises={exercises}
        onChange={onLinesChange}
        showIntensity
      />

      <div className="form-actions">
        {onCancel ? (
          <button className="ghost-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
        ) : (
          <span />
        )}
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default WorkoutForm;
