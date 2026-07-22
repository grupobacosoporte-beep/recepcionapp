import { error, json, withAuth } from "@/lib/http";
import { requirePermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { computeReception } from "@/modules/reception/receptionQuery";
import { db } from "@/lib/db";

export const GET = withAuth(async (_req, ctx, params) => {
  const computed = await computeReception(params.id);
  if (!computed) return error(404, "not_found", "Recepción no encontrada");
  requirePermission(ctx, PERMISSIONS.RECEPTION_VIEW, computed.reception.branchId);

  const diffs = computed.result.differences;
  const skus = [...new Set(diffs.map((d) => d.sku))];

  // Nombre desde product
  const products = skus.length
    ? await db.product.findMany({ where: { sku: { in: skus } }, select: { sku: true, description: true } })
    : [];
  const nameBySku = new Map(products.map((p) => [p.sku, p.description]));

  // Precio desde product_price (de la versión del MAESTRO de esta recepción)
  const versionId = computed.reception.maestroVersionId;
  const prices = versionId && skus.length
    ? await db.productPrice.findMany({ where: { versionId, sku: { in: skus } }, select: { sku: true, salePrice: true } })
    : [];
  const priceBySku = new Map(prices.map((p) => [p.sku, p.salePrice]));

  // Enriquecemos cada diferencia con nombre y precio (solo lectura, no cambia la lógica)
  const enriched = diffs.map((d) => ({
    ...d,
    name: nameBySku.get(d.sku) ?? null,
    price: priceBySku.get(d.sku) ?? null,
  }));
  return json(enriched);
});
