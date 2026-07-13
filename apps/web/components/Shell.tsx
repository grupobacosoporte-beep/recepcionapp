"use client";
import Link from "next/link";
export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "#fff", borderBottom: "1px solid #e5e5e0" }}>
        <strong>Local Piloto</strong>
        <span style={{ color: "#666" }}>M. Rojas · QF</span>
      </header>
      <div style={{ display: "flex" }}>
        <nav style={{ width: 180, padding: 12 }}>
          <p><Link href="/dashboard">Dashboard</Link></p>
          <p><Link href="/recepciones">Recepciones</Link></p>
          <p><Link href="/recepciones/nueva">Nueva recepción</Link></p>
        </nav>
        <main style={{ flex: 1, padding: 16 }}>{children}</main>
      </div>
    </div>
  );
}
