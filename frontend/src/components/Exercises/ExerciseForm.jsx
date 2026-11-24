import GlobalScopeField from "../Common/GlobalScopeField";

function ExerciseForm({ form, groups, editing, onChange, onSubmit, onCancel }) {
  function updateField(field, value) {
    onChange({ ...form, [field]: value });
  }

  // Un ejercicio global solo puede usar grupos musculares globales.
  const availableGroups = form.global ? groups.filter((group) => group.userId === null) : groups;

  function toggleMuscleGroup(groupId) {
    const selected = form.muscleGroupIds.includes(groupId);
    updateField(
      "muscleGroupIds",
      selected
        ? form.muscleGroupIds.filter((id) => id !== groupId)
        : [...form.muscleGroupIds, groupId],
    );
  }

  function changeScope(global) {
    const allowed = new Set(
      (global ? groups.filter((group) => group.userId === null) : groups).map((group) => group.id),
    );
    onChange({
      ...form,
      global,
      muscleGroupIds: form.muscleGroupIds.filter((id) => allowed.has(id)),
    });
  }

  return (
    <form
      className="content-section editor-form"
      onSubmit={onSubmit}
      aria-label="Formulario de ejercicio"
    >
      <div className="section-heading">
        <h2>{editing ? "Editar ejercicio" : "Crear ejercicio"}</h2>
      </div>
      <div className="form-grid two-columns">
        <label>
          Nombre
          <input
            value={form.nombre}
            onChange={(event) => updateField("nombre", event.target.value)}
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Dificultad
          <select
            value={form.dificultad}
            onChange={(event) => updateField("dificultad", event.target.value)}
          >
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </label>
      </div>
      <label>
        Descripción
        <textarea
          value={form.descripcion}
          onChange={(event) => updateField("descripcion", event.target.value)}
        />
      </label>
      <label>
        URL de imagen
        <input
          type="url"
          value={form.imagen}
          onChange={(event) => updateField("imagen", event.target.value)}
          placeholder="https://..."
        />
      </label>
      <GlobalScopeField
        checked={form.global}
        onChange={changeScope}
        creating={!editing}
        hint="Visible para todos los usuarios. Solo admite grupos musculares globales."
      />
      <fieldset className="check-grid">
        <legend>Grupos musculares</legend>
        {availableGroups.map((group) => (
          <label className="check-option" key={group.id}>
            <input
              type="checkbox"
              checked={form.muscleGroupIds.includes(group.id)}
              onChange={() => toggleMuscleGroup(group.id)}
            />
            {group.nombre}
          </label>
        ))}
      </fieldset>
      <div className="form-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit">
          {editing ? "Guardar cambios" : "Crear ejercicio"}
        </button>
      </div>
    </form>
  );
}

export default ExerciseForm;
