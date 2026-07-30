import type { NextConfig } from "next";

// Origen del backend (API + hubs de SignalR + imágenes de planos servidas como estáticos).
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5025/api";
// Origen del visor OHIF, que se embebe en un iframe para ver estudios de imagen.
const ohifUrl = process.env.NEXT_PUBLIC_OHIF_URL ?? "";

// Devuelve solo el esquema+host de una URL (sin ruta), para usarlo en las directivas del CSP.
function toOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

// Origen del backend en http(s) y su equivalente en ws(s) para las conexiones de SignalR.
const apiOrigin = toOrigin(apiBaseUrl);
const wsOrigin = apiOrigin.replace(/^http/, "ws");
const ohifOrigin = toOrigin(ohifUrl);

const isDev = process.env.NODE_ENV !== "production";

// Une las fuentes de una directiva descartando las vacías.
const sources = (...values: string[]) => values.filter(Boolean).join(" ");

const contentSecurityPolicy = [
  `default-src 'self'`,
  // Next.js inyecta scripts inline para la hidratación; en desarrollo además necesita eval
  // para el refresco en caliente. Sin nonces no es posible endurecerlo más sin romper la app.
  `script-src ${sources("'self'", "'unsafe-inline'", isDev ? "'unsafe-eval'" : "")}`,
  `style-src 'self' 'unsafe-inline'`,
  // blob:/data: para vistas previas y descargas generadas en el cliente; apiOrigin para los planos.
  `img-src ${sources("'self'", "data:", "blob:", apiOrigin)}`,
  `font-src 'self' data:`,
  // XHR/fetch hacia la API y WebSocket hacia los hubs de SignalR.
  `connect-src ${sources("'self'", apiOrigin, wsOrigin, ohifOrigin)}`,
  // El visor OHIF se muestra embebido en un modal.
  `frame-src ${sources("'self'", ohifOrigin)}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  // La app no debe poder embeberse en sitios de terceros (clickjacking).
  `frame-ancestors 'none'`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

// HSTS solo en producción: en desarrollo se sirve por http y forzaría https en localhost.
if (!isDev) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  });
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
