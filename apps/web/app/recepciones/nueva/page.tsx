"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { apiPostForm } from "@/lib/api";

export default function NuevaRecepcion() {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function crear() {
    if (!number || !file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("number", number);
    fd.append("branchId", "11111111-1111-4111-8111-111111111111");    fd.append("surtido", file);
    try {
      const r: any = await apiPostForm("/receptions", fd);
      router.push(`/recepciones/${r.id}`);
    } finally { setBusy(false); }
  }
  return (
    <Shell>
      <h3>Nueva recepción</h3>
      <p>N.º de documento</p>
      <input value={number} onChange={(e) => setNumber(e.target.value)} style={{ padding: 8 }} />
      <p>PDF del surtido</p>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div style={{ marginTop: 16 }}>
        <button onClick={crear} disabled={busy}>{busy ? "Creando…" : "Crear recepción"}</button>
      </div>
    </Shell>
  );
}
