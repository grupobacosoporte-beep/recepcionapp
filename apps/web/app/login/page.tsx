"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const usuarioLimpio = usuario.trim().toLowerCase();

    if (!usuarioLimpio || !password) {
      setErrorMessage("Ingresa el usuario y la contraseña.");
      return;
    }

    try {
      setLoading(true);

      const emailInterno = usuarioLimpio.includes("@")
      ? usuarioLimpio
      : `${usuarioLimpio}@baco.local`;

      const { error } = await supabase.auth.signInWithPassword({
        email: emailInterno,
        password,
      });

      if (error) {
        setErrorMessage("Usuario o contraseña incorrectos.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "#f5f5f2",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e5e0",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 24 }}>
          Recepción Baco
        </h1>

        <p style={{ color: "#666", marginBottom: 20 }}>
          Ingresa con el usuario asignado a la sucursal.
        </p>

        <label htmlFor="usuario">Usuario</label>

        <input
          id="usuario"
          type="text"
          autoComplete="username"
          placeholder="Ejemplo: talagante1"
          value={usuario}
          disabled={loading}
          onChange={(event) => setUsuario(event.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            margin: "6px 0 14px",
            padding: 10,
          }}
        />

        <label htmlFor="password">Contraseña</label>

        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          disabled={loading}
          onChange={(event) => setPassword(event.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            margin: "6px 0 14px",
            padding: 10,
          }}
        />

        {errorMessage && (
          <p style={{ color: "#c0392b", fontSize: 14 }}>
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 11,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </main>
  );
}
