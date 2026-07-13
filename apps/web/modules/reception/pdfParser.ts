// Parser del PDF de surtido (Farmacias del Dr. Simi). Servidor.
// Validado contra un surtido real (pedido 412258): 23 cartones, 175 productos,
// 1815 unidades — coincidente con pdfplumber como verificador independiente.
//
// Trampas que resuelve:
//  - "Cartón : Multiple" en la cabecera: cartón falso, se ignora.
//  - Cartones que abarcan varias páginas: el cartón vigente se arrastra.
//  - Columnas por posición (x), no por conteo de tokens: soporta códigos que
//    son números sueltos y nombres de producto largos con espacios/símbolos.
import * as PdfJsExtract from "pdf.js-extract";
import type { PDFExtractText } from "pdf.js-extract";

// Resiliente a interop ESM/CJS (Vercel, tsx, etc.).
const PDFExtract: any = (PdfJsExtract as any).PDFExtract ?? (PdfJsExtract as any).default?.PDFExtract;

// Umbrales de columna por coordenada x (según el layout de Simi).
const T_CODIGO = 350;
const T_LOTE = 420;
const T_PEDIDO = 520;

export interface SurtidoLine {
  producto: string;
  codigo: string; // identificador interno Simi (CH…/BE…/CA…/AR…/numérico)
  lote: string;
  pedido: number;
}
export interface SurtidoCarton {
  code: string;
  lines: SurtidoLine[];
}
export interface SurtidoHeader {
  pedido?: string;
  sucursal?: string;
  despacho?: string;
}
export interface Surtido {
  header: SurtidoHeader;
  cartons: SurtidoCarton[];
}

interface Line {
  y: number;
  items: PDFExtractText[];
}

function groupLines(content: PDFExtractText[]): Line[] {
  const items = content.filter((i) => i.str && i.str.trim() !== "");
  const lines: Line[] = [];
  for (const it of items) {
    let ln = lines.find((l) => Math.abs(l.y - it.y) < 3);
    if (!ln) { ln = { y: it.y, items: [] }; lines.push(ln); }
    ln.items.push(it);
  }
  lines.forEach((l) => l.items.sort((a, b) => a.x - b.x));
  lines.sort((a, b) => a.y - b.y);
  return lines;
}

function col(items: PDFExtractText[], lo: number, hi: number): string {
  return items.filter((i) => i.x >= lo && i.x < hi).map((i) => i.str.trim()).join(" ").trim();
}

export async function parseSurtido(pathOrBuffer: string | Buffer): Promise<Surtido> {
  const pdf = new PDFExtract();
  const data =
    typeof pathOrBuffer === "string"
      ? await pdf.extract(pathOrBuffer, {})
      : await pdf.extractBuffer(pathOrBuffer, {});

  const header: SurtidoHeader = {};
  const cartons: SurtidoCarton[] = [];
  let current: SurtidoCarton | null = null;

  for (const page of data.pages) {
    for (const ln of groupLines(page.content)) {
      const text = ln.items.map((i) => i.str.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      if (!text) continue;

      let m: RegExpMatchArray | null;
      if ((m = text.match(/Pedido\s*:\s*(\S+)/))) header.pedido = m[1];
      if ((m = text.match(/Sucursal\s*:\s*(\S+)/))) header.sucursal = m[1];
      if ((m = text.match(/Despacho\s*:\s*(\S+)/))) header.despacho = m[1];

      const cm = text.match(/^Cart[oó]n\s*:\s*(.+)$/i);
      if (cm) {
        const val = cm[1].trim();
        if (/^\d+$/.test(val)) { current = { code: val, lines: [] }; cartons.push(current); }
        continue; // "Multiple" u otro no numérico -> cartón falso, ignorar
      }

      if (/^Producto\b/i.test(text) && /Pedido/i.test(text)) continue; // encabezado de tabla

      const pedidoStr = col(ln.items, T_PEDIDO, Number.MAX_SAFE_INTEGER);
      const codigo = col(ln.items, T_CODIGO, T_LOTE);
      const lote = col(ln.items, T_LOTE, T_PEDIDO);
      const producto = col(ln.items, 0, T_CODIGO);
      if (producto && codigo && /^\d+$/.test(pedidoStr) && current) {
        current.lines.push({ producto, codigo, lote, pedido: parseInt(pedidoStr, 10) });
      }
    }
  }
  return { header, cartons };
}
