/**
 * La API simulada está activa salvo que se defina VITE_USE_MOCK_API=false
 * (por ejemplo, para conectar el frontend al backend real en una etapa posterior).
 */
export const MOCK_API_ENABLED = import.meta.env.VITE_USE_MOCK_API !== "false";
