import ExerciseLineTable from "../ExerciseLineTable/ExerciseLineTable";
import GlobalScopeField from "../Common/GlobalScopeField";
import { selectableExercises } from "../../utils/exerciseUtils";

function RoutineForm({
  form,
  onFormChange,
  lines,
  onLinesChange,
  exercises,
  editing,
  saving,
  isGlobal,
  onSubmit,
  onCancel,
}) {
  function updateField(field, value) {
    onFormChange({ ...form, [field]: value });
  }

  // Una rutina global solo puede incluir ejercicios globales.
  const availableExercises = selectableExercises(exercises, isGlobal || form.global);

  return (
    <form
      className="content-section editor-form"
      onSubmit={onSubmit}
      aria-label="Formulario de rutina"
    >
      <div className="section-heading">
        <h2>{editing ? "Editar rutina" : "Nueva rutina"}</h2>
      </div>
      <div className="form-grid two-columns">
        <label>
          Nombre
          <input
            value={form.nombre}
            onChange={(event) => updateField("nombre", event.target.value)}
            required
            minLength={2}
          />
        </label>
        <label>
          Tipo
          <input
            value={form.tipo}
            onChange={(event) => updateField("tipo", event.target.value)}
            placeholder="Fuerza, hipertrofia..."
          />
        </label>
        <label>
          Grupo muscular principal
          <input
            value={form.grupoMuscularEtiqueta}
            onChange={(event) => updateField("grupoMuscularEtiqueta", event.target.value)}
          />
        </label>
        <label>
          Dificultad
          <select
            value={form.dificultad}
            onChange={(event) => updateField("dificultad", event.target.value)}
          >
            <option value="">Sin especificar</option>
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </label>
        <label>
          Duración estimada (min)
          <input
            type="number"
            min="1"
            value={form.tiempoEstimado}
            onChange={(event) => updateField("tiempoEstimado", event.target.value)}
          />
        </label>
      </div>
      <label>
        Descripción
        <textarea
          value={form.descripcion}
          onChange={(event) => updateField("descripcion", event.target.value)}
        />
      </label>
      <GlobalScopeField
        checked={form.global}
        onChange={(value) => updateField("global", value)}
        creating={!editing}
        hint="Visible para todos los usuarios. Solo admite ejercicios globales."
      />
      <h3 className="form-subtitle">Ejercicios planificados</h3>
      <p className="muted form-hint">
        Definí repeticiones, peso e intensidad objetivo. El orden de la lista es el orden de la
        rutina.
      </p>
      <ExerciseLineTable
        lines={lines}
        exercises={availableExercises}
        onChange={onLinesChange}
        weightLabel="Peso objetivo"
        addLabel="Agregar ejercicio"
        showIntensity
        intensityLabels={{ rir: "RIR objetivo", rpe: "RPE objetivo" }}
        reorderable
        weightRequired={false}
      />
      <div className="form-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar rutina"}
        </button>
      </div>
    </form>
  );
}

export default RoutineForm;
