# Baco Logística — Esqueleto Fase 0

Fundaciones revisables **antes** de construir la lógica de negocio. Incluye el
modelo de datos, el contrato de la API y la estructura de RBAC + auth.

## Qué incluye (y qué no)

Incluye:
- `apps/web/prisma/schema.prisma` — modelo de datos completo (Postgres/Neon).
- `apps/web/prisma/seed.ts` — permisos, roles, matriz rol-permiso y local piloto.
- `apps/web/lib/auth/permissions.ts` — fuente única de RBAC (permisos, roles, matriz).
- `apps/web/lib/auth/guard.ts` — esqueleto del guard (permiso + ámbito de local).
- `packages/contract/openapi.yaml` — contrato de la API v1 (validado).
- `packages/rules-spec/` — dónde vivirán los vectores de reglas compartidos PDA/servidor.
- Configuración del monorepo (pnpm workspaces + Turborepo).

**No** incluye todavía (es Fase 1): la implementación de los route handlers, el
parser de PDF, la lógica de clasificación en TS, la app PDA refactorizada ni el UI.

## Verificaciones hechas
- OpenAPI validado con `openapi-spec-validator` (17 rutas, 26 esquemas).
- `permissions.ts` y `guard.ts` compilan con `tsc --strict` sin errores.
- El `schema.prisma` se formateó y revisó a mano; **valídalo localmente** con
  `prisma validate` (el motor de Prisma no se pudo descargar en el entorno de
  construcción de este entregable).

## Puesta en marcha local (cuando decidan avanzar)
1. Provisiona Neon desde el Marketplace de Vercel y define `DATABASE_URL`.
2. `pnpm install`
3. `pnpm --filter web prisma migrate dev` (crea las tablas)
4. `pnpm --filter web prisma db seed` (permisos, roles, local piloto)
5. Configura el proyecto de Supabase Auth y las variables de entorno de auth.

## Decisiones reflejadas
- Supabase = identidad; RBAC en Neon (desacoplado, reemplazable).
- Multi-local desde el diseño; `branch_id` en las tablas de dominio; piloto = local "PILOTO".
- `scan_event` con `idempotency_key` como base del sync offline idempotente.
- Almacenamiento tras interfaz (Blob hoy, reemplazable).

## Estado Fase 1 (piezas construidas y verificadas)
1. Reglas compartidas de escaneo — 13/13 casos OK en TS y Kotlin (misma fuente).
2. Parser del PDF de surtido (TS) — validado vs surtido real: 23 cartones, 175 productos, 1815 unidades (= pdfplumber).
3. API + auth:
   - Cerebro de recepción (`service.ts`) — verificado con surtido + MAESTRO reales (173/175 productos escaneables por EAN).
   - Importador del MAESTRO (`maestroImport.ts`) — idéntico al CSV real (3569 códigos, 1377 SKUs, 0 conflictos).
   - Auth por JWT de Supabase (JWKS) + RBAC desde Neon.
   - Endpoints: /auth/me, /receptions (crear con PDF, listar, detalle, avance, cierre, diferencias),
     /catalog/maestro/versions (import), /catalog/branches, /pda/receptions/:id/bundle, /pda/sync.

Los módulos puros están type-checkeados. Los route handlers corren en tu Supabase/Neon
(no en este entorno): requieren `DATABASE_URL` y `SUPABASE_URL` (ver .env.example),
`prisma migrate dev` y `prisma db seed`.

## Falta (siguientes piezas)
- Panel web (UI Next.js sobre estos endpoints).
- App PDA refactorizada a offline-first contra la API.
- Dashboard, reportes y export a Excel.
