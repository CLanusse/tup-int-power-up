import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  createEmptyExerciseLine,
  moveExerciseLine,
  updateExerciseLine,
} from "../../utils/exerciseLineUtils";

/**
 * Tabla editable de ejercicios. Se usa para:
 * - las series de un entrenamiento (RIR / RPE reales);
 * - los ejercicios de una rutina (RIR / RPE objetivo, con reordenamiento).
 */
function ExerciseLineTable({
  lines,
  exercises,
  onChange,
  weightLabel = "Peso (kg)",
  addLabel = "Agregar serie",
  showIntensity = false,
  intensityLabels = { rir: "RIR", rpe: "RPE" },
  reorderable = false,
  weightRequired = true,
}) {
  function updateLine(index, field, value) {
    onChange(updateExerciseLine(lines, index, field, value));
  }

  function removeLine(index) {
    onChange(lines.filter((_, lineIndex) => lineIndex !== index));
  }

  function addLine() {
    // Una serie nueva repite el ejercicio de la anterior: es lo más común al registrar.
    const previous = lines[lines.length - 1];
    onChange([...lines, createEmptyExerciseLine({ exerciseId: previous?.exerciseId ?? "" })]);
  }

  const rowClassName = `set-row${showIntensity ? " with-intensity" : ""}${reorderable ? " reorderable" : ""}`;

  return (
    <>
      <div className="set-table" role="group" aria-label="Ejercicios">
        <div className={`${rowClassName} set-header`} aria-hidden="true">
          <span>Ejercicio</span>
          <span>Repeticiones</span>
          <span>{weightLabel}</span>
          {showIntensity && <span>{intensityLabels.rir}</span>}
          {showIntensity && <span>{intensityLabels.rpe}</span>}
          <span />
        </div>

        {lines.map((line, index) => (
          <div className={rowClassName} key={line.key ?? index}>
            <select
              aria-label={`Ejercicio ${index + 1}`}
              value={line.exerciseId}
              onChange={(event) => updateLine(index, "exerciseId", event.target.value)}
              required
            >
              <option value="">Seleccionar ejercicio</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.nombre}
                </option>
              ))}
            </select>

            <input
              aria-label={`Repeticiones ${index + 1}`}
              type="number"
              min="1"
              value={line.repeticiones}
              onChange={(event) => updateLine(index, "repeticiones", event.target.value)}
              required
            />

            <input
              aria-label={`Peso ${index + 1}`}
              type="number"
              min="0"
              step="0.5"
              value={line.peso}
              onChange={(event) => updateLine(index, "peso", event.target.value)}
              required={weightRequired}
              placeholder={weightRequired ? undefined : "Opcional"}
            />

            {showIntensity && (
              <input
                aria-label={`${intensityLabels.rir} ${index + 1}`}
                title="Repeticiones que todavía podías realizar (0 a 10)"
                type="number"
                min="0"
                max="10"
                value={line.rir}
                onChange={(event) => updateLine(index, "rir", event.target.value)}
                placeholder="Opcional"
              />
            )}

            {showIntensity && (
              <input
                aria-label={`${intensityLabels.rpe} ${index + 1}`}
                title="Esfuerzo percibido de 1 a 10"
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={line.rpe}
                onChange={(event) => updateLine(index, "rpe", event.target.value)}
                placeholder="Opcional"
              />
            )}

            <div className="line-actions">
              {reorderable && (
                <>
                  <button
                    className="icon-button"
                    type="button"
                    title="Subir"
                    aria-label={`Subir ejercicio ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => onChange(moveExerciseLine(lines, index, -1))}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    title="Bajar"
                    aria-label={`Bajar ejercicio ${index + 1}`}
                    disabled={index === lines.length - 1}
                    onClick={() => onChange(moveExerciseLine(lines, index, 1))}
                  >
                    <ArrowDown size={16} />
                  </button>
                </>
              )}
              <button
                className="icon-button danger"
                type="button"
                title="Quitar"
                aria-label={`Quitar fila ${index + 1}`}
                disabled={lines.length === 1}
                onClick={() => removeLine(index)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="secondary-button" type="button" onClick={addLine}>
        <Plus size={17} />
        {addLabel}
      </button>
    </>
  );
}

export default ExerciseLineTable;
