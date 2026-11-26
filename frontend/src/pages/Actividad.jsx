import { History, ListPlus, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ErrorNotice from "../components/Feedback/ErrorNotice";
import LoadingState from "../components/Feedback/LoadingState";
import SuccessNotice from "../components/Feedback/SuccessNotice";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/PageHeader/PageHeader";
import WorkoutForm from "../components/Workouts/WorkoutForm";
import WorkoutList from "../components/Workouts/WorkoutList";
import { useWorkoutActivity } from "../hooks/useWorkoutActivity";
import "../styles/app.css";

function Actividad() {
  const [searchParams] = useSearchParams();
  const activity = useWorkoutActivity({ initialSessionId: searchParams.get("sesion") });

  return (
    <Layout>
      <PageHeader
        eyebrow="Actividad"
        title="Registrar entrenamiento"
        description="Cargá una sesión libre, usá una rutina o completá una sesión de tu plan."
        action={
          <button className="primary-button" onClick={activity.toggleForm}>
            {activity.formOpen ? <X size={18} /> : <ListPlus size={18} />}
            {activity.formOpen ? "Cancelar" : "Cargar actividad"}
          </button>
        }
      />
      <ErrorNotice message={activity.error} />
      <SuccessNotice message={activity.success} />
      {activity.formOpen && (
        <WorkoutForm
          name={activity.name}
          onNameChange={activity.setName}
          timestamp={activity.timestamp}
          onTimestampChange={activity.setTimestamp}
          scheduledWorkoutId={activity.scheduledWorkoutId}
          scheduledWorkouts={activity.scheduledWorkouts}
          onScheduledWorkoutChange={activity.selectScheduledWorkout}
          routineId={activity.routineId}
          routines={activity.routines}
          onRoutineChange={activity.selectRoutine}
          lines={activity.sets}
          exercises={activity.exercises}
          onLinesChange={activity.setSets}
          saving={activity.saving}
          onSubmit={activity.submitWorkout}
        />
      )}
      {activity.loading ? (
        <LoadingState message="Cargando actividad..." />
      ) : (
        <WorkoutList
          workouts={activity.recentWorkouts}
          onDelete={activity.removeWorkout}
          footer={
            <Link className="ghost-button" to="/actividad/historial">
              <History size={16} /> Ver historial completo
            </Link>
          }
        />
      )}
    </Layout>
  );
}

export default Actividad;
