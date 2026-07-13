import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { error, json, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { computeReception } from "@/modules/reception/receptionQuery";

// Recibe un lote idempotente de eventos y devuelve el estado autoritativo.
export const POST = withAuth(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const receptionId = String(body.receptionId ?? "");
  const events = Array.isArray(body.events) ? body.events : [];
  if (!receptionId) return error(400, "bad_request", "Falta receptionId");

  const reception = await db.reception.findUnique({ where: { id: receptionId } });
  if (!reception) return error(404, "not_found", "Recepción no encontrada");
  requirePermission(ctx, PERMISSIONS.RECEPTION_SCAN, reception.branchId);

  // Inserta eventos nuevos; los repetidos (misma idempotency_key) se ignoran.
  for (const e of events) {
    if (!e.idempotencyKey || !e.rawCode) continue;
    await db.scanEvent.upsert({
      where: { idempotencyKey: String(e.idempotencyKey) },
      update: {},
      create: {
        receptionId,
        boxCode: e.boxCode ?? null,
        rawCode: String(e.rawCode),
        normalizedCode: String(e.normalizedCode ?? ""),
        sku: e.sku ?? null,
        resultType: e.resultType,
        qty: Number(e.qty ?? 1),
        deviceId: String(body.deviceId ?? ""),
        userId: ctx.userId,
        occurredAt: e.occurredAt ? new Date(e.occurredAt) : new Date(),
        idempotencyKey: String(e.idempotencyKey),
      },
    });
  }
  if (reception.status === "PENDIENTE") {
    await db.reception.update({ where: { id: receptionId }, data: { status: "EN_PROCESO", startedAt: reception.startedAt ?? new Date() } });
  }

  const computed = await computeReception(receptionId);
  const t = computed!.result.totals;
  return json({
    appliedKeys: events.map((e: any) => e.idempotencyKey).filter(Boolean),
    progress: {
      status: computed!.reception.status,
      totalExpected: t.totalExpected, totalReceived: t.totalReceived, totalRemaining: t.totalRemaining,
      surplus: t.surplus, unidentified: t.unidentified,
    },
  });
});
