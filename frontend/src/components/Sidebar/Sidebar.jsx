import { NavLink } from "react-router-dom";
import { Activity, CalendarRange, Dumbbell, History, LayoutDashboard, Library } from "lucide-react";
import "./Sidebar.css";

const LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/actividad", label: "Registrar", icon: Activity, end: true },
  { to: "/actividad/historial", label: "Historial", icon: History },
  { to: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { to: "/rutinas", label: "Rutinas", icon: Library },
  { to: "/planes", label: "Planes", icon: CalendarRange },
];

function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Navegación principal">
      {LINKS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} title={label}>
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default Sidebar;
