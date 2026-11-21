/**
 * Reglas de permisos en el cliente (espejo de las de la API, solo para la interfaz).
 * La API vuelve a validar cada operación.
 */

export function isAdmin(user) {
  return user?.rol === "admin";
}

export function isGlobalResource(resource) {
  return resource?.userId === null || resource?.userId === undefined;
}

export function canModifyResource(resource, user) {
  if (!resource || !user) return false;
  if (isGlobalResource(resource)) return isAdmin(user);
  return resource.userId === user.id;
}

export function ownershipLabel(resource, user) {
  if (isGlobalResource(resource)) return "PowerUp";
  return resource.userId === user?.id ? "Personal" : "Compartido";
}
