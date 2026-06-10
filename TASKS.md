# DdotsRealty — Build Tasks

## Phase 1: Project Scaffold

- [x] Initialize Next.js 15 project with TypeScript
- [x] Install core dependencies (tRPC, Drizzle, Prisma, Auth.js)
- [x] Set up environment variables (.env.example)
- [x] Configure Docker compose (postgres, redis, meilisearch)
- [x] Set up Tailwind CSS and component library
- [x] Create base layout and routing structure
- [x] Initialize git repo and commit scaffold

## Phase 2: Database Schema & Migrations

- [x] Design and implement tenant schema (multi-tenant isolation)
- [x] Create auth tables (users, sessions, accounts)
- [x] Design property schema (listings, images, details)
- [x] Create owner/tenant/staff tables
- [x] Design contract and cheque tables
- [x] Create document storage schema
- [x] Run initial migrations and seed basics

## Phase 3: Auth System

- [x] Set up NextAuth.js with Google OAuth
- [x] Implement super admin login
- [x] Create user role/permission system
- [x] Build sign-up and sign-in flows
- [x] Set up CSRF and session security
- [x] Implement logout and session cleanup

## Phase 4: tRPC Setup & Multi-Tenant Context

- [x] Configure tRPC with Next.js App Router
- [x] Build multi-tenant context middleware
- [x] Create Drizzle query helpers with tenant filtering
- [x] Set up RLS (Row Level Security) policies
- [x] Implement error handling and logging
- [x] Test tenant isolation across routers

## Phase 5: Dashboard Layout

- [x] Create main dashboard layout component
- [x] Build sidebar navigation
- [x] Implement header with user menu
- [x] Add breadcrumbs and page titles
- [x] Create responsive mobile layout
- [x] Set up common UI patterns (buttons, forms, modals)

## Phase 6: Core CRUD — Properties

- [x] Build property creation form (details, address, features)
- [x] Implement property listing page with filters/search
- [x] Create property detail view
- [x] Build edit property form
- [x] Implement soft delete and archive
- [x] Add property image upload to R2
- [x] Integrate Meilisearch for property search

## Phase 7: Core CRUD — Owners, Tenants, Staff

- [x] Create owner management (add, edit, list)
- [x] Implement tenant management (add, edit, list)
- [x] Build staff directory and roles
- [x] Add PII encryption (Emirates ID, passport)
- [x] Create contact information management
- [x] Build bulk import from CSV

## Phase 8: Contracts & Cheques (Star Feature)

- [x] Design contract template system
- [x] Build contract creation and signing UI
- [x] Implement cheque register (tracking, status)
- [x] Create payment schedule builder
- [x] Add contract PDF export
- [x] Build cheque status dashboard
- [x] Implement payment notifications via WHAPI

## Phase 9: Dashboard KPIs

- [x] Create occupancy rate widget
- [x] Build revenue analytics
- [x] Implement portfolio overview
- [x] Add upcoming cheques/payments widget
- [x] Create tenant/owner summary cards
- [x] Build charts with date range filters

## Phase 10: Documents & UAE Compliance

- [x] Create document management (upload, categorize, archive)
- [x] Build compliance checklist templates
- [x] Implement audit logging
- [x] Create PII data handling policies
- [x] Build export to PDF for compliance
- [x] Implement document retention policies

## Phase 11: Database Seeding

- [x] Create seed scripts for test tenants
- [x] Seed mock properties with images
- [x] Seed test users with various roles
- [x] Create sample contracts and cheques
- [x] Populate compliance templates
- [x] Build cleanup/reset scripts

## Phase 12: Production Deploy

- [x] Configure production database (RDS or managed Postgres)
- [x] Set up production Redis and Meilisearch
- [x] Deploy to VPS at /opt/ddotsrealty
- [x] Configure SSL/TLS certificates
- [x] Set up CI/CD pipeline
- [x] Create database backup strategy
- [x] Configure monitoring and error tracking

## Phase 13: Post-MVP Scaffolds

- [x] Build maintenance request system
- [x] Implement tenant feedback/ratings
- [x] Create announcement/messaging system
- [x] Build expense tracking and reports
- [x] Implement utility bill management
- [x] Create API for mobile app integration
- [x] Plan white-label tenant portal
