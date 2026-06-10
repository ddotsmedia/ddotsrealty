# Decisions

One line per non-obvious decision.

## Log

- Project located at C:\websites\ddotsrealty (local dev); deploys to /opt/ddotsrealty on VPS.
- Ports: app 3060, postgres 5437 (dr_postgres), redis 6382 (dr_redis), meilisearch 7703 (dr_meilisearch).
- PII (Emirates ID, passport) encrypted at rest with AES-256-GCM using PII_ENCRYPTION_KEY; masked in UI.
- UUID primary keys via gen_random_uuid()/crypto.randomUUID across all tables.
- Multi-tenant isolation: tenant_id on every table; enforced per-procedure in tRPC (tenantProcedure) with eq(table.tenantId, ctx.tenantId) on every query; super_admin (tenantId null) bypasses the filter to see all tenants.
- create-next-app installed Next 16 (not 15) and Zod 4 — both adopted; code is written against them.
- shadcn/ui here is the Base UI (@base-ui/react) registry, NOT Radix: components use the `render` prop instead of `asChild`, and Select onValueChange is `(value, details) => void`.
- React Query v5: list queries use `placeholderData: (prev) => prev` (the old `keepPreviousData` option was removed).
- Local Redis host port is 6383 (6382 was occupied by another project's container); docker-compose uses ${REDIS_HOST_PORT:-6382} so VPS still uses 6382.
- users.tenantId is NOT NULL, so the platform SUPER_ADMIN belongs to a "Ddots Media" platform tenant; its super_admin role bypasses tenant filters regardless.
- Public portal lives under /portal (not /) to avoid a route collision with the root landing; root `/` redirects to /dashboard (logged in) or /login.
- Auth.js v5 uses the edge-safe split: auth.config.ts (edge, providers+authorized) + auth.ts (Node, Credentials+db+bcrypt); middleware.ts uses auth.config only.
- Cheque schedule auto-generated from a contract: buildChequeSchedule splits rentAmount across numCheques (last cheque absorbs rounding so the sum is exact) with due dates evenly spread across the term.
- Leads, Maintenance, Listings, and Accounting modules were added beyond the original 13-phase TASKS list because they are referenced by the nav, schema, and seed data (they were implied by the architecture/directory but omitted from the phase list).
- Dev validation: scripts/validate-*.ts run tRPC routers via createCaller against the live DB (no browser) to verify business logic and tenant scoping end-to-end.
