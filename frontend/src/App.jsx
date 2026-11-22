import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import NoEncontrado from "./pages/NoEncontrado";

export function AppRoutes() {
  return (
    <Routes>
      {/* Provisoria hasta PU-06, que la reemplaza por la página de acceso. */}
      <Route path="/acceso" element={<p>Acceso: llega en PU-06</p>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
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
