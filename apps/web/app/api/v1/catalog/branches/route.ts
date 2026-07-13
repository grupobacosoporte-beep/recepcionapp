import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { error, json, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";

// Ejemplo de CRUD de catálogo. Proveedores y productos siguen el mismo patrón.
export const GET = withAuth(async (_req, ctx) => {
  const where = ctx.isGlobal ? {} : { id: { in: ctx.branchIds } };
  return json(await db.branch.findMany({ where, orderBy: { name: "asc" } }));
});

export const POST = withAuth(async (req: NextRequest, ctx) => {
  requirePermission(ctx, PERMISSIONS.BRANCH_MANAGE);
  const body = await req.json();
  if (!body.code || !body.name) return error(400, "bad_request", "Faltan code o name");
  const branch = await db.branch.create({ data: { code: String(body.code), name: String(body.name) } });
  return json(branch, 201);
});
