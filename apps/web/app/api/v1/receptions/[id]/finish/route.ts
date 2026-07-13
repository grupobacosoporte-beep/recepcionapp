import { db } from "@/lib/db";
import { error, json, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { computeReception } from "@/modules/reception/receptionQuery";

// Cierra la recepción: persiste diferencias y recibidos, fija finished_at.
export const POST = withAuth(async (_req, ctx, params) => {
  const computed = await computeReception(params.id);
  if (!computed) return error(404, "not_found", "Recepción no encontrada");
  requirePermission(ctx, PERMISSIONS.RECEPTION_ASSIGN, computed.reception.branchId);

  const { result } = computed;
  await db.$transaction(async (tx) => {
    await tx.difference.deleteMany({ where: { receptionId: params.id } });
    if (result.differences.length) {
      await tx.difference.createMany({
        data: result.differences.map((d) => ({ receptionId: params.id, sku: d.sku, type: d.type as any, expected: d.expected, received: d.received, qty: d.qty })),
      });
    }
    await tx.reception.update({ where: { id: params.id }, data: { status: "FINALIZADA", finishedAt: new Date() } });
    await tx.auditLog.create({ data: { actorUserId: ctx.userId, action: "reception.finish", entity: "reception", entityId: params.id, after: result.totals as any } });
  });
  return json({ status: "FINALIZADA", totals: result.totals, differences: result.differences });
});
