import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, error, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseSurtido } from "@/modules/reception/pdfParser";

// GET /api/v1/receptions  — lista con filtros y ámbito de local
export const GET = withAuth(async (req, ctx) => {
  requirePermission(ctx, PERMISSIONS.RECEPTION_VIEW);
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const branchId = url.searchParams.get("branchId") ?? undefined;
  const where: any = {};
  if (status) where.status = status;
  if (!ctx.isGlobal) where.branchId = { in: ctx.branchIds };
  else if (branchId) where.branchId = branchId;
  const items = await db.reception.findMany({ where, orderBy: { createdAt: "desc" } });
  return json(items);
});

// POST /api/v1/receptions — crea recepción subiendo el PDF de surtido
export const POST = withAuth(async (req: NextRequest, ctx) => {
  const form = await req.formData();
  const branchId = String(form.get("branchId") ?? "");
  const number = String(form.get("number") ?? "");
  const supplierId = (form.get("supplierId") as string) || null;
  const file = form.get("surtido") as File | null;

  requirePermission(ctx, PERMISSIONS.RECEPTION_CREATE, branchId);
  if (!branchId || !number || !file) return error(400, "bad_request", "Faltan branchId, number o surtido");

  const buffer = Buffer.from(await file.arrayBuffer());
  const surtido = await parseSurtido(buffer);
  const activeMaestro = await db.maestroVersion.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } });

  const reception = await db.$transaction(async (tx) => {
    const r = await tx.reception.create({
      data: { number, branchId, supplierId, status: "PENDIENTE", createdBy: ctx.userId, maestroVersionId: activeMaestro?.id ?? null },
    });
    for (const carton of surtido.cartons) {
      const box = await tx.receptionBox.create({ data: { receptionId: r.id, boxCode: carton.code } });
      if (carton.lines.length) {
        await tx.expectedLine.createMany({
          data: carton.lines.map((l) => ({ receptionId: r.id, boxId: box.id, sku: l.codigo, expectedQty: l.pedido })),
        });
      }
    }
    await tx.auditLog.create({ data: { actorUserId: ctx.userId, action: "reception.create", entity: "reception", entityId: r.id, after: { number, branchId, cartones: surtido.cartons.length } } });
    return r;
  });

  return json(reception, 201);
});
