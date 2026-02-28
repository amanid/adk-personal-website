# Deployment Guide: ADK Personal Website

## Complete Render.com Deployment & Configuration Manual

**Project**: Amani Konan Dieudonne - Personal Website & CMS
**Stack**: Next.js 16 | PostgreSQL | Prisma 6 | NextAuth.js v5
**Author**: Amani Konan Dieudonne
**Last Updated**: March 2026

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [GitHub Repository Setup](#2-github-repository-setup)
3. [Render.com Account & Project Setup](#3-rendercom-account--project-setup)
4. [Blueprint Deployment (render.yaml)](#4-blueprint-deployment-renderyaml)
5. [Environment Variables Configuration](#5-environment-variables-configuration)
6. [Database Setup & Migration](#6-database-setup--migration)
7. [Seeding the Database](#7-seeding-the-database)
8. [Custom Domain Configuration](#8-custom-domain-configuration)
9. [Google OAuth Setup](#9-google-oauth-setup)
10. [SMTP Email Configuration](#10-smtp-email-configuration)
11. [First Admin User Setup](#11-first-admin-user-setup)
12. [Post-Deployment Verification Checklist](#12-post-deployment-verification-checklist)
13. [Monitoring & Maintenance](#13-monitoring--maintenance)
14. [Troubleshooting Common Issues](#14-troubleshooting-common-issues)
15. [Updating & Redeploying](#15-updating--redeploying)
16. [Render.yaml Reference](#16-renderyaml-reference)
17. [Architecture Overview](#17-architecture-overview)

---

## 1. Prerequisites

Before deploying, ensure you have the following:

### Accounts Required

| Account | Purpose | URL |
|---------|---------|-----|
| GitHub | Source code hosting & CI/CD trigger | https://github.com |
| Render.com | Web service hosting & managed PostgreSQL | https://render.com |
| Google Cloud Console | OAuth 2.0 credentials (optional) | https://console.cloud.google.com |
| Gmail / SMTP Provider | Email notifications (optional) | Varies |

### Software Requirements (Local Development)

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| npm | 10+ | Package manager |
| Git | 2.40+ | Version control |
| PostgreSQL | 15+ | Local database (optional) |

### Project Requirements

- The GitHub repository must be public or connected to Render via GitHub OAuth
- The repository must contain `render.yaml` at the root
- All source code must be committed and pushed to the `master` branch
- The `.gitignore` must exclude `node_modules/`, `.next/`, `.env*` files

---

## 2. GitHub Repository Setup

### 2.1 Repository Structure

The repository should have the following key structure:

```
adk-personal-website/
├── .gitignore                 # Excludes node_modules, .next, .env files
├── render.yaml                # Render deployment configuration
├── package.json               # Dependencies and scripts
├── package-lock.json          # Locked dependency versions
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── prisma/
│   ├── schema.prisma          # Database schema (16 models)
│   ├── seed.ts                # Database seed script
│   └── migrations/            # SQL migration files
├── public/
│   ├── cv/                    # CV PDF files
│   ├── images/                # Profile photo
│   └── publications/          # 27 publication PDFs
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities, auth, prisma, themes
│   ├── data/                  # Static data files
│   ├── i18n/                  # Internationalization config
│   └── messages/              # EN/FR translation files
└── messages/                  # Locale JSON files
```

### 2.2 Verifying the Repository

Before proceeding, confirm:

```bash
# Check repo size (should be ~22MB)
git count-objects -vH

# Check all files are committed
git status

# Confirm remote is set
git remote -v
# Should show: origin  https://github.com/amanid/adk-personal-website.git

# Confirm render.yaml exists
cat render.yaml
```

### 2.3 Pushing Updates

Whenever you make changes locally:

```bash
git add -A
git commit -m "Description of changes"
git push origin master
```

Render will automatically detect the push and trigger a new deployment.

---

## 3. Render.com Account & Project Setup

### 3.1 Create a Render Account

1. Go to https://render.com
2. Click **Get Started for Free**
3. Sign up using your **GitHub account** (recommended for seamless repo access)
4. Verify your email address

### 3.2 Connect GitHub to Render

1. In the Render dashboard, go to **Account Settings** → **Git Providers**
2. Click **Connect GitHub**
3. Authorize Render to access your repositories
4. Select either **All repositories** or specifically `amanid/adk-personal-website`

### 3.3 Billing (Free Tier)

The free tier includes:
- **Web Services**: 750 hours/month (enough for one always-on service)
- **PostgreSQL**: 1 database with 1GB storage, 90-day expiry (must be renewed or upgraded)
- **Bandwidth**: 100 GB/month
- **Build Minutes**: 500 minutes/month

**Important**: Free tier databases expire after 90 days. Set a calendar reminder to renew or upgrade to a paid plan ($7/month for Starter) to avoid data loss.

---

## 4. Blueprint Deployment (render.yaml)

### 4.1 Understanding render.yaml

The `render.yaml` file defines the entire infrastructure:

```yaml
services:
  - type: web
    name: konan-amani-website
    runtime: node
    plan: free
    buildCommand: npm install --legacy-peer-deps && npx prisma generate && npx prisma migrate deploy && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: konan-website-db
          property: connectionString
      - key: AUTH_SECRET
        generateValue: true
      - key: AUTH_URL
        value: https://www.konanamanidieudonne.org
      - key: NEXT_PUBLIC_APP_URL
        value: https://www.konanamanidieudonne.org

databases:
  - name: konan-website-db
    plan: free
    databaseName: konan_website
```

### 4.2 Build Command Breakdown

The build command executes four steps in sequence:

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `npm install --legacy-peer-deps` | Install all dependencies (legacy flag for React 19 compatibility) |
| 2 | `npx prisma generate` | Generate Prisma Client from schema |
| 3 | `npx prisma migrate deploy` | Run all pending database migrations |
| 4 | `npm run build` | Build the Next.js production bundle |

### 4.3 Deploy via Blueprint

1. Go to https://dashboard.render.com/select-repo?type=blueprint
2. Select the `amanid/adk-personal-website` repository
3. Render will automatically detect `render.yaml`
4. Review the resources that will be created:
   - **Web Service**: `konan-amani-website`
   - **PostgreSQL Database**: `konan-website-db`
5. Click **Apply** to start the deployment

### 4.4 What Happens During Deployment

1. Render clones the repository
2. Detects Node.js runtime, installs the correct Node version
3. Executes the `buildCommand`:
   - Dependencies are installed (~2-3 minutes)
   - Prisma Client is generated (~5 seconds)
   - Database migrations are applied (~5 seconds)
   - Next.js builds the production bundle (~30-60 seconds)
4. Starts the service with `npm start`
5. Health checks confirm the service is running
6. Service is live on the Render URL

**Expected build time**: 3-5 minutes for the first deployment.

---

## 5. Environment Variables Configuration

### 5.1 Auto-Configured Variables

These are set automatically by `render.yaml`:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Auto-linked from database | PostgreSQL connection string |
| `AUTH_SECRET` | Auto-generated | Random 256-bit secret for NextAuth.js |
| `AUTH_URL` | `https://www.konanamanidieudonne.org` | Base URL for auth callbacks |
| `NEXT_PUBLIC_APP_URL` | `https://www.konanamanidieudonne.org` | Public-facing URL |

### 5.2 Variables to Add Manually

Go to **Dashboard** → **konan-amani-website** → **Environment** → **Add Environment Variable**:

| Variable | Value | Required | Purpose |
|----------|-------|----------|---------|
| `AUTH_GOOGLE_ID` | Your Google OAuth Client ID | No | Google sign-in |
| `AUTH_GOOGLE_SECRET` | Your Google OAuth Client Secret | No | Google sign-in |
| `SMTP_HOST` | `smtp.gmail.com` (or your provider) | No | Email notifications |
| `SMTP_PORT` | `587` | No | SMTP port (TLS) |
| `SMTP_USER` | Your email address | No | SMTP authentication |
| `SMTP_PASS` | App-specific password | No | SMTP authentication |
| `CONTACT_EMAIL` | `amanidieudonnekonan@gmail.com` | No | Contact form recipient |
| `NODE_ENV` | `production` | No | Usually auto-set by Render |

### 5.3 Important Notes on Environment Variables

- After adding or changing environment variables, you must **manually trigger a redeploy** (or Render will use them on the next auto-deploy)
- `AUTH_URL` must match your actual domain (including `https://`)
- If using Render's default URL before setting up a custom domain, temporarily set `AUTH_URL` to the Render URL (e.g., `https://konan-amani-website.onrender.com`)
- Never commit `.env` files to the repository

---

## 6. Database Setup & Migration

### 6.1 Database Auto-Creation

The `render.yaml` blueprint automatically creates a PostgreSQL database named `konan_website` on the free plan.

### 6.2 Viewing Database Details

1. Go to **Dashboard** → **konan-website-db**
2. Note the following details:
   - **Internal Database URL**: Used by the web service (auto-connected)
   - **External Database URL**: Use this to connect from your local machine
   - **Database Name**: `konan_website`
   - **User**: Auto-generated
   - **Port**: 5432

### 6.3 Migrations

Migrations run automatically during each build via `npx prisma migrate deploy`.

The project has 2 migration files:

| Migration | Tables Created |
|-----------|---------------|
| `20260228190330_add_cms_models` | User, Account, Session, BlogPost, Comment, ServiceRequest, Question, Answer, ContactMessage, Project, Experience, Education, Certification, SkillCategory, Skill, SiteSetting, Publication, PublicationComment |
| `20260228200000_add_page_views` | PageView (with indexes on path, createdAt, country) |

### 6.4 Verifying Migrations

In the Render **Shell** tab:

```bash
npx prisma migrate status
```

Expected output: All migrations should show as "Applied".

### 6.5 Connecting Locally to Remote Database

To inspect the remote database from your local machine:

```bash
# Copy the External Database URL from Render dashboard
# Then run Prisma Studio:
DATABASE_URL="postgresql://user:pass@host:5432/konan_website" npx prisma studio
```

---

## 7. Seeding the Database

### 7.1 Running the Seed Script

The seed script populates the database with initial content. This must be run **once** after the first deployment.

1. Go to **Dashboard** → **konan-amani-website** → **Shell**
2. Run:

```bash
npm run seed
```

### 7.2 What Gets Seeded

| Content Type | Count | Details |
|-------------|-------|---------|
| Experiences | 11 | Afreximbank, ITU, ICCO, UNIDIR, IOM, UNHCR, Barry-Callebaut, ICRISAT, FHI360, ICRAF, PAC-CI |
| Skill Categories | 5 | AI & ML, Data Engineering, Statistics & Econometrics, Software & Cloud, Strategy & Leadership |
| Skills | 25 | 5 skills per category with proficiency levels |
| Education | 9 | MBA Nexford, 3x MIT, FMVA CFI, Toulouse Master's, JHU, ENSEA x2 |
| Certifications | 5 | MIT x3, FMVA, JHU Data Science |
| Publications | 27 | Analytical reports across 7 categories |

### 7.3 Verifying the Seed

After seeding, verify in the Shell:

```bash
npx prisma studio
```

Or check the website:
- `/experience` should show 11 entries
- `/publications` should show 27 publications

### 7.4 Re-Seeding

The seed script is **idempotent** -- it checks if data already exists before inserting. Running it again will not create duplicates. To force a re-seed, you would need to clear the tables first (not recommended in production).

---

## 8. Custom Domain Configuration

### 8.1 Adding a Custom Domain on Render

1. Go to **Dashboard** → **konan-amani-website** → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Enter: `www.konanamanidieudonne.org`
4. Render will provide a **CNAME target** (e.g., `konan-amani-website.onrender.com`)

### 8.2 DNS Configuration

Go to your domain registrar (where you purchased `konanamanidieudonne.org`) and add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `www` | `konan-amani-website.onrender.com` | 3600 |
| A | `@` | Render's IP (if redirecting root) | 3600 |

**Or** for root domain redirect, add a **redirect rule** from `konanamanidieudonne.org` → `www.konanamanidieudonne.org`.

### 8.3 SSL Certificate

Render automatically provisions a free **Let's Encrypt SSL certificate** for custom domains. This typically takes 5-15 minutes after DNS propagation.

### 8.4 Verifying Domain Setup

1. Wait for DNS propagation (up to 48 hours, usually 5-30 minutes)
2. Visit `https://www.konanamanidieudonne.org`
3. Verify the SSL padlock icon in the browser
4. Check that all pages load correctly

### 8.5 Updating AUTH_URL

If you initially deployed with the Render URL, update the `AUTH_URL` environment variable:

1. Go to **Dashboard** → **konan-amani-website** → **Environment**
2. Update `AUTH_URL` to `https://www.konanamanidieudonne.org`
3. Update `NEXT_PUBLIC_APP_URL` to `https://www.konanamanidieudonne.org`
4. Trigger a manual deploy

---

## 9. Google OAuth Setup

### 9.1 Create Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application**
6. Set the following:

| Field | Value |
|-------|-------|
| Name | ADK Personal Website |
| Authorized JavaScript Origins | `https://www.konanamanidieudonne.org` |
| Authorized Redirect URIs | `https://www.konanamanidieudonne.org/api/auth/callback/google` |

7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### 9.2 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in:
   - App name: `Amani Konan Dieudonne`
   - User support email: your email
   - Developer contact email: your email
4. Add scopes: `email`, `profile`, `openid`
5. Save and publish

### 9.3 Add Credentials to Render

1. Go to **Dashboard** → **konan-amani-website** → **Environment**
2. Add:
   - `AUTH_GOOGLE_ID` = Your Client ID
   - `AUTH_GOOGLE_SECRET` = Your Client Secret
3. Trigger a redeploy

---

## 10. SMTP Email Configuration

### 10.1 Gmail SMTP Setup

If using Gmail:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required for app passwords)
3. Go to https://myaccount.google.com/apppasswords
4. Generate an **App Password** for "Mail"
5. Copy the 16-character password

### 10.2 Add SMTP Variables to Render

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `amanidieudonnekonan@gmail.com` |
| `SMTP_PASS` | The 16-character app password |
| `CONTACT_EMAIL` | `amanidieudonnekonan@gmail.com` |

### 10.3 Testing Email

After configuration, submit a test message via the `/contact` page. You should receive it at the `CONTACT_EMAIL` address.

---

## 11. First Admin User Setup

### 11.1 Register an Account

1. Go to `https://www.konanamanidieudonne.org/auth/register`
2. Create an account with your email and password
3. Or sign in with Google (if OAuth is configured)

### 11.2 Promote to Admin

1. Go to **Render Dashboard** → **konan-amani-website** → **Shell**
2. Run:

```bash
npx prisma studio
```

3. In Prisma Studio, navigate to the **User** table
4. Find your user and change the `role` field from `USER` to `ADMIN`
5. Save

**Alternative** -- run SQL directly:

```bash
# In the Render Shell, connect to the database:
# Use the Internal Database URL from your database dashboard
psql $DATABASE_URL -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'amanidieudonnekonan@gmail.com';"
```

### 11.3 Verify Admin Access

1. Log in to the website
2. Navigate to `/admin`
3. You should see the full admin dashboard with:
   - Stat cards (Users, Posts, Publications, etc.)
   - Traffic analytics charts
   - Period selector (7d / 30d / 90d)
   - Market prices ticker
   - Recent activity panels

---

## 12. Post-Deployment Verification Checklist

After completing all setup steps, verify each feature:

### Public Pages

| Page | URL | What to Check |
|------|-----|---------------|
| Home | `/` | Hero section, stats counter, all 10 sections load |
| About | `/about` | Bio, skills, education display |
| Experience | `/experience` | 11 entries with full bullet points |
| Publications | `/publications` | 27 publications, PDF download links work |
| Projects | `/projects` | Project cards display |
| Blog | `/blog` | Page loads (may be empty initially) |
| Services | `/services` | Service request form submits |
| Q&A | `/qa` | Page loads |
| Contact | `/contact` | Form submits, email received (if SMTP configured) |

### Authentication

| Feature | How to Test |
|---------|-------------|
| Registration | Create a new account at `/auth/register` |
| Login | Sign in with credentials at `/auth/login` |
| Google OAuth | Click "Sign in with Google" (if configured) |
| Admin redirect | Non-admin users redirected from `/admin` |

### Admin Dashboard

| Feature | How to Test |
|---------|-------------|
| Dashboard | `/admin` -- stat cards, charts, activity |
| Analytics | `/admin/analytics` -- traffic data, device breakdown |
| Finance | `/admin/finance` -- commodity prices, BRVM data, TradingView charts |
| Blog CRUD | `/admin/blog` -- create, edit, delete posts |
| Publications | `/admin/publications` -- manage publications |
| Experience | `/admin/experience` -- manage experience entries |
| Projects | `/admin/projects` -- manage projects |
| Skills | `/admin/skills` -- manage skill categories |
| Services | `/admin/services` -- view/manage service requests |
| Messages | `/admin/messages` -- view contact messages |
| Users | `/admin/users` -- manage user roles |
| Settings | `/admin/settings` -- site configuration |

### Bilingual Support

| Feature | How to Test |
|---------|-------------|
| English | Visit `/en` -- all content in English |
| French | Visit `/fr` -- all content in French |
| Language switcher | Toggle in the navbar |

### Theme System

| Theme | How to Test |
|-------|-------------|
| Midnight Gold (default) | Dark background, gold accents |
| Light Professional | Light background, blue accents |
| Ocean Blue | Dark blue theme |
| Emerald | Green theme |
| Burgundy Rose | Dark red theme |
| Sunset Warm | Warm orange theme |

### Page View Tracking

1. Visit any public page
2. Open browser DevTools → Network tab
3. Look for a `POST` request to `/api/track` returning 200
4. Check `/admin/analytics` for the recorded view

---

## 13. Monitoring & Maintenance

### 13.1 Render Dashboard Monitoring

- **Logs**: Dashboard → konan-amani-website → Logs (real-time server logs)
- **Metrics**: Dashboard → konan-amani-website → Metrics (CPU, Memory, Bandwidth)
- **Events**: Dashboard → konan-amani-website → Events (deploy history)

### 13.2 Database Monitoring

- **Dashboard** → konan-website-db → Metrics
- Monitor storage usage (free tier: 1GB limit)
- Monitor connection count

### 13.3 Free Tier Limitations

| Resource | Limit | What Happens |
|----------|-------|--------------|
| Web Service | Spins down after 15 min inactivity | ~30s cold start on next request |
| Database | 90-day expiry | Must renew or upgrade before expiry |
| Database Storage | 1 GB | Service errors when full |
| Bandwidth | 100 GB/month | Overage charges or service paused |
| Build Minutes | 500 min/month | Cannot deploy until reset |

### 13.4 Recommended Maintenance Schedule

| Task | Frequency | How |
|------|-----------|-----|
| Check database storage | Weekly | Render Dashboard → Database → Metrics |
| Review error logs | Weekly | Render Dashboard → Logs |
| Renew free database | Before 90-day expiry | Render Dashboard → Database |
| Update dependencies | Monthly | `npm update` locally, test, push |
| Check SSL certificate | Monthly | Browser padlock icon |
| Backup database | Before major updates | `pg_dump` via external connection |

### 13.5 Database Backup

```bash
# Using the External Database URL from Render:
pg_dump "postgresql://user:pass@host:5432/konan_website" > backup_$(date +%Y%m%d).sql
```

---

## 14. Troubleshooting Common Issues

### 14.1 Build Failures

**Error**: `npm install` fails
- **Cause**: Dependency conflicts with React 19
- **Fix**: Ensure `--legacy-peer-deps` is in the build command

**Error**: `prisma generate` fails
- **Cause**: Prisma schema syntax error
- **Fix**: Run `npx prisma validate` locally before pushing

**Error**: `prisma migrate deploy` fails
- **Cause**: Database not yet created or connection string wrong
- **Fix**: Check `DATABASE_URL` is correctly linked in environment variables

**Error**: `next build` fails with TypeScript errors
- **Cause**: Type errors in source code
- **Fix**: Run `npm run build` locally to identify and fix errors before pushing

### 14.2 Runtime Errors

**Error**: 500 Internal Server Error on all pages
- **Cause**: Missing `DATABASE_URL` or database not accessible
- **Fix**: Verify database is running and environment variables are set

**Error**: Authentication not working
- **Cause**: `AUTH_SECRET` or `AUTH_URL` misconfigured
- **Fix**: Ensure `AUTH_URL` matches the actual domain (with `https://`)

**Error**: Google OAuth redirect error
- **Cause**: Redirect URI mismatch
- **Fix**: Ensure Google Console redirect URI exactly matches `https://yourdomain.com/api/auth/callback/google`

**Error**: Page loads but no data
- **Cause**: Database not seeded
- **Fix**: Run `npm run seed` in the Render Shell

### 14.3 Performance Issues

**Issue**: Slow initial page load (~30 seconds)
- **Cause**: Free tier cold start (service spins down after 15 min inactivity)
- **Fix**: Upgrade to paid plan ($7/month) for always-on, or use an uptime monitor (e.g., UptimeRobot) to ping the site every 14 minutes

**Issue**: Charts not loading on admin dashboard
- **Cause**: Recharts renders client-side only
- **Fix**: This is expected behavior -- charts appear after JavaScript hydration

### 14.4 Email Issues

**Issue**: Contact form submissions not received
- **Cause**: SMTP not configured or app password incorrect
- **Fix**: Verify all SMTP environment variables, use Gmail App Password (not regular password)

---

## 15. Updating & Redeploying

### 15.1 Automatic Deploys

Every push to the `master` branch triggers an automatic deployment:

```bash
# Make changes locally
git add -A
git commit -m "Description of changes"
git push origin master
# Render automatically starts a new deploy
```

### 15.2 Manual Deploy

1. Go to **Dashboard** → **konan-amani-website**
2. Click **Manual Deploy** → **Deploy latest commit**

### 15.3 Rollback

1. Go to **Dashboard** → **konan-amani-website** → **Events**
2. Find a previous successful deploy
3. Click **Rollback** to revert to that version

### 15.4 Adding New Database Models

When adding new Prisma models:

1. Update `prisma/schema.prisma` locally
2. Run `npx prisma migrate dev --name description_of_change` locally (requires local DATABASE_URL)
3. If no local database, manually create the migration SQL file in `prisma/migrations/`
4. Commit and push -- `prisma migrate deploy` in the build command will apply it automatically

---

## 16. Render.yaml Reference

```yaml
# Full render.yaml with all options documented

services:
  - type: web                    # Service type: web, worker, cron, etc.
    name: konan-amani-website    # Service name (appears in dashboard)
    runtime: node                # Runtime: node, python, ruby, go, etc.
    plan: free                   # Plan: free, starter ($7), standard ($25)
    buildCommand: >-             # Build steps (run during each deploy)
      npm install --legacy-peer-deps &&
      npx prisma generate &&
      npx prisma migrate deploy &&
      npm run build
    startCommand: npm start      # Start command (run after build)
    envVars:                     # Environment variables
      - key: DATABASE_URL
        fromDatabase:            # Auto-linked from managed database
          name: konan-website-db
          property: connectionString
      - key: AUTH_SECRET
        generateValue: true      # Auto-generate a random secret
      - key: AUTH_URL
        value: https://www.konanamanidieudonne.org
      - key: NEXT_PUBLIC_APP_URL
        value: https://www.konanamanidieudonne.org

databases:
  - name: konan-website-db       # Database name
    plan: free                   # Plan: free (1GB, 90-day), starter ($7)
    databaseName: konan_website  # PostgreSQL database name
```

---

## 17. Architecture Overview

### 17.1 Request Flow

```
User Browser
    │
    ▼
Render CDN (SSL termination)
    │
    ▼
Next.js Server (Node.js)
    ├── Static Pages (pre-rendered)
    ├── Server Components (dynamic)
    ├── API Routes (/api/*)
    │       │
    │       ▼
    │   Prisma ORM
    │       │
    │       ▼
    │   PostgreSQL Database
    │
    ├── Client Components (React hydration)
    │       ├── Recharts (dashboard charts)
    │       ├── Framer Motion (animations)
    │       └── TradingView Widgets (finance)
    │
    └── External APIs
            ├── Yahoo Finance (commodity prices)
            ├── BRVM Scraper (stock exchange)
            └── Google OAuth (authentication)
```

### 17.2 Route Summary (71 Routes)

| Category | Count | Examples |
|----------|-------|---------|
| Public Pages | 14 | `/`, `/experience`, `/publications`, `/blog` |
| Admin Pages | 13 | `/admin`, `/admin/analytics`, `/admin/finance` |
| Auth Pages | 2 | `/auth/login`, `/auth/register` |
| Public API | 14 | `/api/blog`, `/api/experience`, `/api/contact` |
| Admin API | 26 | `/api/admin/blog`, `/api/admin/analytics` |
| Tracking API | 1 | `/api/track` |
| Auth API | 1 | `/api/auth/[...nextauth]` |

### 17.3 Database Schema (16 Models)

| Model | Purpose |
|-------|---------|
| User | Authentication & profiles |
| Account | OAuth provider accounts |
| Session | Active sessions |
| BlogPost | Blog articles (bilingual) |
| Comment | Blog comments |
| Publication | Research publications |
| PublicationComment | Publication comments |
| Project | Portfolio projects |
| Experience | Career history |
| Education | Academic background |
| Certification | Professional certifications |
| SkillCategory | Skill groupings |
| Skill | Individual skills with levels |
| ServiceRequest | Service inquiries |
| ContactMessage | Contact form submissions |
| SiteSetting | Key-value configuration |
| PageView | Traffic analytics |

---

## Quick Reference Card

| Action | Command / URL |
|--------|--------------|
| Deploy | Push to `master` branch |
| View logs | Render Dashboard → Logs |
| Run shell | Render Dashboard → Shell |
| Seed database | `npm run seed` (in Shell) |
| Check migrations | `npx prisma migrate status` (in Shell) |
| Promote admin | `psql $DATABASE_URL -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your@email.com';"` |
| Backup database | `pg_dump $EXTERNAL_DATABASE_URL > backup.sql` |
| View database | `npx prisma studio` (in Shell) |
| Rollback deploy | Render Dashboard → Events → Rollback |

---

*This guide covers the complete deployment lifecycle for the ADK Personal Website on Render.com. For additional support, consult the [Render documentation](https://render.com/docs) or the [Next.js deployment guide](https://nextjs.org/docs/app/building-your-application/deploying).*
