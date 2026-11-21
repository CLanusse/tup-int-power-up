import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthProvider";
import { MOCK_API_ENABLED } from "./mocks/config";
import "./styles/global.css";

/**
 * Prototipo: antes de renderizar se inicia la API simulada (MSW), así la
 * primera request de la app ya la responde el Service Worker.
 */
async function iniciarApiSimulada() {
  if (!MOCK_API_ENABLED) return;
  const { startMockApi } = await import("./mocks/browser");
  await startMockApi();
}

iniciarApiSimulada().then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>,
  );
});
