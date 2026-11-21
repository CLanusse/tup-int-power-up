import { BrowserRouter, Route, Routes } from "react-router-dom";

export function AppRoutes() {
  return (
    <Routes>
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
