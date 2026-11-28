import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import LoadingState from "./components/Feedback/LoadingState";
import ProtectedRoute from "./components/ProtectedRoute";
import Acceso from "./pages/Acceso";
import Cuenta from "./pages/Cuenta";
import Actividad from "./pages/Actividad";
import Dashboard from "./pages/Dashboard";
import DetalleEntrenamiento from "./pages/DetalleEntrenamiento";
import Ejercicios from "./pages/Ejercicios";
import Historial from "./pages/Historial";
import NoEncontrado from "./pages/NoEncontrado";
import Planes from "./pages/Planes";
import Rutinas from "./pages/Rutinas";

// Progreso incluye Chart.js: se carga solo cuando se visita.
const Progreso = lazy(() => import("./pages/Progreso"));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/acceso" element={<Acceso />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/cuenta" element={<Cuenta />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/actividad" element={<Actividad />} />
        <Route path="/actividad/historial" element={<Historial />} />
        <Route path="/actividad/:id" element={<DetalleEntrenamiento />} />
        <Route path="/ejercicios" element={<Ejercicios />} />
        <Route path="/rutinas" element={<Rutinas />} />
        <Route path="/planes" element={<Planes />} />
        <Route
          path="/progreso"
          element={
            <Suspense fallback={<LoadingState message="Cargando métricas..." />}>
              <Progreso />
            </Suspense>
          }
        />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
