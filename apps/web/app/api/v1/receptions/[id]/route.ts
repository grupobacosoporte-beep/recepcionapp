import { db } from "@/lib/db";
import { json, error, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const GET = withAuth(async (_req, ctx, params) => {
  const reception = await db.reception.findUnique({
    where: { id: params.id },
    include: { boxes: true, expectedLines: true },
  });
  if (!reception) return error(404, "not_found", "Recepción no encontrada");
  requirePermission(ctx, PERMISSIONS.RECEPTION_VIEW, reception.branchId);
  return json(reception);
});
