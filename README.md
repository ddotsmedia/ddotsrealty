# DdotsRealty — UAE Real Estate CRM & Property Management SaaS

A modern, multi-tenant real estate property management platform with comprehensive owner/tenant management, automated cheque tracking, document compliance, and business intelligence dashboards.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16 + Drizzle ORM
- **API**: tRPC v11 + Next.js API Routes
- **Authentication**: Auth.js v5
- **UI**: Tailwind CSS v4 + shadcn/Base UI components
- **Task Queue**: BullMQ + Redis
- **Search**: Meilisearch
- **File Storage**: Cloudflare R2
- **State Management**: TanStack Query (React Query)

## Key Features

- **Multi-Tenant Architecture** - Complete tenant isolation with agency-level admin controls
- **Property Management** - Comprehensive property catalog with locations, amenities, and media galleries
- **Owner & Tenant Management** - Full lifecycle management with document tracking and compliance
- **Smart Contracts** - Automated contract generation with status tracking and expiry alerts
- **Cheque Tracking** ⭐ - Auto-tracked post-dated cheques with calendar view, payment reminders, and dispute management
- **Cheque Calendar** - Visual dashboard for upcoming cheque payments with alerts
- **CRM & Leads** - Kanban-board leads pipeline, automated follow-up reminders, and conversion tracking
- **Maintenance Requests** - Work order management with contractor assignment and cost tracking
- **Document Management** - Secure document storage with UAE compliance (MOI, EJARI, etc.)
- **Dashboard & KPIs** - Real-time business analytics, revenue tracking, occupancy metrics
- **Accounting Integration** - Invoice generation, payment tracking, and financial reports

## Local Development

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** or **pnpm**
- **Docker** & **Docker Compose** (for services)
- PostgreSQL 16, Redis, Meilisearch (all via Docker)

### Setup Steps

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd ddotsrealty
   npm install
   ```

2. **Environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start services** (Docker Compose)
   ```bash
   docker compose up -d
   ```
   Services start on:
   - PostgreSQL: `localhost:5437`
   - Redis: `localhost:6379`
   - Meilisearch: `localhost:7700`

4. **Database setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3060](http://localhost:3060)

### Demo Credentials

**Super Admin Account**
- Email: `admin@ddotsmedia.com`
- Password: `ChangeMe123!`

**Agency Admin Account**
- Email: `admin@alshamsi.ae`
- Password: `Password123!`

## NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server (port 3060) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Populate demo data |
| `npm run db:studio` | Open Drizzle Studio UI |
| `npm run worker` | Start BullMQ worker process |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |

## Deployment

### Architecture

- **VPS**: Ubuntu 24.04 at `194.164.151.202`
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2 (v2.0.1+)
- **Deployment Path**: `/opt/ddotsrealty`
- **Domain**: `ddotsrealty.com`

### Deployment Process

1. **SSH into VPS**
   ```bash
   ssh user@194.164.151.202
   ```

2. **Run deployment script**
   ```bash
   cd /opt/ddotsrealty
   bash update.sh
   ```

   The script handles:
   - Git pull from main branch
   - npm ci (clean install)
   - Database migrations
   - Next.js build
   - PM2 process restart

3. **Verify deployment**
   ```bash
   pm2 logs ddotsrealty
   pm2 status
   ```

### Configuration Files

- **PM2 Config**: `ecosystem.config.js` — Two processes (web + worker)
- **Nginx Config**: `nginx.conf` — HTTPS, proxying, gzip, security headers
- **Environment**: `.env.production` — Production secrets (create on VPS)
- **Deploy Script**: `update.sh` — Automated deployment workflow

### PM2 Process Names

| Process | Port | Purpose |
|---------|------|---------|
| `ddotsrealty` | 3060 | Next.js web application |
| `ddotsrealty-worker` | - | BullMQ job worker (background jobs) |

### SSL Certificate

SSL certificates are managed via Let's Encrypt with paths:
- Certificate: `/etc/letsencrypt/live/ddotsrealty.com/fullchain.pem`
- Key: `/etc/letsencrypt/live/ddotsrealty.com/privkey.pem`

Renew certificates: `sudo certbot renew`

## Service Ports

| Service | Port | Host | Purpose |
|---------|------|------|---------|
| Next.js App | 3060 | localhost | Web application (production) |
| PostgreSQL | 5437 | localhost | Database |
| Redis | 6382 | VPS only | Cache & job queue |
| Meilisearch | 7703 | VPS only | Full-text search engine |

## Project Structure

```
ddotsrealty/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API routes & tRPC endpoint
│   │   └── layout.tsx         # Root layout
│   ├── server/
│   │   ├── api/               # tRPC routers
│   │   ├── db/                # Drizzle ORM schemas & migrations
│   │   ├── jobs/              # BullMQ worker & jobs
│   │   └── auth.ts            # Auth.js config
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & helpers
│   └── env.ts                 # Environment validation
├── public/                    # Static assets
├── tests/                     # Test files
├── drizzle/                   # Database migrations
├── ecosystem.config.js        # PM2 configuration
├── nginx.conf                 # Nginx server block
├── update.sh                  # Deployment script
├── .env.example               # Environment template
├── .env.production            # Production env (VPS only)
├── next.config.ts             # Next.js config
├── tsconfig.json              # TypeScript config
├── tailwind.config.ts         # Tailwind CSS config
└── package.json               # Dependencies & scripts
```

## Troubleshooting

### App won't start
```bash
# Check PM2 logs
pm2 logs ddotsrealty
pm2 logs ddotsreality-worker

# Restart processes
pm2 restart all --update-env
```

### Database connection issues
```bash
# Test connection
psql -h localhost -p 5437 -U ddotsrealty -d ddotsrealty

# Check migrations
npm run db:studio
```

### Redis connection issues
```bash
# Test Redis
redis-cli -p 6382 ping
# Should return "PONG"
```

### Nginx not routing traffic
```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

## Security Notes

- All secrets stored in `.env.production` (never committed)
- SSL/TLS via Let's Encrypt (auto-renew recommended)
- CORS configured for `ddotsrealty.com` only
- Database credentials restricted to VPS internal network
- Rate limiting on API endpoints via tRPC middleware
- Input validation via Zod schemas
- CSRF protection enabled by default

## Support & Maintenance

- PM2 handles automatic process restarts on crash
- Database backups: Configure via AWS S3 / Cloudflare R2
- Logs: Check PM2, Nginx, and application logs regularly
- Monitoring: Set up PM2 Plus or third-party monitoring service

## License

Proprietary — DdotsMedia Group
