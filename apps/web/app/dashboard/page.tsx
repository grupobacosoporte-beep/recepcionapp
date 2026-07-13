"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { apiGet } from "@/lib/api";

export default function Dashboard() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { apiGet("/dashboard/summary").then(setS).catch(() => {}); }, []);
  return (
    <Shell>
      <h3>Resumen</h3>
      <div style={{ display: "flex", gap: 12 }}>
        <Card label="Recepciones hoy" value={s?.receptionsToday} />
        <Card label="Pendientes" value={s?.receptionsPending} />
        <Card label="Finalizadas" value={s?.receptionsFinished} />
        <Card label="Tiempo prom." value={s ? `${Math.round(s.avgReceptionMinutes)} min` : "…"} />
      </div>
    </Shell>
  );
}
function Card({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 12, minWidth: 120 }}>
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 22 }}>{value ?? "…"}</div>
    </div>
  );
}
