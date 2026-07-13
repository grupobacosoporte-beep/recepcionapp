"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  async function submit() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr("Usuario o contraseña incorrectos");
    else router.push("/dashboard");
  }
  return (
    <div style={{ maxWidth: 360, margin: "10vh auto", background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e5e5e0" }}>
      <h2>Recepción Baco</h2>
      <input placeholder="Usuario" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", margin: "8px 0", padding: 8 }} />
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", margin: "8px 0", padding: 8 }} />
      {err && <p style={{ color: "#c0392b" }}>{err}</p>}
      <button onClick={submit} style={{ width: "100%", padding: 10 }}>Iniciar sesión</button>
    </div>
  );
}
