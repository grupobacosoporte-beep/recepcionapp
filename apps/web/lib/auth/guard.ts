// Esqueleto del guard de auth + RBAC. Define la ESTRUCTURA de la verificación;
// la lógica concreta (verificación JWKS de Supabase, carga desde Neon) se
// implementa en Fase 1. Aquí se fija el contrato de autorización.

import { GLOBAL_ROLES, Permission, Role, ROLE_PERMISSIONS } from "./permissions";
import { verifySupabaseToken } from "../supabase-auth";
import { db } from "../db";

export interface AuthContext {
  userId: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  branchIds: string[]; // locales a los que el usuario tiene ámbito
  isGlobal: boolean; // true si posee algún rol global
}

/**
 * Verifica el JWT de Supabase (JWKS) y carga el perfil + RBAC desde Neon.
 * Devuelve el contexto de autorización, o null si el token es inválido o el
 * usuario no existe/está inactivo.
 */
export async function getAuthContext(authorizationHeader?: string | null): Promise<AuthContext | null> {
  const identity = await verifySupabaseToken(authorizationHeader);
  if (!identity) return null;

  const profile = await db.userProfile.findUnique({
    where: { id: identity.userId },
    include: { roles: { include: { role: true } } },
  });
  if (!profile || !profile.active) return null;

  const roles = profile.roles.map((ur) => ur.role.key as Role);
  const branchIds = profile.roles.map((ur) => ur.branchId).filter((b): b is string => !!b);
  const permissions = Array.from(new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []))) as Permission[];

  return {
    userId: profile.id,
    email: profile.email,
    roles,
    permissions,
    branchIds,
    isGlobal: hasGlobalRole(roles),
  };
}

/** ¿El usuario tiene el permiso? */
export function can(ctx: AuthContext, permission: Permission): boolean {
  return ctx.permissions.includes(permission);
}

/** ¿El usuario puede actuar sobre un recurso de este local? */
export function inBranchScope(ctx: AuthContext, branchId: string | null): boolean {
  if (ctx.isGlobal) return true;
  if (!branchId) return false;
  return ctx.branchIds.includes(branchId);
}

/**
 * Autoriza permiso + ámbito. Lanza si no cumple.
 * Uso en cada route handler: await requirePermission(ctx, P.RECEPTION_CREATE, branchId)
 */
export function requirePermission(
  ctx: AuthContext | null,
  permission: Permission,
  branchId: string | null = null,
): asserts ctx is AuthContext {
  if (!ctx) throw new AuthError(401, "No autenticado");
  if (!can(ctx, permission)) throw new AuthError(403, "Sin permiso");
  if (branchId !== null && !inBranchScope(ctx, branchId)) {
    throw new AuthError(403, "Fuera del ámbito de local");
  }
}

export function hasGlobalRole(roles: Role[]): boolean {
  return roles.some((r) => GLOBAL_ROLES.includes(r));
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
