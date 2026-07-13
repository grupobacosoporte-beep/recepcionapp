"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { apiGet } from "@/lib/api";

export default function Recepciones() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { apiGet<any[]>("/receptions").then(setList).catch(() => {}); }, []);
  return (
    <Shell>
      <h3>Recepciones</h3>
      <table style={{ width: "100%", background: "#fff", borderCollapse: "collapse" }}>
        <thead><tr><th align="left">N.º</th><th align="left">Estado</th><th></th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{r.number}</td><td>{r.status}</td>
              <td align="right"><Link href={`/recepciones/${r.id}`}>ver</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
