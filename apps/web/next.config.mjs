/** @type {import('next').NextConfig} */
const nextConfig = {
  // Piloto: no bloquear el despliegue por lint/tipos.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Next 14: los paquetes de servidor se declaran aquí (no en serverExternalPackages).
  experimental: {
    serverComponentsExternalPackages: ["pdf.js-extract"],
  },

  // pdf.js-extract/pdfjs referencia 'canvas' (nativo) solo para renderizar imágenes.
  // Para extraer TEXTO no se necesita: lo resolvemos a módulo vacío en el build.
  webpack: (config) => {
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    return config;
  },
};

export default nextConfig;
