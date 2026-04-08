# ✅ Finance Manager - Setup Checklist

Use this checklist to ensure everything is properly set up.

## Pre-Setup Requirements

- [ ] Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- [ ] Supabase account created ([Sign up](https://supabase.com))
- [ ] Document your Supabase credentials (URL + Service Role Key)
- [ ] Decide on a strong JWT_SECRET

## Initial Setup

### Step 1: Environment Configuration

- [ ] Open `.env.local`
- [ ] Update `SUPABASE_URL` (from Supabase Settings → API)
- [ ] Update `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Settings → API)
- [ ] Update `JWT_SECRET` to a random string
- [ ] Verify `APP_PORT=3030` (or your preferred port)
- [ ] Verify `NEXT_PUBLIC_APP_URL=http://localhost:3030`

### Step 2: Database Setup

- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Create a new query
- [ ] Copy contents of `schema.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" to execute
- [ ] Verify no errors occurred
- [ ] Check Tables section - should see 3 new tables:
  - [ ] USERS
  - [ ] BILLS
  - [ ] BILL_PAYMENTS

### Step 3: Verify Project Files

- [ ] `package.json` exists
- [ ] `tsconfig.json` exists
- [ ] `next.config.js` exists
- [ ] `Dockerfile` exists
- [ ] `docker-compose.yml` exists
- [ ] `app/` directory exists with:
  - [ ] `layout.tsx`
  - [ ] `page.tsx`
  - [ ] `globals.css`
  - [ ] `login/page.tsx`
  - [ ] `dashboard/page.tsx`
  - [ ] `api/auth/login/route.ts`
  - [ ] `api/auth/signup/route.ts`
  - [ ] `api/bills/route.ts`
- [ ] `lib/` directory exists with:
  - [ ] `jwt.ts`
  - [ ] `supabase.ts`
  - [ ] `api.ts`
  - [ ] `middleware.ts`

## Running the App

### Option A: Docker (Recommended)

- [ ] Open terminal in project root
- [ ] Run: `docker-compose up -d`
- [ ] Wait 30-60 seconds for build & startup
- [ ] Open browser: `http://localhost:3030`
- [ ] Page loads and shows login/signup
- [ ] No errors in Docker logs

Verify:
```bash
docker-compose logs -f app
```

### Option B: Local Development

- [ ] Open terminal in project root
- [ ] Run: `npm install`
- [ ] Wait for all dependencies to install
- [ ] Run: `npm run dev`
- [ ] Open browser: `http://localhost:3000`
- [ ] Page loads and shows login/signup

## First Login

- [ ] Navigate to login page
- [ ] Try to login with:
  - Email: `demo@example.com`
  - Password: `demo@example.com`
- [ ] Successfully logged in
- [ ] Redirected to dashboard
- [ ] Can see Dashboard tab is active
- [ ] Can see summary cards (Total Saved, Bills This Month)
- [ ] Can see "Next Bills" section
- [ ] See sample bills data (Electricity, Water, BlueCard)

## Navigation Testing

- [ ] Click "Saving" in bottom nav → shows saving goals
- [ ] Click "Bills" in bottom nav → shows bills list
- [ ] Click "More" in bottom nav → shows profile & settings
- [ ] Click "Dashboard" in bottom nav → back to overview
- [ ] All transitions smooth and tabs highlight correctly

## FAB Button Testing

- [ ] On Dashboard tab: FAB shows "+" (clickable)
- [ ] On Saving tab: Click FAB → "Add Saving Goal" modal opens
- [ ] On Bills tab: Click FAB → "Add Bill" modal opens
- [ ] Modal close button (✕) works
- [ ] Can type in form fields

## API Testing

Test the APIs using curl (see [API_TESTING.md](./API_TESTING.md)):

### Auth Endpoints
- [ ] `POST /api/auth/login` works → returns token
- [ ] `POST /api/auth/signup` works → creates user + returns token
- [ ] Invalid credentials → 401 error

### Bills Endpoints
- [ ] `GET /api/bills` works → returns user's bills
- [ ] `GET /api/bills` without token → 401 error
- [ ] `POST /api/bills` creates new bill → 201 response
- [ ] `POST /api/bills` missing fields → 400 error

## Browser Compatibility

- [ ] Chrome/Edge: ✅ Works
- [ ] Firefox: ✅ Works
- [ ] Safari: ✅ Works
- [ ] Mobile Safari (iOS): ✅ Works
- [ ] Chrome Mobile: ✅ Works
- [ ] Responsive at 390px width: ✅ Yes

## Mobile Testing

- [ ] Open on phone/tablet
- [ ] Layout adapts correctly
- [ ] Header is readable
- [ ] Bottom navigation is accessible
- [ ] Forms are usable
- [ ] No horizontal scroll
- [ ] Text size is appropriate

## Performance Checks

- [ ] App loads in < 2 seconds
- [ ] No console errors
- [ ] No network errors
- [ ] API responses < 500ms
- [ ] No memory leaks (DevTools Performance)

## Security Checks

⚠️ **Development Only - Fix Before Production:**

- [ ] Check `.env.local` is in `.gitignore` ✅
- [ ] JWT_SECRET is not a placeholder ✅
- [ ] Database RLS policies considered (optional initial setup)
- [ ] HTTPS will be used in production 📋
- [ ] Password hashing will be implemented 📋
- [ ] Input validation will be enhanced 📋

## Deployment Readiness

### For Docker Deployment
- [ ] Environment variables defined in `.env` (not .env.local)
- [ ] Dockerfile is optimized
- [ ] docker-compose.yml is production-ready
- [ ] Image builds successfully: `docker build -t finance-app .`
- [ ] Can push to Docker registry

### For Traditional Hosting
- [ ] Can run on Node.js 18+
- [ ] Build works: `npm run build`
- [ ] Start works: `npm start`
- [ ] Environment variables configurable
- [ ] Database migrations handled

## Documentation Review

- [ ] Read [README.md](./README.md) - Full documentation
- [ ] Read [QUICKSTART.md](./QUICKSTART.md) - Quick reference
- [ ] Read [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - File layout
- [ ] Read [API_TESTING.md](./API_TESTING.md) - API examples
- [ ] Read [CONVERSION_SUMMARY.md](./CONVERSION_SUMMARY.md) - What was built

## Customization

- [ ] Update app title (app name)
- [ ] Change colors if needed (globals.css gradient)
- [ ] Update logo/favicon
- [ ] Customize demo user data
- [ ] Add more sample bills if needed

## Stopping/Debugging

### Stop Docker
```bash
docker-compose down
```
- [ ] Containers stopped
- [ ] Volume data preserved

### View Logs
```bash
docker-compose logs -f app
```
- [ ] Can see app startup logs
- [ ] Can see request logs
- [ ] Can identify issues

### Rebuild
```bash
docker-compose up -d --build
```
- [ ] Forces rebuild
- [ ] Latest image created
- [ ] Container restarts

## Production Pre-Launch

Before going live, complete:

### Security
- [ ] Implement password hashing (bcrypt)
- [ ] Set up HTTPS/SSL certificates
- [ ] Enable database RLS policies
- [ ] Set secure CORS policies
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Set strong JWT_SECRET

### Performance
- [ ] Add caching layers (Redis)
- [ ] Enable database query caching
- [ ] Optimize database indexes
- [ ] Add CDN for static files
- [ ] Enable compression

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Enable database logging
- [ ] Set up monitoring alerts
- [ ] Configure log aggregation
- [ ] Enable performance tracing

### Deployment
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling
- [ ] Set up backup strategy
- [ ] Document deployment process
- [ ] Plan disaster recovery

## Support Resources

| Need Help With | Resource |
|---|---|
| Getting Started | [QUICKSTART.md](./QUICKSTART.md) |
| Architecture | [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) |
| API Details | [API_TESTING.md](./API_TESTING.md) |
| Full Docs | [README.md](./README.md) |
| What Was Built | [CONVERSION_SUMMARY.md](./CONVERSION_SUMMARY.md) |

## Notes

```
Date Setup Completed: _______________
Production Deployed: _______________
Notes: _______________________________________________
```

---

## Quick Reference

### Commands

```bash
# Development
npm run dev

# Build
npm run build
npm start

# Docker
docker-compose up -d
docker-compose logs -f app
docker-compose down
```

### Credentials (Testing)
- Email: `demo@example.com`
- Password: `demo@example.com`

### Ports
- Docker: `http://localhost:3030`
- Local: `http://localhost:3000`

### URLs
- Supabase: https://app.supabase.com
- Dashboard: http://localhost:3030
- API Docs: See [API_TESTING.md](./API_TESTING.md)

---

**✅ When all items are checked, your Finance Manager is ready to use!**

🎉 **Congratulations on launching your Personal Finance App!**
