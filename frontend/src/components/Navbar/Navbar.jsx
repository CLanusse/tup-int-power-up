import "./Navbar.css";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

function Navbar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        PowerUp
      </Link>

      {user && (
        <div className="user-section">
          <span className="user-name">Hola, {user.nombre}</span>
          {isAdmin && <span className="role-badge">Admin</span>}

          <button className="logout-btn" onClick={logout} title="Cerrar sesión">
            <LogOut size={18} /> <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;
