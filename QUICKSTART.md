# 🚀 Quick Start Guide

Get Finance Manager up and running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- Supabase account (free at https://supabase.com)

## Step 1: Clone/Download Project

```bash
cd /path/to/finance
```

## Step 2: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select existing one
3. Go to **Settings → API**
4. Copy your:
   - Project URL (looks like `https://xxx.supabase.co`)
   - Service Role Key (starts with `eyJ...`)

## Step 3: Set Up Environment

Open `.env.local` and update:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-random-secret-key
```

## Step 4: Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Create new query
3. Copy-paste contents from `schema.sql`
4. Click **Run**

## Step 5: Start the App

### Option A: Using Docker (Recommended)

```bash
docker-compose up -d
```

Open http://localhost:3030

### Option B: Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Step 6: Login

Use test credentials:
- **Email**: `demo@example.com`
- **Password**: `demo@example.com`

Or create a new account!

## Troubleshooting

### Docker won't start
```bash
# Check if port 3030 is in use
docker-compose down
docker-compose up -d
```

### Database connection error
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check that `schema.sql` was executed
- Ensure Supabase project is active

### JWT errors
- Clear browser cookies
- Logout and login again
- Update `JWT_SECRET` if needed

### Port already in use
Edit `.env.local`:
```env
APP_PORT=3031  # Change to another port
```

## Next Steps

1. Add your saving goals
2. Add your bills
3. Track payments
4. Customize in Settings

## Need Help?

- Check [README.md](./README.md) for full documentation
- Review API endpoints in [API Docs](#api-endpoints)

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Sign up

### Bills
- `GET /api/bills` - Get all bills
- `POST /api/bills` - Create bill
- `POST /api/bills/:id/pay` - Record payment

---

**Happy saving! 💰**
