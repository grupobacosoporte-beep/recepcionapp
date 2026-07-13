// Verificación del JWT emitido por Supabase Auth. Usa el JWKS del proyecto
// (claves asimétricas, recomendado). No guarda ni ve contraseñas.
import { createRemoteJWKSet, jwtVerify } from "jose";

const SUPABASE_URL = process.env.SUPABASE_URL!; // p.ej. https://xxxx.supabase.co
const issuer = `${SUPABASE_URL}/auth/v1`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

export interface SupabaseIdentity { userId: string; email: string; }

/** Verifica el Bearer token y devuelve la identidad, o null si es inválido. */
export async function verifySupabaseToken(authorization?: string | null): Promise<SupabaseIdentity | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    const userId = payload.sub;
    const email = (payload.email as string) ?? "";
    if (!userId) return null;
    return { userId, email };
  } catch {
    return null;
  }
}
