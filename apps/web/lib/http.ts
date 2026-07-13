// Helpers para route handlers: respuestas JSON y envoltura de auth + errores.
import { NextRequest, NextResponse } from "next/server";
import { AuthContext, AuthError, getAuthContext } from "./auth/guard";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
export function error(status: number, code: string, message: string) {
  return NextResponse.json({ code, message }, { status });
}

type Handler = (req: NextRequest, ctx: AuthContext, params: any) => Promise<Response> | Response;

/** Envuelve un handler: exige autenticación y traduce AuthError a HTTP. */
export function withAuth(handler: Handler) {
  return async (req: NextRequest, route: { params: Promise<any> } | any) => {
    try {
      const auth = await getAuthContext(req.headers.get("authorization"));
      if (!auth) return error(401, "unauthorized", "No autenticado");
      const params = route?.params ? await route.params : {};
      return await handler(req, auth, params);
    } catch (e) {
      if (e instanceof AuthError) return error(e.status, "forbidden", e.message);
      console.error(e);
      return error(500, "internal", "Error interno");
    }
  };
}
