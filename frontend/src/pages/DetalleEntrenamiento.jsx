import {
  ArrowLeft,
  CalendarCheck,
  Dumbbell,
  Gauge,
  Layers3,
  Pencil,
  Repeat,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorNotice from "../components/Feedback/ErrorNotice";
import LoadingState from "../components/Feedback/LoadingState";
import SuccessNotice from "../components/Feedback/SuccessNotice";
import Layout from "../components/Layout/Layout";
import MetricGrid from "../components/Metrics/MetricGrid";
import PageHeader from "../components/PageHeader/PageHeader";
import WorkoutForm from "../components/Workouts/WorkoutForm";
import { useWorkoutDetail } from "../hooks/useWorkoutDetail";
import { formatLongDate, formatTime } from "../utils/dateUtils";
import { groupSetsByExercise, summarizeWorkout } from "../utils/progressUtils";
import "../styles/app.css";

function formatNumber(value) {
  return Number(value.toFixed(1)).toLocaleString("es-AR");
}

function WorkoutOrigin({ workout }) {
  const session = workout.scheduledWorkout;
  const program = session?.programWeek?.trainingProgram;

  if (program) {
    return (
      <p className="workout-origin">
        <CalendarCheck size={16} /> Sesión <strong>{session.nombre}</strong> · Semana{" "}
        {session.programWeek.numeroSemana} del plan <strong>{program.nombre}</strong>
      </p>
    );
  }

  if (workout.workoutTemplate) {
    return (
      <p className="workout-origin">
        <Dumbbell size={16} /> Basado en la rutina <strong>{workout.workoutTemplate.nombre}</strong>
      </p>
    );
  }

  return <p className="workout-origin muted">Sesión libre</p>;
}

function WorkoutDetailContent({ id }) {
  const navigate = useNavigate();
  const detail = useWorkoutDetail(id);

  if (detail.loading) {
    return (
      <Layout>
        <LoadingState message="Cargando entrenamiento..." />
      </Layout>
    );
  }

  if (detail.notFound || !detail.workout) {
    return (
      <Layout>
        <PageHeader
          eyebrow="Actividad"
          title="Entrenamiento no encontrado"
          description="Puede que haya sido eliminado."
        />
        <ErrorNotice message={detail.error} />
        <Link className="secondary-button" to="/actividad/historial">
          <ArrowLeft size={16} /> Volver al historial
        </Link>
      </Layout>
    );
  }

  const { workout } = detail;
  const summary = summarizeWorkout(workout);
  const groups = groupSetsByExercise(workout.series);

  async function handleDelete() {
    if (await detail.removeWorkout()) {
      navigate("/actividad/historial", { replace: true });
    }
  }

  return (
    <Layout>
      <PageHeader
        eyebrow={`${formatLongDate(workout.timestamp)} · ${formatTime(workout.timestamp)}`}
        title={workout.nombre}
        description={<WorkoutOrigin workout={workout} />}
        action={
          !detail.editing && (
            <div className="inline-actions">
              <button className="secondary-button" onClick={detail.startEditing}>
                <Pencil size={16} /> Editar
              </button>
              <button
                className="icon-button danger"
                title="Eliminar"
                aria-label="Eliminar entrenamiento"
                onClick={handleDelete}
              >
                <Trash2 size={17} />
              </button>
            </div>
          )
        }
      />
      <Link className="back-link" to="/actividad/historial">
        <ArrowLeft size={16} /> Historial
      </Link>
      <ErrorNotice message={detail.error} />
      <SuccessNotice message={detail.success} />

      {detail.editing ? (
        <WorkoutForm
          name={detail.name}
          onNameChange={detail.setName}
          timestamp={detail.timestamp}
          onTimestampChange={detail.setTimestamp}
          lines={detail.lines}
          exercises={detail.exercises}
          onLinesChange={detail.setLines}
          saving={detail.saving}
          submitLabel="Guardar cambios"
          onSubmit={detail.saveChanges}
          onCancel={detail.cancelEditing}
        />
      ) : (
        <>
          <MetricGrid
            label="Resumen del entrenamiento"
            cards={[
              { label: "Series", value: summary.totalSets, icon: Layers3 },
              { label: "Repeticiones", value: summary.totalRepetitions, icon: Repeat },
              {
                label: "Volumen",
                value: `${formatNumber(summary.totalVolume)} kg`,
                icon: Dumbbell,
              },
              { label: "RPE promedio", value: summary.averageRpe ?? "-", icon: Gauge },
            ]}
          />

          {groups.map((group) => (
            <section
              className="content-section exercise-detail"
              key={group.exerciseId}
              aria-label={group.nombre}
            >
              <div className="section-heading">
                <h2>{group.nombre}</h2>
                <span className="muted">
                  {formatNumber(group.volume)} kg · 1RM estimado {formatNumber(group.bestOneRepMax)}{" "}
                  kg
                </span>
              </div>
              <table className="sets-table">
                <thead>
                  <tr>
                    <th scope="col">Serie</th>
                    <th scope="col">Reps</th>
                    <th scope="col">Peso</th>
                    <th scope="col">RIR</th>
                    <th scope="col">RPE</th>
                  </tr>
                </thead>
                <tbody>
                  {group.sets.map((set, index) => (
                    <tr key={set.id}>
                      <td>{index + 1}</td>
                      <td>{set.repeticiones}</td>
                      <td>{set.peso} kg</td>
                      <td>{set.rir ?? "-"}</td>
                      <td>{set.rpe ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </>
      )}
    </Layout>
  );
}

function DetalleEntrenamiento() {
  const { id } = useParams();
  // key: al pasar de un entrenamiento a otro se reinicia el estado (vuelve a "cargando").
  return <WorkoutDetailContent key={id} id={id} />;
}

export default DetalleEntrenamiento;
