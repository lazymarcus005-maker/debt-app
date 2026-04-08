# Project File Structure

```
finance/
│
├── 📂 app/                              # Next.js App Directory
│   ├── 📄 layout.tsx                    # Root layout, metadata
│   ├── 📄 page.tsx                      # Home (auth redirect)
│   ├── 📄 globals.css                   # Global styling (all components)
│   │
│   ├── 📂 login/
│   │   └── 📄 page.tsx                  # Login/Signup page
│   │
│   ├── 📂 dashboard/
│   │   └── 📄 page.tsx                  # Main app (Dashboard, Saving, Bills, More)
│   │
│   └── 📂 api/                          # API Routes
│       ├── 📂 auth/
│       │   ├── 📂 login/
│       │   │   └── 📄 route.ts          # POST: Authenticate user
│       │   └── 📂 signup/
│       │       └── 📄 route.ts          # POST: Register user
│       │
│       └── 📂 bills/
│           ├── 📄 route.ts              # GET: All bills, POST: Create bill
│           └── 📂 [id]/
│               └── 📂 pay/
│                   └── 📄 route.ts      # POST: Record payment
│
├── 📂 lib/                              # Utilities & Libraries
│   ├── 📄 jwt.ts                        # JWT tokens (sign, verify, decode)
│   ├── 📄 supabase.ts                   # Supabase client, types, DB schema
│   ├── 📄 api.ts                        # Axios client, auth interceptor
│   └── 📄 middleware.ts                 # Auth middleware (withAuth wrapper)
│
├── 📂 public/                           # Static files (if any)
│
├── 📄 package.json                      # Dependencies: next, react, supabase, jwt
├── 📄 tsconfig.json                     # TypeScript configuration
├── 📄 next.config.js                    # Next.js configuration
│
├── 🐳 Dockerfile                        # Docker image (Node 18 Alpine)
├── 🐳 docker-compose.yml                # Docker Compose (single service)
├── 📄 .dockerignore                     # Docker build exclusions
│
├── 📝 .env.local                        # Environment variables (Git ignored)
├── 📝 .env.example                      # Environment template
├── 📝 .gitignore                        # Git exclusions
│
├── 🗄️ schema.sql                        # Database initialization (Supabase)
│
├── 🛠️ setup.sh                          # Setup script (Linux/Mac)
├── 🛠️ setup.bat                         # Setup script (Windows)
│
├── 📚 README.md                         # Full documentation
├── 📚 QUICKSTART.md                     # 5-minute guide
├── 📚 CONVERSION_SUMMARY.md             # This file + overview
└── 📚 PROJECT_STRUCTURE.md              # File tree & descriptions
```

## Key Directories Explained

### `app/`
Next.js 14 App Router directory. Everything here is React components or API routes.

- **`layout.tsx`** - Wraps all pages, provides HTML structure
- **`page.tsx`** - Home page (redirects based on auth)
- **`globals.css`** - All CSS (responsive design, 390px mobile base)
- **`login/page.tsx`** - Login & Signup UI
- **`dashboard/page.tsx`** - Main app UI (tabs, modals, navigation)
- **`api/`** - REST API endpoints (automatically becomes `/api/*`)

### `lib/`
Reusable utilities and clients.

- **`jwt.ts`** - JWT token generation & verification
- **`supabase.ts`** - Supabase JS client + TypeScript types
- **`api.ts`** - Axios instance with Bearer token interceptor
- **`middleware.ts`** - Auth wrapper for protecting routes

### Root Files
- **`.env.local`** - Secrets (API keys, JWT secret)
- **`schema.sql`** - Database setup (run in Supabase once)
- **`Dockerfile`** - Container definition
- **`docker-compose.yml`** - Orchestration (single app service)
- **`package.json`** - Dependencies & npm scripts

---

## Database Tables (PostgreSQL via Supabase)

```
USERS
├── id (int, PK)
├── name (string)
├── email (string, UNIQUE)
└── created_at (timestamp)

BILLS
├── id (int, PK)
├── user_id (int, FK → USERS)
├── name (string)
├── billing_type (recurring / debt)
├── sub_type (utility / subscription / loan / installment / credit_card)
├── amount (decimal, nullable)
├── due_day (int, 1-31)
├── start_date (date)
├── next_due_date (date)
├── last_paid_at (timestamp, nullable)
├── is_active (boolean)
├── total_amount (decimal, nullable)
├── remaining_amount (decimal, nullable)
├── installment_amount (decimal, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)

BILL_PAYMENTS
├── id (int, PK)
├── bill_id (int, FK → BILLS)
├── amount (decimal)
├── paid_at (timestamp)
├── cycle_due_date (date)
└── created_at (timestamp)
```

---

## Component Hierarchy

```
RootLayout (layout.tsx)
└── Home / Login / Dashboard

Home (page.tsx)
└── Redirects to /login or /dashboard

Login (login/page.tsx)
├── Login Form
├── Signup Form
└── Toggle between modes

Dashboard (dashboard/page.tsx)
├── Header (sticky)
├── Main Content (tabs)
│   ├── Dashboard Tab
│   ├── Saving Tab
│   ├── Bills Tab
│   └── More Tab
├── FAB Button
├── Bottom Navigation
├── Modals
│   ├── Add Saving Goal
│   └── Add Bill
└── Grid Layout (mobile-first)
```

---

## Environment Variables

### Required (must set)
```bash
SUPABASE_URL              # Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY # Service role key (from Supabase)
```

### Recommended
```bash
JWT_SECRET              # Random string, change in production
APP_PORT                # Port for Docker (default 3030)
NEXT_PUBLIC_APP_URL     # Public app URL
```

---

## Build & Runtime Flow

```
Development:
1. npm run dev
2. Next.js starts on port 3000
3. Hot reload enabled
4. API routes at /api/*

Production/Docker:
1. docker-compose up
2. Docker builds image
3. npm run build (compiles Next.js)
4. npm start (serves optimized)
5. App runs on port 3000 (mapped to 3030)
```

---

## File Sizes (Approximate)

| File | Size | Purpose |
|------|------|---------|
| `app/globals.css` | ~8KB | All user-facing styles |
| `app/dashboard/page.tsx` | ~12KB | Main UI component |
| `app/login/page.tsx` | ~4KB | Auth UI |
| `api/bills/route.ts` | ~3KB | Bill endpoints |
| `api/auth/login/route.ts` | ~2KB | Login endpoint |
| `lib/supabase.ts` | ~2KB | DB types & client |
| Total Source | ~40KB | All code files |

---

## Performance Optimizations

✅ Implemented:
- Mobile-first CSS (smaller downloads)
- Minimal dependencies (16 total)
- API route caching ready
- Image optimization hooks in place
- TypeScript for safety

📋 Recommended Next:
- Add service worker (PWA)
- Implement Redis cache layer
- Add compression middleware
- Database query indexing

---

For more details, see:
- 📖 [README.md](./README.md) - Full docs
- 🚀 [QUICKSTART.md](./QUICKSTART.md) - Get started fast
- 📝 [CONVERSION_SUMMARY.md](./CONVERSION_SUMMARY.md) - What was built
