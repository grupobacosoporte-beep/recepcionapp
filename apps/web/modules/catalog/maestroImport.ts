// Importador del MAESTRO (CSV) para el servidor. Detecta encabezados reales,
// normaliza códigos, consolida por SKU y marca conflictos (código -> 2+ SKU).
import { normalize } from "../reception/codeNormalizer";

export interface MaestroImportRow { sku: string; barcodeNormalized: string; rawBarcode: string; }
export interface MaestroConflict { barcodeNormalized: string; skus: string[]; }
export interface MaestroImportResult {
  rows: MaestroImportRow[];
  conflicts: MaestroConflict[];
  stats: { filas: number; codigosUnicos: number; skusUnicos: number; sinCodigo: number; sinSku: number };
  error?: string;
}

const SKU_ALIASES = new Set(["idproducto", "id_producto", "id", "sku", "codigoproducto"]);
const NOMBRE_ALIASES = new Set(["nombre", "descripcion", "producto", "glosa"]);
const CODIGO_ALIASES = new Set(["codigo", "codigobarra", "codigo_barra", "ean", "barra", "codigobarras"]);

function canon(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function parseMaestroCsv(text: string): MaestroImportResult {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\uFEFF/g, "")).filter((l) => l.trim() !== "");
  if (lines.length === 0) return empty("El archivo MAESTRO está vacío.");

  const sep = (lines[0].split(";").length >= lines[0].split(",").length) ? ";" : ",";
  const header = lines[0].split(sep).map(canon);
  const iSku = header.findIndex((h) => SKU_ALIASES.has(h));
  const iCod = header.findIndex((h) => CODIGO_ALIASES.has(h));
  if (iSku < 0 || iCod < 0) {
    return empty(`No se reconocieron columnas del MAESTRO. Encabezados: ${header.join(", ")}.`);
  }

  const codeToSku = new Map<string, string>();
  const conflictMap = new Map<string, Set<string>>();
  const skus = new Set<string>();
  const rows: MaestroImportRow[] = [];
  let sinCodigo = 0, sinSku = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep);
    const sku = (cols[iSku] ?? "").trim();
    const raw = (cols[iCod] ?? "").trim().replace(/^"|"$/g, "");
    const norm = normalize(raw);
    if (!sku) { sinSku++; continue; }
    if (!norm) { sinCodigo++; continue; }
    skus.add(sku);
    if (conflictMap.has(norm)) { conflictMap.get(norm)!.add(sku); continue; }
    const prev = codeToSku.get(norm);
    if (prev === undefined) { codeToSku.set(norm, sku); rows.push({ sku, barcodeNormalized: norm, rawBarcode: raw }); }
    else if (prev !== sku) {
      conflictMap.set(norm, new Set([prev, sku]));
      codeToSku.delete(norm);
      const idx = rows.findIndex((r) => r.barcodeNormalized === norm);
      if (idx >= 0) rows.splice(idx, 1);
    }
  }

  const conflicts = [...conflictMap.entries()].map(([barcodeNormalized, s]) => ({ barcodeNormalized, skus: [...s] }));
  return {
    rows,
    conflicts,
    stats: { filas: lines.length - 1, codigosUnicos: codeToSku.size + conflicts.length, skusUnicos: skus.size, sinCodigo, sinSku },
  };
}

function empty(error: string): MaestroImportResult {
  return { rows: [], conflicts: [], stats: { filas: 0, codigosUnicos: 0, skusUnicos: 0, sinCodigo: 0, sinSku: 0 }, error };
}
