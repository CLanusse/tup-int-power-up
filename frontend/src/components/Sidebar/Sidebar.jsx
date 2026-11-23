import { NavLink } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import "./Sidebar.css";

const LINKS = [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }];

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
