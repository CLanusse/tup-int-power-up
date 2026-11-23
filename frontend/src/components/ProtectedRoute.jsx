import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

/**
 * Protege rutas que requieren sesión.
 * Con requiredRole, además exige ese rol (por ejemplo, las vistas de administración).
 */
function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/acceso" replace state={{ from: location }} />;
  }

  if (requiredRole && user?.rol !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
