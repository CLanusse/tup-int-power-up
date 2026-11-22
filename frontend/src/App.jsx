import { BrowserRouter, Route, Routes } from "react-router-dom";
import Acceso from "./pages/Acceso";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/acceso" element={<Acceso />} />
      <Route path="*" element={<p>PowerUp: en construcción</p>} />
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