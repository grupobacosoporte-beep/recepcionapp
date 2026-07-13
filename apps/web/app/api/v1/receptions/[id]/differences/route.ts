import { error, json, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { computeReception } from "@/modules/reception/receptionQuery";

export const GET = withAuth(async (_req, ctx, params) => {
  const computed = await computeReception(params.id);
  if (!computed) return error(404, "not_found", "Recepción no encontrada");
  requirePermission(ctx, PERMISSIONS.RECEPTION_VIEW, computed.reception.branchId);
  return json(computed.result.differences);
});
