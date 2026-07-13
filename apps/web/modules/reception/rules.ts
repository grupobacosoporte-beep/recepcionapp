// Reglas de clasificación (servidor, autoritativo). Gemela de la lógica del PDA.
import { normalize, preValidate } from "./codeNormalizer";

export type Mode = "CON_SURTIDO" | "SIN_SURTIDO";
export type ResultType =
  | "RECIBIDO_ESPERADO"
  | "SOBRANTE_NO_SOLICITADO"
  | "CODIGO_NO_IDENTIFICADO"
  | "LECTURA_INVALIDA"
  | "CONFLICTO_MAESTRO";

export interface Catalog {
  skuOf(normalized: string): string | null;
  isConflicted(normalized: string): boolean;
}

export interface MaestroEntry { sku: string; codigos: string[]; }

/** Construye el catálogo O(1) con detección de conflictos (código -> 2+ SKU). */
export function buildCatalog(entries: MaestroEntry[]): Catalog {
  const codeToSku = new Map<string, string>();
  const conflicted = new Set<string>();
  for (const e of entries) {
    const sku = e.sku.trim();
    if (!sku) continue;
    for (const raw of e.codigos) {
      const norm = normalize(raw);
      if (!norm) continue;
      if (conflicted.has(norm)) continue;
      const prev = codeToSku.get(norm);
      if (prev === undefined) codeToSku.set(norm, sku);
      else if (prev !== sku) { conflicted.add(norm); codeToSku.delete(norm); }
    }
  }
  return {
    skuOf: (n) => codeToSku.get(n) ?? null,
    isConflicted: (n) => conflicted.has(n),
  };
}

/** Clasifica una lectura. No cuenta nada; solo decide el tipo de resultado. */
export function classify(
  raw: string,
  catalog: Catalog,
  surtido: Set<string>,
  mode: Mode,
): { result: ResultType; sku: string | null } {
  if (!preValidate(raw).ok) return { result: "LECTURA_INVALIDA", sku: null };
  const norm = normalize(raw);
  if (catalog.isConflicted(norm)) return { result: "CONFLICTO_MAESTRO", sku: null };
  const sku = catalog.skuOf(norm);
  if (!sku) return { result: "CODIGO_NO_IDENTIFICADO", sku: null };
  if (mode === "SIN_SURTIDO") return { result: "RECIBIDO_ESPERADO", sku };
  if (surtido.has(sku)) return { result: "RECIBIDO_ESPERADO", sku };
  return { result: "SOBRANTE_NO_SOLICITADO", sku };
}
