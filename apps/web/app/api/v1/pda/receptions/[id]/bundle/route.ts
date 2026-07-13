import { db } from "@/lib/db";
import { error, json, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";

// Paquete offline para el PDA: recepción + líneas esperadas + snapshot del MAESTRO.
export const GET = withAuth(async (_req, ctx, params) => {
  const reception = await db.reception.findUnique({
    where: { id: params.id },
    include: { boxes: true, expectedLines: true },
  });
  if (!reception) return error(404, "not_found", "Recepción no encontrada");
  requirePermission(ctx, PERMISSIONS.RECEPTION_SCAN, reception.branchId);

  const version = reception.maestroVersionId
    ? await db.maestroVersion.findUnique({ where: { id: reception.maestroVersionId } })
    : await db.maestroVersion.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } });
  const codes = version
    ? await db.maestroCode.findMany({ where: { versionId: version.id }, select: { sku: true, barcodeNormalized: true } })
    : [];

  return json({
    reception: { id: reception.id, number: reception.number, status: reception.status, branchId: reception.branchId },
    boxes: reception.boxes.map((b) => ({ id: b.id, boxCode: b.boxCode })),
    expectedLines: reception.expectedLines.map((e) => ({ boxId: e.boxId, sku: e.sku, expectedQty: e.expectedQty })),
    maestroVersion: version ? { id: version.id, label: version.label } : null,
    maestroCodes: codes,
  });
});
