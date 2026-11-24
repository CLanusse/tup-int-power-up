import { Plus, X } from "lucide-react";
import ExerciseFilters from "../components/Exercises/ExerciseFilters";
import ExerciseForm from "../components/Exercises/ExerciseForm";
import ExerciseList from "../components/Exercises/ExerciseList";
import MuscleGroupManager from "../components/Exercises/MuscleGroupManager";
import ErrorNotice from "../components/Feedback/ErrorNotice";
import LoadingState from "../components/Feedback/LoadingState";
import SuccessNotice from "../components/Feedback/SuccessNotice";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/PageHeader/PageHeader";
import { useAuth } from "../context/useAuth";
import { useExercises } from "../hooks/useExercises";
import "../styles/app.css";

function Ejercicios() {
  const { user, isAdmin } = useAuth();
  const catalog = useExercises();

  return (
    <Layout>
      <PageHeader
        eyebrow="Biblioteca"
        title="Ejercicios"
        description={
          isAdmin
            ? "Administrá el catálogo global de PowerUp y tus ejercicios personales."
            : "Usá los ejercicios de PowerUp y administrá los que creaste."
        }
        action={
          <button
            className="primary-button"
            onClick={catalog.formOpen ? catalog.closeForm : catalog.openCreate}
          >
            {catalog.formOpen ? <X size={18} /> : <Plus size={18} />}
            {catalog.formOpen ? "Cancelar" : "Nuevo ejercicio"}
          </button>
        }
      />
      <ErrorNotice message={catalog.error} />
      <SuccessNotice message={catalog.success} />
      {catalog.formOpen && (
        <ExerciseForm
          form={catalog.form}
          groups={catalog.groups}
          editing={catalog.editing}
          onChange={catalog.setForm}
          onSubmit={catalog.submitExercise}
          onCancel={catalog.closeForm}
        />
      )}
      <div className="catalog-layout">
        <section className="content-section">
          <ExerciseFilters
            search={catalog.search}
            difficulty={catalog.difficulty}
            groupId={catalog.groupId}
            groups={catalog.groups}
            onSearchChange={catalog.setSearch}
            onDifficultyChange={catalog.setDifficulty}
            onGroupChange={catalog.setGroupId}
          />
          {catalog.loading ? (
            <LoadingState message="Cargando ejercicios..." />
          ) : (
            <>
              <p className="muted result-count">
                {catalog.exercises.length} de {catalog.totalExercises} ejercicios
              </p>
              <ExerciseList
                exercises={catalog.exercises}
                user={user}
                selectedId={catalog.selectedId}
                onSelect={catalog.setSelectedId}
                onEdit={catalog.openEdit}
                onDelete={catalog.removeExercise}
              />
            </>
          )}
        </section>
        <MuscleGroupManager
          groups={catalog.groups}
          onCreate={catalog.addGroup}
          onRename={catalog.renameGroup}
          onDelete={catalog.removeGroup}
        />
      </div>
    </Layout>
  );
}

export default Ejercicios;
