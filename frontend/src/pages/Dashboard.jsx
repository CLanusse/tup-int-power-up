import { useNavigate } from "react-router-dom";
import { Activity, ChartNoAxesColumnIncreasing, Dumbbell, Layers3, Play } from "lucide-react";
import PlanProgressCard from "../components/Dashboard/PlanProgressCard";
import WeeklyBreakdown from "../components/Dashboard/WeeklyBreakdown";
import ErrorNotice from "../components/Feedback/ErrorNotice";
import LoadingState from "../components/Feedback/LoadingState";
import Layout from "../components/Layout/Layout";
import MetricGrid from "../components/Metrics/MetricGrid";
import PageHeader from "../components/PageHeader/PageHeader";
import WorkoutList from "../components/Workouts/WorkoutList";
import { useAuth } from "../context/useAuth";
import { useDashboardMetrics } from "../hooks/useDashboardMetrics";
import { getWeekDays } from "../utils/dateUtils";
import "../styles/app.css";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { summary, activity, featuredProgram, recentWorkouts, loading, error } =
    useDashboardMetrics();

  const cards = [
    { label: "Entrenamientos", value: summary?.workouts ?? "-", icon: Dumbbell },
    { label: "Series completadas", value: summary?.totalSets ?? "-", icon: Layers3 },
    { label: "Repeticiones", value: summary?.totalRepetitions ?? "-", icon: Activity },
    {
      label: "Volumen semanal",
      value: summary ? `${summary.totalVolume.toLocaleString("es-AR")} kg` : "-",
      icon: ChartNoAxesColumnIncreasing,
    },
  ];

  return (
    <Layout>
      <PageHeader
        eyebrow="Resumen semanal"
        title={user?.nombre ? `Hola, ${user.nombre.split(" ")[0]}` : "Tu semana en movimiento"}
        description="Volumen, constancia y sesiones registradas desde el lunes."
        action={
          <button className="primary-button" onClick={() => navigate("/actividad")}>
            <Play size={18} fill="currentColor" /> Iniciar entrenamiento
          </button>
        }
      />
      <ErrorNotice message={error} />
      <MetricGrid cards={cards} label="Métricas de la semana" />
      {loading ? (
        <LoadingState message="Cargando resumen..." />
      ) : (
        <>
          <WeeklyBreakdown
            days={getWeekDays(activity)}
            averageSets={summary?.averageSetsPerWorkout ?? 0}
          />
          <div className="dashboard-grid">
            <PlanProgressCard program={featuredProgram} />
            <WorkoutList workouts={recentWorkouts} title="Últimas sesiones" eyebrow="Actividad" />
          </div>
        </>
      )}
    </Layout>
  );
}

export default Dashboard;
