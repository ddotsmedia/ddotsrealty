# Decisions

One line per non-obvious decision.

## Log

- Project located at C:\websites\ddotsrealty (local dev); deploys to /opt/ddotsrealty on VPS.
- Ports: app 3060, postgres 5437 (dr_postgres), redis 6382 (dr_redis), meilisearch 7703 (dr_meilisearch).
- PII (Emirates ID, passport) encrypted at rest with AES-256-GCM using PII_ENCRYPTION_KEY; masked in UI.
- UUID primary keys via gen_random_uuid()/crypto.randomUUID across all tables.
- Multi-tenant isolation: tenant_id on every table; enforced in tRPC context + Drizzle query helper; RLS as defense-in-depth.
