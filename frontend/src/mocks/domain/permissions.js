import { fail } from "../http";

/**
 * Política de acceso a recursos con propietario (igual que en el backend).
 *
 *   userId = null      -> recurso global (catálogo PowerUp)
 *   userId = usuario   -> recurso personal
 *
 * Lectura: cualquier usuario ve los recursos globales y los propios; un recurso
 * personal ajeno responde 404 para no revelar que existe.
 * Escritura: el propietario modifica sus recursos; los globales solo un admin (403).
 */

export const isAdmin = (user) => user?.rol === "admin";

export const isGlobalResource = (ownerId) => ownerId === null || ownerId === undefined;

export const canReadResource = (ownerId, userId) => isGlobalResource(ownerId) || ownerId === userId;

export function canModifyResource(ownerId, user) {
  if (isGlobalResource(ownerId)) return isAdmin(user);
  return ownerId === user.id;
}

/** @param resourceLabel texto con artículo, por ejemplo "un ejercicio". */
export function assertCanModify(ownerId, user, resourceLabel) {
  if (canModifyResource(ownerId, user)) return;
  if (isGlobalResource(ownerId)) {
    fail(403, `Solo un administrador puede modificar ${resourceLabel} global`);
  }
  fail(403, `No tenés permiso para modificar ${resourceLabel}`);
}

/** Propietario de un recurso nuevo: un admin puede crear recursos globales con global = true. */
export function resolveOwnerId(user, global) {
  if (!global) return user.id;
  if (!isAdmin(user)) fail(403, "Solo un administrador puede crear recursos globales");
  return null;
}

/** Filtra las filas visibles para el usuario (globales + propias). */
export const visibleTo = (userId) => (row) => canReadResource(row.userId, userId);
