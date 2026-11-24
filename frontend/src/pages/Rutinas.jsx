import { Plus, X } from "lucide-react";
import ErrorNotice from "../components/Feedback/ErrorNotice";
import LoadingState from "../components/Feedback/LoadingState";
import SuccessNotice from "../components/Feedback/SuccessNotice";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/PageHeader/PageHeader";
import RoutineForm from "../components/Routines/RoutineForm";
import RoutineList from "../components/Routines/RoutineList";
import { useAuth } from "../context/useAuth";
import { useRoutines } from "../hooks/useRoutines";
import "../styles/app.css";

function Rutinas() {
  const { user } = useAuth();
  const routines = useRoutines();

  return (
    <Layout>
      <PageHeader
        eyebrow="Planificación"
        title="Rutinas"
        description="Armá sesiones reutilizables y cargalas luego desde Registrar."
        action={
          <button
            className="primary-button"
            onClick={routines.formOpen ? routines.closeForm : routines.openCreate}
          >
            {routines.formOpen ? <X size={18} /> : <Plus size={18} />}
            {routines.formOpen ? "Cancelar" : "Crear rutina"}
          </button>
        }
      />
      <ErrorNotice message={routines.error} />
      <SuccessNotice message={routines.success} />
      {routines.formOpen && (
        <RoutineForm
          form={routines.form}
          onFormChange={routines.setForm}
          lines={routines.lines}
          onLinesChange={routines.setLines}
          exercises={routines.exercises}
          editing={routines.editing}
          saving={routines.saving}
          isGlobal={routines.editingRoutine?.userId === null}
          onSubmit={routines.submitRoutine}
          onCancel={routines.closeForm}
        />
      )}
      {routines.loading ? (
        <LoadingState message="Cargando rutinas..." />
      ) : (
        <RoutineList
          routines={routines.routines}
          user={user}
          expandedId={routines.expandedId}
          onToggle={routines.toggleRoutine}
          onEdit={routines.openEdit}
          onDelete={routines.removeRoutine}
        />
      )}
    </Layout>
  );
}

export default Rutinas;
