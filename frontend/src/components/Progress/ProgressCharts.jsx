import { Bar, Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  buildActivityChartData,
  buildMuscleGroupChartData,
  buildProgressChartData,
} from "../../utils/progressUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#bbb" } } },
  scales: {
    x: { ticks: { color: "#888" }, grid: { color: "#222" } },
    y: { beginAtZero: true, ticks: { color: "#888" }, grid: { color: "#222" } },
  },
};

function ChartPanel({ title, hasData, children, emptyMessage }) {
  return (
    <section className="content-section chart-panel">
      <div className="section-heading">
        <h2>{title}</h2>
      </div>
      <div className="chart-canvas">
        {hasData ? (
          children
        ) : (
          <div className="empty-state">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </section>
  );
}

const horizontalOptions = {
  ...chartOptions,
  indexAxis: "y",
  plugins: { legend: { display: false } },
};

function ProgressCharts({ progress, activity, muscleGroupVolume = [], exerciseName }) {
  return (
    <div className="chart-grid">
      <ChartPanel
        title={exerciseName ? `Progresión de fuerza · ${exerciseName}` : "Progresión de fuerza"}
        hasData={progress.length > 0}
        emptyMessage="Elegí un ejercicio con registros en este período."
      >
        <Line options={chartOptions} data={buildProgressChartData(progress)} />
      </ChartPanel>
      <ChartPanel
        title="Volumen por día"
        hasData={activity.length > 0}
        emptyMessage="No hay actividad en este período."
      >
        <Bar options={chartOptions} data={buildActivityChartData(activity)} />
      </ChartPanel>
      <ChartPanel
        title="Volumen por grupo muscular"
        hasData={muscleGroupVolume.length > 0}
        emptyMessage="No hay series registradas en este período."
      >
        <Bar options={horizontalOptions} data={buildMuscleGroupChartData(muscleGroupVolume)} />
      </ChartPanel>
    </div>
  );
}

export default ProgressCharts;
