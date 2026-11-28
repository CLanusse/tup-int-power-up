import { CalendarRange, Play } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressBar from "../Common/ProgressBar";

const DAY_NAMES = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function PlanProgressCard({ program }) {
  if (!program) {
    return (
      <section className="content-section plan-progress-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Plan</p>
            <h2>Sin plan activo</h2>
          </div>
        </div>
        <p className="muted">Organizá tus semanas con un plan para ver tu cumplimiento acá.</p>
        <Link className="secondary-button" to="/planes">
          <CalendarRange size={16} /> Ir a planes
        </Link>
      </section>
    );
  }

  const next = program.proximaSesion;

  return (
    <section className="content-section plan-progress-card" aria-label="Plan en curso">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Plan en curso</p>
          <h2>{program.nombre}</h2>
        </div>
        <strong className="plan-percentage">{program.porcentaje}%</strong>
      </div>
      <ProgressBar value={program.porcentaje} label={`Cumplimiento de ${program.nombre}`} />
      <p className="muted">
        {program.totalRealizadas} de {program.totalProgramadas} sesiones realizadas
      </p>
      {next ? (
        <div className="next-session">
          <div>
            <span className="muted">Próxima sesión</span>
            <strong>
              Semana {next.numeroSemana} · {next.nombre}
            </strong>
            {next.diaSemana && (
              <small className="muted">Sugerida para el {DAY_NAMES[next.diaSemana]}</small>
            )}
          </div>
          <Link className="primary-button" to={`/actividad?sesion=${next.scheduledWorkoutId}`}>
            <Play size={16} fill="currentColor" /> Registrar
          </Link>
        </div>
      ) : (
        <p className="notice success">¡Completaste todas las sesiones del plan!</p>
      )}
    </section>
  );
}

export default PlanProgressCard;
