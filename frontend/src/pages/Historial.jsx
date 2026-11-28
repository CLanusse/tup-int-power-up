import { CalendarRange, ListPlus } from "lucide-react";
import { Link } from "react-router-dom";
import Pagination from "../components/Common/Pagination";
import ErrorNotice from "../components/Feedback/ErrorNotice";
import LoadingState from "../components/Feedback/LoadingState";
import Layout from "../components/Layout/Layout";
import PageHeader from "../components/PageHeader/PageHeader";
import WorkoutList from "../components/Workouts/WorkoutList";
import { useWorkoutHistory } from "../hooks/useWorkoutHistory";
import "../styles/app.css";

function Historial() {
  const history = useWorkoutHistory();
  const hasFilters = Boolean(history.from || history.to);

  return (
    <Layout>
      <PageHeader
        eyebrow="Actividad"
        title="Historial de entrenamientos"
        description="Consultá, filtrá y abrí cualquier sesión registrada."
        action={
          <Link className="primary-button" to="/actividad">
            <ListPlus size={18} /> Registrar
          </Link>
        }
      />
      <ErrorNotice message={history.error} />

      <section className="filter-panel history-filters" aria-label="Filtros del historial">
        <label>
          <CalendarRange size={16} /> Desde
          <input
            type="date"
            value={history.from}
            max={history.to || undefined}
            onChange={(event) => history.setFrom(event.target.value)}
          />
        </label>
        <label>
          <CalendarRange size={16} /> Hasta
          <input
            type="date"
            value={history.to}
            min={history.from || undefined}
            onChange={(event) => history.setTo(event.target.value)}
          />
        </label>
        {hasFilters && (
          <button className="ghost-button" onClick={history.clearFilters}>
            Limpiar filtros
          </button>
        )}
      </section>

      {history.loading ? (
        <LoadingState message="Cargando historial..." />
      ) : (
        <WorkoutList
          workouts={history.workouts}
          title={hasFilters ? "Resultados del período" : "Todas las sesiones"}
          eyebrow="Historial"
          onDelete={history.removeWorkout}
          footer={<span className="muted">{history.pagination.total} sesiones</span>}
        />
      )}

      <Pagination
        page={history.pagination.page}
        totalPages={history.pagination.totalPages}
        total={history.pagination.total}
        onPageChange={history.setPage}
      />
    </Layout>
  );
}

export default Historial;
