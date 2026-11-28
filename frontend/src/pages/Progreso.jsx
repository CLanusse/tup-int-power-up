import { BarChart3, Gauge, Layers3, TrendingUp } from "lucide-react";
import ErrorNotice from "../components/Feedback/ErrorNotice";
import Layout from "../components/Layout/Layout";
import MetricGrid from "../components/Metrics/MetricGrid";
import PageHeader from "../components/PageHeader/PageHeader";
import ProgressCharts from "../components/Progress/ProgressCharts";
import ProgressFilters from "../components/Progress/ProgressFilters";
import { useProgressMetrics } from "../hooks/useProgressMetrics";
import { summarizeProgress } from "../utils/progressUtils";
import "../styles/app.css";

function Progreso() {
  const {
    from,
    setFrom,
    to,
    setTo,
    groups,
    exercises,
    groupId,
    selectGroup,
    exerciseId,
    setExerciseId,
    summary,
    activity,
    progress,
    muscleGroupVolume,
    error,
  } = useProgressMetrics();
  const exerciseName = exercises.find(
    (exercise) => String(exercise.id) === String(exerciseId),
  )?.nombre;
  const exerciseSummary = summarizeProgress(progress);
  const cards = [
    {
      label: "Volumen total",
      value: summary ? `${summary.totalVolume.toLocaleString("es-AR")} kg` : "-",
      icon: TrendingUp,
    },
    { label: "Entrenamientos", value: summary?.workouts ?? "-", icon: BarChart3 },
    { label: "Series", value: summary?.totalSets ?? "-", icon: Layers3 },
    { label: "RPE promedio", value: summary?.averageRpe ?? "-", icon: Gauge },
  ];

  return (
    <Layout>
      <PageHeader
        eyebrow="Métricas"
        title="Mi progreso"
        description="Compará fuerza, volumen y constancia en el período que elijas."
      />
      <ErrorNotice message={error} />
      <ProgressFilters
        from={from}
        to={to}
        groupId={groupId}
        exerciseId={exerciseId}
        groups={groups}
        exercises={exercises}
        onFromChange={setFrom}
        onToChange={setTo}
        onGroupChange={selectGroup}
        onExerciseChange={setExerciseId}
      />
      <MetricGrid cards={cards} label="Métricas del período" />
      {exerciseSummary && (
        <p className="notice progress-highlight" role="status">
          {exerciseName}: {exerciseSummary.sessions} sesiones en el período · mejor 1RM estimado{" "}
          {exerciseSummary.bestOneRepMax} kg · variación de carga máxima{" "}
          {exerciseSummary.weightChange > 0 ? "+" : ""}
          {exerciseSummary.weightChange} kg
        </p>
      )}
      <ProgressCharts
        progress={progress}
        activity={activity}
        muscleGroupVolume={muscleGroupVolume}
        exerciseName={exerciseName}
      />
      <p className="muted metrics-note">
        El volumen se calcula como repeticiones × peso y el 1RM con la fórmula de Epley. Son
        indicadores de tendencia, no una evaluación profesional.
      </p>
    </Layout>
  );
}

export default Progreso;
