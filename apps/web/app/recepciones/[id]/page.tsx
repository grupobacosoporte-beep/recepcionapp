"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Shell from "@/components/Shell";
import { apiGet, apiPostJson } from "@/lib/api";

export default function DetalleRecepcion() {
  const { id } = useParams<{ id: string }>();
  const [prog, setProg] = useState<any>(null);
  const [diffs, setDiffs] = useState<any[]>([]);
  // Polling cada 7 s (arquitectura permite migrar a SSE sin cambiar la UI).
  useEffect(() => {
    const load = () => apiGet(`/receptions/${id}/progress`).then(setProg).catch(() => {});
    load();
    const t = setInterval(load, 7000);
    return () => clearInterval(t);
  }, [id]);
  async function finalizar() {
    await apiPostJson(`/receptions/${id}/finish`, {});
    setDiffs(await apiGet<any[]>(`/receptions/${id}/differences`));
  }
  return (
    <Shell>
      <h3>Recepción</h3>
      {prog && (
        <div style={{ display: "flex", gap: 12 }}>
          <Stat l="Esperado" v={prog.totalExpected} /><Stat l="Recibido" v={prog.totalReceived} />
          <Stat l="Restante" v={prog.totalRemaining} /><Stat l="Sobrantes" v={prog.surplus} />
          <Stat l="No identif." v={prog.unidentified} />
        </div>
      )}
      <div style={{ marginTop: 16 }}><button onClick={finalizar}>Finalizar y ver diferencias</button></div>
      {diffs.length > 0 && (
        <table style={{ marginTop: 16, background: "#fff", width: "100%" }}>
          <thead><tr><th align="left">SKU</th><th>Tipo</th><th>Cantidad</th></tr></thead>
          <tbody>{diffs.map((d, i) => (<tr key={i}><td>{d.sku}</td><td>{d.type}</td><td align="center">{d.qty}</td></tr>))}</tbody>
        </table>
      )}
    </Shell>
  );
}
function Stat({ l, v }: { l: string; v: any }) {
  return <div style={{ background: "#fff", borderRadius: 8, padding: 12, minWidth: 90 }}><div style={{ color: "#666", fontSize: 13 }}>{l}</div><div style={{ fontSize: 20 }}>{v ?? "…"}</div></div>;
}
