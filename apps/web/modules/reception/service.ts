// Cerebro autoritativo de la recepción (servidor). A partir de las líneas
// esperadas (surtido), el catálogo MAESTRO y los eventos de escaneo, calcula
// recibidos, sobrantes, no identificados y diferencias. Idempotente por
// idempotencyKey. Usa las mismas reglas que el PDA (rules.ts).
import { Catalog, Mode, classify, ResultType } from "./rules";

export interface ExpectedInput { sku: string; expectedQty: number; }
export interface ScanEventInput { rawCode: string; qty: number; idempotencyKey: string; }

export type DifferenceType = "FALTANTE" | "SOBRANTE" | "EXCESO" | "NO_IDENTIFICADO";
export interface Difference { sku: string; type: DifferenceType; expected: number; received: number; qty: number; }

export interface Totals {
  totalExpected: number;
  totalReceived: number;   // recibido que corresponde al surtido (tope = esperado)
  totalRemaining: number;
  surplus: number;
  unidentified: number;
  invalid: number;
  conflict: number;
}

export interface ReceptionResult {
  receivedBySku: Record<string, number>;
  surplusBySku: Record<string, number>;
  unidentifiedByCode: Record<string, number>;
  differences: Difference[];
  totals: Totals;
}

export function applyScans(
  expected: ExpectedInput[],
  catalog: Catalog,
  events: ScanEventInput[],
  mode: Mode = "CON_SURTIDO",
): ReceptionResult {
  const expectedBySku = new Map<string, number>();
  for (const e of expected) expectedBySku.set(e.sku, (expectedBySku.get(e.sku) ?? 0) + e.expectedQty);
  const surtido = new Set(expectedBySku.keys());

  const received = new Map<string, number>();
  const surplus = new Map<string, number>();
  const unidentified = new Map<string, number>();
  let invalid = 0, conflict = 0;

  const seen = new Set<string>();
  for (const ev of events) {
    if (seen.has(ev.idempotencyKey)) continue; // idempotencia
    seen.add(ev.idempotencyKey);
    const { result, sku } = classify(ev.rawCode, catalog, surtido, mode);
    const add = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + ev.qty);
    switch (result as ResultType) {
      case "RECIBIDO_ESPERADO": add(received, sku!); break;
      case "SOBRANTE_NO_SOLICITADO": add(surplus, sku!); break;
      case "CODIGO_NO_IDENTIFICADO": add(unidentified, ev.rawCode.trim()); break;
      case "LECTURA_INVALIDA": invalid += 1; break;
      case "CONFLICTO_MAESTRO": conflict += 1; break;
    }
  }

  const differences: Difference[] = [];
  let totalExpected = 0, totalReceivedCapped = 0, totalRemaining = 0;
  for (const [sku, exp] of expectedBySku) {
    const rec = received.get(sku) ?? 0;
    totalExpected += exp;
    totalReceivedCapped += Math.min(rec, exp);
    totalRemaining += Math.max(exp - rec, 0);
    if (rec < exp) differences.push({ sku, type: "FALTANTE", expected: exp, received: rec, qty: exp - rec });
    else if (rec > exp) differences.push({ sku, type: "EXCESO", expected: exp, received: rec, qty: rec - exp });
  }
  for (const [sku, qty] of surplus) differences.push({ sku, type: "SOBRANTE", expected: 0, received: qty, qty });
  for (const [code, qty] of unidentified) differences.push({ sku: code, type: "NO_IDENTIFICADO", expected: 0, received: qty, qty });

  return {
    receivedBySku: Object.fromEntries(received),
    surplusBySku: Object.fromEntries(surplus),
    unidentifiedByCode: Object.fromEntries(unidentified),
    differences,
    totals: {
      totalExpected,
      totalReceived: totalReceivedCapped,
      totalRemaining,
      surplus: [...surplus.values()].reduce((a, b) => a + b, 0),
      unidentified: [...unidentified.values()].reduce((a, b) => a + b, 0),
      invalid,
      conflict,
    },
  };
}
