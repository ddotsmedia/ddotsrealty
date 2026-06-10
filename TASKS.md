# DdotsRealty — Build Tasks

## Phase 1: Project Scaffold

- [x] Initialize Next.js 15 project with TypeScript
- [x] Install core dependencies (tRPC, Drizzle, Prisma, Auth.js)
- [x] Set up environment variables (.env.example)
- [x] Configure Docker compose (postgres, redis, meilisearch)
- [ ] Set up Tailwind CSS and component library
- [ ] Create base layout and routing structure
- [ ] Initialize git repo and commit scaffold

## Phase 2: Database Schema & Migrations

- [ ] Design and implement tenant schema (multi-tenant isolation)
- [ ] Create auth tables (users, sessions, accounts)
- [ ] Design property schema (listings, images, details)
- [ ] Create owner/tenant/staff tables
- [ ] Design contract and cheque tables
- [ ] Create document storage schema
- [ ] Run initial migrations and seed basics

## Phase 3: Auth System

- [ ] Set up NextAuth.js with Google OAuth
- [ ] Implement super admin login
- [ ] Create user role/permission system
- [ ] Build sign-up and sign-in flows
- [ ] Set up CSRF and session security
- [ ] Implement logout and session cleanup

## Phase 4: tRPC Setup & Multi-Tenant Context

- [ ] Configure tRPC with Next.js App Router
- [ ] Build multi-tenant context middleware
- [ ] Create Drizzle query helpers with tenant filtering
- [ ] Set up RLS (Row Level Security) policies
- [ ] Implement error handling and logging
- [ ] Test tenant isolation across routers

## Phase 5: Dashboard Layout

- [ ] Create main dashboard layout component
- [ ] Build sidebar navigation
- [ ] Implement header with user menu
- [ ] Add breadcrumbs and page titles
- [ ] Create responsive mobile layout
- [ ] Set up common UI patterns (buttons, forms, modals)

## Phase 6: Core CRUD — Properties

- [ ] Build property creation form (details, address, features)
- [ ] Implement property listing page with filters/search
- [ ] Create property detail view
- [ ] Build edit property form
- [ ] Implement soft delete and archive
- [ ] Add property image upload to R2
- [ ] Integrate Meilisearch for property search

## Phase 7: Core CRUD — Owners, Tenants, Staff

- [ ] Create owner management (add, edit, list)
- [ ] Implement tenant management (add, edit, list)
- [ ] Build staff directory and roles
- [ ] Add PII encryption (Emirates ID, passport)
- [ ] Create contact information management
- [ ] Build bulk import from CSV

## Phase 8: Contracts & Cheques (Star Feature)

- [ ] Design contract template system
- [ ] Build contract creation and signing UI
- [ ] Implement cheque register (tracking, status)
- [ ] Create payment schedule builder
- [ ] Add contract PDF export
- [ ] Build cheque status dashboard
- [ ] Implement payment notifications via WHAPI

## Phase 9: Dashboard KPIs

- [ ] Create occupancy rate widget
- [ ] Build revenue analytics
- [ ] Implement portfolio overview
- [ ] Add upcoming cheques/payments widget
- [ ] Create tenant/owner summary cards
- [ ] Build charts with date range filters

## Phase 10: Documents & UAE Compliance

- [ ] Create document management (upload, categorize, archive)
- [ ] Build compliance checklist templates
- [ ] Implement audit logging
- [ ] Create PII data handling policies
- [ ] Build export to PDF for compliance
- [ ] Implement document retention policies

## Phase 11: Database Seeding

- [ ] Create seed scripts for test tenants
- [ ] Seed mock properties with images
- [ ] Seed test users with various roles
- [ ] Create sample contracts and cheques
- [ ] Populate compliance templates
- [ ] Build cleanup/reset scripts

## Phase 12: Production Deploy

- [ ] Configure production database (RDS or managed Postgres)
- [ ] Set up production Redis and Meilisearch
- [ ] Deploy to VPS at /opt/ddotsrealty
- [ ] Configure SSL/TLS certificates
- [ ] Set up CI/CD pipeline
- [ ] Create database backup strategy
- [ ] Configure monitoring and error tracking

## Phase 13: Post-MVP Scaffolds

- [ ] Build maintenance request system
- [ ] Implement tenant feedback/ratings
- [ ] Create announcement/messaging system
- [ ] Build expense tracking and reports
- [ ] Implement utility bill management
- [ ] Create API for mobile app integration
- [ ] Plan white-label tenant portal
