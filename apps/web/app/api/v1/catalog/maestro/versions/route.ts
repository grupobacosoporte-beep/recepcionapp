import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { error, json, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseMaestroCsv } from "@/modules/catalog/maestroImport";

export const GET = withAuth(async (_req, ctx) => {
  requirePermission(ctx, PERMISSIONS.MAESTRO_MANAGE);
  return json(await db.maestroVersion.findMany({ orderBy: { createdAt: "desc" } }));
});

// Sube una nueva versión del MAESTRO (CSV) y la marca activa.
// Carga códigos (maestro_code), nombres (product) y precios (product_price).
export const POST = withAuth(async (req: NextRequest, ctx) => {
  requirePermission(ctx, PERMISSIONS.MAESTRO_MANAGE);
  const form = await req.formData();
  const label = String(form.get("label") ?? "");
  const file = form.get("file") as File | null;
  if (!label || !file) return error(400, "bad_request", "Faltan label o file");

  const text = await file.text();
  const parsed = parseMaestroCsv(text);
  if (parsed.error) return error(400, "bad_maestro", parsed.error);

  const version = await db.$transaction(async (tx) => {
    await tx.maestroVersion.updateMany({ where: { active: true }, data: { active: false } });
    const v = await tx.maestroVersion.create({ data: { label, active: true, createdBy: ctx.userId } });
    const chunk = 1000;
    // Códigos -> maestro_code
    for (let i = 0; i < parsed.rows.length; i += chunk) {
      await tx.maestroCode.createMany({
        data: parsed.rows.slice(i, i + chunk).map((r) => ({ versionId: v.id, sku: r.sku, barcodeNormalized: r.barcodeNormalized, rawBarcode: r.rawBarcode })),
        skipDuplicates: true,
      });
    }
    // Nombres -> product (inserta SKUs nuevos; no pisa los existentes)
    for (let i = 0; i < parsed.products.length; i += chunk) {
      await tx.product.createMany({
        data: parsed.products.slice(i, i + chunk).map((p) => ({ sku: p.sku, description: p.name })),
        skipDuplicates: true,
      });
    }
    // Precios -> product_price (por versión)
    for (let i = 0; i < parsed.prices.length; i += chunk) {
      await tx.productPrice.createMany({
        data: parsed.prices.slice(i, i + chunk).map((p) => ({ versionId: v.id, sku: p.sku, salePrice: p.salePrice })),
        skipDuplicates: true,
      });
    }
    await tx.auditLog.create({ data: { actorUserId: ctx.userId, action: "maestro.import", entity: "maestro_version", entityId: v.id, after: parsed.stats as any } });
    return v;
  }, { maxWait: 20000, timeout: 120000 });

  return json({ versionId: version.id, ...parsed.stats, conflicts: parsed.conflicts }, 201);
});
