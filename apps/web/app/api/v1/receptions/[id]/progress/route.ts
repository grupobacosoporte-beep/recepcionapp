import { error, json, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { computeReception } from "@/modules/reception/receptionQuery";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, ctx, params) => {
  const computed = await computeReception(params.id);
  if (!computed) return error(404, "not_found", "Recepción no encontrada");
  requirePermission(ctx, PERMISSIONS.RECEPTION_VIEW, computed.reception.branchId);
  const last = await db.scanEvent.findFirst({ where: { receptionId: params.id }, orderBy: { occurredAt: "desc" }, select: { occurredAt: true } });
  const t = computed.result.totals;
  return json({
    status: computed.reception.status,
    totalExpected: t.totalExpected,
    totalReceived: t.totalReceived,
    totalRemaining: t.totalRemaining,
    surplus: t.surplus,
    unidentified: t.unidentified,
    lastScanAt: last?.occurredAt ?? null,
  });
});
