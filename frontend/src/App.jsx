import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Acceso from "./pages/Acceso";
import Dashboard from "./pages/Dashboard";
import Ejercicios from "./pages/Ejercicios";
import NoEncontrado from "./pages/NoEncontrado";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/acceso" element={<Acceso />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ejercicios" element={<Ejercicios />} />
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
