export const metadata = { title: "Recepción Baco" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f6f6f4" }}>{children}</body>
    </html>
  );
}
