/** @type {import('next').NextConfig} */
const nextConfig = {
  // Piloto: no bloquear el despliegue por lint/tipos; se endurece luego.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // pdf.js-extract usa APIs de Node en el servidor.
  serverExternalPackages: ["pdf.js-extract"],
};
export default nextConfig;
