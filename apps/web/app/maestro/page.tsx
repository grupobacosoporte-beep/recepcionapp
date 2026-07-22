"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import { apiPostForm } from "@/lib/api";

export default function MaestroPage() {
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<any>(null);

  async function subir() {
    if (!label || !file) return;
    setErr(null); setRes(null); setBusy(true);
    const fd = new FormData();
    fd.append("label", label);
    fd.append("file", file);
    try {
      const r = await apiPostForm<any>("/catalog/maestro/versions", fd);
      setRes(r);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <h3>Cargar MAESTRO</h3>
      <p>Nombre de la versión (ej. "MAESTRO julio 2026")</p>
      <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ padding: 8 }} />
      <p>Archivo CSV del MAESTRO</p>
      <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div style={{ marginTop: 16 }}>
        <button onClick={subir} disabled={busy}>{busy ? "Cargando…" : "Cargar MAESTRO"}</button>
      </div>
      {err && <p style={{ marginTop: 12, color: "#b00020" }}>Error: {err}</p>}
      {res && (
        <div style={{ marginTop: 12, color: "#0a7d29" }}>
          <p>✓ MAESTRO cargado.</p>
          <p>Filas: {res.filas} · Códigos únicos: {res.codigosUnicos} · SKUs: {res.skusUnicos} · Con precio: {res.conPrecio} · Conflictos: {res.conflicts?.length ?? 0}</p>
        </div>
      )}
    </Shell>
  );
}
