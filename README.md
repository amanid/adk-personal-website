# Amani Konan Dieudonne - Personal Website

> Senior Data Scientist, Principal AI Engineer & Statistician-Econometrician with 13+ years of international experience.

A full-featured personal portfolio and CMS built with Next.js 16, featuring a bilingual public site (EN/FR), an advanced admin dashboard with analytics and financial market data, and a multi-theme design system.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 | App Router, React Server Components |
| React | 19 | UI framework |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Utility-first styling |
| Framer Motion | 12 | Animations & transitions |
| PostgreSQL | - | Relational database |
| Prisma | 6 | ORM & migrations |
| NextAuth.js | 5 beta | Authentication (credentials + Google OAuth) |
| next-intl | 4 | Internationalization (EN/FR) |
| Recharts | - | Dashboard charts (Area, Bar, Pie) |
| yahoo-finance2 | - | Commodity price data |
| Cheerio | - | Server-side HTML parsing (BRVM scraper) |
| React Hook Form + Zod | 7 / 4 | Form management & validation |

---

## Features

### Public Site
- Responsive landing page with 10 sections (hero, about, stats, expertise, career, publications, projects, services, impact, CTA)
- Blog with categories, tags, comments, and view tracking
- 27 analytical publications across 7 categories with PDF downloads
- Project portfolio with live/GitHub links
- Career timeline (11 experience entries, 9 education, 5 certifications)
- Skills visualization with 5 categories
- Service request system with status tracking
- Q&A section with threaded answers
- Contact form with email notifications
- Bilingual content (English/French) with locale routing
- 6-theme system (Midnight Gold, Light Professional, Ocean Blue, Emerald, Burgundy Rose, Sunset Warm)
- Particle background with theme-adaptive colors

### Admin Dashboard
- Role-protected admin area (ADMIN role required)
- Advanced analytics dashboard with interactive charts
- Page view tracking with device, browser, country detection
- Traffic trends with period selector (7d / 30d / 90d)
- Full CRUD for all content types (blog, publications, projects, experience, education, certifications, skills)
- Service request management with status workflow
- Contact message inbox with read/unread tracking
- User management with role promotion
- Site settings key-value store
- Financial markets page (commodity prices via Yahoo Finance)
- BRVM stock exchange data with live scraping
- TradingView embedded charts
- File upload system (images + PDFs, max 10MB)
- Rich text editor (TipTap) for blog posts

---

## Architecture

```
src/
├── app/
│   ├── [locale]/           # i18n routing (en/fr)
│   │   ├── admin/          # Protected admin area
│   │   │   ├── analytics/  # Full analytics page
│   │   │   ├── blog/       # Blog CRUD
│   │   │   ├── finance/    # Financial markets
│   │   │   ├── publications/
│   │   │   ├── experience/
│   │   │   ├── projects/
│   │   │   ├── skills/
│   │   │   ├── services/
│   │   │   ├── qa/
│   │   │   ├── users/
│   │   │   ├── messages/
│   │   │   └── settings/
│   │   ├── auth/           # Login/Register
│   │   ├── blog/           # Public blog
│   │   ├── publications/   # Public publications
│   │   └── ...             # Other public pages
│   ├── api/
│   │   ├── admin/          # Admin-only endpoints
│   │   │   ├── analytics/  # Analytics aggregation
│   │   │   ├── finance/    # Commodities & BRVM
│   │   │   ├── blog/
│   │   │   └── ...
│   │   ├── track/          # Page view beacon
│   │   └── ...             # Public API routes
│   └── globals.css         # Theme CSS variables
├── components/
│   ├── admin/
│   │   ├── charts/         # Recharts components
│   │   ├── DashboardClient.tsx
│   │   └── FileUpload.tsx
│   ├── layout/             # Navbar, Footer
│   ├── sections/           # Landing page sections
│   └── PageViewTracker.tsx # Client-side beacon
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma singleton
│   ├── cache.ts            # In-memory TTL cache
│   ├── themes.ts           # Theme definitions
│   ├── ThemeContext.tsx     # Theme React context
│   ├── utils.ts            # Helpers (cn, formatDate, slugify)
│   └── validations.ts      # Zod schemas
├── data/                   # Static data files
├── i18n/                   # Routing config
└── messages/               # EN/FR translation files
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Google OAuth credentials (optional, for social login)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd adk-personal-website

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see table below)

# Run database migrations
npx prisma migrate deploy

# Seed the database (optional)
npm run seed

# Start the development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth.js secret (generate with `openssl rand -base64 32`) | Yes |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | No |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | No |
| `NEXTAUTH_URL` | Base URL of the application | Yes |
| `SMTP_HOST` | SMTP server for email notifications | No |
| `SMTP_PORT` | SMTP port | No |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASS` | SMTP password | No |
| `CONTACT_EMAIL` | Email to receive contact form submissions | No |

---

## Deployment

### Render.com

The project includes a `render.yaml` configuration for deployment on Render:

```bash
# Build command
npm install --legacy-peer-deps && npx prisma generate && npm run build

# Start command
npm run start
```

1. Connect your GitHub repository to Render
2. Set environment variables in the Render dashboard
3. Deploy -- Render will use `render.yaml` for configuration

---

## Admin Guide

### First-time Setup
1. Register an account via `/auth/register`
2. Promote yourself to ADMIN by updating the `role` field in the `User` table:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```
3. Access the admin panel at `/admin`

### Admin Panel
- **Dashboard**: Overview stats, traffic charts, market prices, recent activity
- **Analytics**: Detailed traffic analytics with device, browser, country breakdowns
- **Finance**: Commodity prices (Cocoa, Coffee, Gold, Oil, Sugar, Cotton), BRVM stocks, TradingView charts
- **Content Management**: Full CRUD for blog posts, publications, projects, experience, education, certifications, and skills
- **Service Requests**: Track and manage client service inquiries
- **Messages**: View and manage contact form submissions
- **Users**: Manage user accounts and roles
- **Settings**: Key-value site configuration

---

## License

All rights reserved. This project is proprietary.
