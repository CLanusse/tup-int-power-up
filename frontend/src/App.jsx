import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Acceso from "./pages/Acceso";
import Dashboard from "./pages/Dashboard";
import NoEncontrado from "./pages/NoEncontrado";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/acceso" element={<Acceso />} />
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
