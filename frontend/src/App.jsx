import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Acceso from "./pages/Acceso";
import Cuenta from "./pages/Cuenta";
import Dashboard from "./pages/Dashboard";
import Ejercicios from "./pages/Ejercicios";
import NoEncontrado from "./pages/NoEncontrado";
import Planes from "./pages/Planes";
import Rutinas from "./pages/Rutinas";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/acceso" element={<Acceso />} />
      <Route element={<ProtectedRoute />}>
      <Route path="/cuenta" element={<Cuenta />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/ejercicios" element={<Ejercicios />} />
        <Route path="/rutinas" element={<Rutinas />} />
        <Route path="/planes" element={<Planes />} />
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
