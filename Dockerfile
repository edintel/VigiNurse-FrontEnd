# Imagen del panel web de VigiNurse (Next.js con SSR).
#
# No es un sitio estático: hay rutas renderizadas en el servidor, así que corre
# un proceso Node en cada petición. Por eso va como contenedor en App Service y
# no como Static Web App.

FROM node:22-alpine AS deps
WORKDIR /app
# Solo los manifiestos primero: si no cambian las dependencias, esta capa se
# reutiliza y no se reinstala en cada build.
COPY package.json package-lock.json ./
RUN npm ci


FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ATENCIÓN: las variables NEXT_PUBLIC_ se hornean en el bundle en TIEMPO DE
# BUILD, no se leen en runtime. Un app setting con este nombre en App Service no
# hace absolutamente nada: hay que pasarlas como build-arg y reconstruir la
# imagen para cambiarlas.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_OHIF_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_OHIF_URL=$NEXT_PUBLIC_OHIF_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Usuario sin privilegios: el servidor de Next no necesita root.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# La salida standalone ya trae el servidor y sus dependencias mínimas.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
