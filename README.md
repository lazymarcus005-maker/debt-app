# Finance Manager - Next.js App

A modern personal finance management app built with Next.js, TypeScript, and Supabase.

## Features

- 🔐 Authentication with JWT tokens
- 💰 Track saving goals
- 💳 Manage recurring bills and debts
- 📊 Dashboard with overview
- 📱 Responsive mobile-first design
- 🐳 Docker & Docker Compose setup

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Supabase account

## Setup Instructions

### 1. Environment Variables

Create `.env.local` file:

```bash
APP_PORT=3030
NODE_ENV=development

# Supabase
SUPABASE_URL=https://smhfyezfhbwsaamwmazv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3030
NEXT_PUBLIC_SUPABASE_URL=https://smhfyezfhbwsaamwmazv.supabase.co
```

### 2. Create Supabase Tables

Run these SQL queries in your Supabase dashboard:

```sql
-- Users table
CREATE TABLE USERS (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills table
CREATE TABLE BILLS (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES USERS(id),
  name VARCHAR(255) NOT NULL,
  billing_type VARCHAR(50) NOT NULL, -- 'recurring' or 'debt'
  sub_type VARCHAR(50) NOT NULL, -- 'utility', 'subscription', 'loan', 'installment', 'credit_card'
  amount DECIMAL(10, 2),
  due_day INTEGER NOT NULL,
  start_date DATE NOT NULL,
  next_due_date DATE,
  last_paid_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  total_amount DECIMAL(10, 2),
  remaining_amount DECIMAL(10, 2),
  installment_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill Payments table
CREATE TABLE BILL_PAYMENTS (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES BILLS(id),
  amount DECIMAL(10, 2) NOT NULL,
  paid_at TIMESTAMP NOT NULL,
  cycle_due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Running with Docker Compose

```bash
# Start the app
docker-compose up -d

# The app will be available at http://localhost:3030
```

### 4. Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email & password
- `POST /api/auth/signup` - Create new account

### Bills
- `GET /api/bills` - Get all bills (requires JWT)
- `POST /api/bills` - Create new bill (requires JWT)

## Project Structure

```
.
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home redirect
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── dashboard/
│   │   └── page.tsx            # Main dashboard
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   └── signup/
│   │   │       └── route.ts
│   │   └── bills/
│   │       └── route.ts
│   └── globals.css             # Global styles
├── lib/
│   ├── jwt.ts                  # JWT utilities
│   ├── supabase.ts             # Supabase client
│   ├── api.ts                  # API client
│   └── middleware.ts           # Auth middleware
├── Dockerfile                  # Docker image config
├── docker-compose.yml          # Docker Compose config
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local                  # Environment variables
```

## Default Login

For testing, create a user via signup or use:
- Email: `user@example.com`
- Password: `user@example.com` (same as email for demo)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down

# Rebuild containers
docker-compose up -d --build
```

## Security Notes

⚠️ **In Production:**
- Change `JWT_SECRET` to a strong random value
- Implement proper password hashing (bcrypt)
- Use HTTPS only
- Set secure CORS policies
- Validate and sanitize all inputs
- Use environment-specific configurations

## License

MIT
