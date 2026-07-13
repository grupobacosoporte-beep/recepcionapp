// Carga lo necesario y recomputa el estado autoritativo de una recepción.
// Reutilizado por avance, cierre, diferencias y sincronización del PDA.
import { db } from "@/lib/db";
import { Catalog } from "./rules";
import { applyScans, ExpectedInput, ScanEventInput } from "./service";

async function catalogForVersion(versionId: string | null): Promise<Catalog> {
  const codeToSku = new Map<string, string>();
  if (versionId) {
    const codes = await db.maestroCode.findMany({ where: { versionId }, select: { sku: true, barcodeNormalized: true } });
    for (const c of codes) codeToSku.set(c.barcodeNormalized, c.sku);
  }
  // Los conflictos se excluyen en la importación; aquí cada código mapea a un SKU.
  return { skuOf: (n) => codeToSku.get(n) ?? null, isConflicted: () => false };
}

export async function computeReception(receptionId: string) {
  const reception = await db.reception.findUnique({ where: { id: receptionId } });
  if (!reception) return null;
  const expectedRows = await db.expectedLine.findMany({ where: { receptionId }, select: { sku: true, expectedQty: true } });
  const expected: ExpectedInput[] = expectedRows.map((e) => ({ sku: e.sku, expectedQty: e.expectedQty }));
  const eventRows = await db.scanEvent.findMany({ where: { receptionId }, select: { rawCode: true, qty: true, idempotencyKey: true } });
  const events: ScanEventInput[] = eventRows.map((e) => ({ rawCode: e.rawCode, qty: e.qty, idempotencyKey: e.idempotencyKey }));
  const catalog = await catalogForVersion(reception.maestroVersionId);
  const result = applyScans(expected, catalog, events, "CON_SURTIDO");
  return { reception, result };
}
