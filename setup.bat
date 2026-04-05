@echo off
setlocal enabledelayedexpansion

echo 🚀 Finance Manager - Setup Script
echo ==================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    echo    Visit: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker is installed
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ⚠️  .env.local file not found, creating from template...
    (
        echo APP_PORT=3030
        echo NODE_ENV=development
        echo.
        echo # Supabase
        echo SUPABASE_URL=https://smhfyezfhbwsaamwmazv.supabase.co
        echo SUPABASE_SERVICE_ROLE_KEY=
        echo.
        echo # JWT
        echo JWT_SECRET=your-secret-key-change-in-production
        echo.
        echo # Next.js
        echo NEXT_PUBLIC_APP_URL=http://localhost:3030
        echo NEXT_PUBLIC_SUPABASE_URL=https://smhfyezfhbwsaamwmazv.supabase.co
    ) > .env.local
    echo ✅ .env.local created
    echo.
    echo 📝 Please update .env.local with your Supabase credentials:
    echo    1. Set SUPABASE_SERVICE_ROLE_KEY
    echo    2. Update JWT_SECRET if needed
    echo.
)

echo 📋 Next steps:
echo.
echo 1. Update .env.local with your Supabase credentials
echo.
echo 2. Run the schema.sql file in Supabase:
echo    - Go to Supabase Dashboard
echo    - Select your project
echo    - Go to 'SQL Editor'
echo    - Create new query and paste schema.sql contents
echo    - Execute
echo.
echo 3. Start Docker containers:
echo    docker-compose up -d
echo.
echo 4. Open http://localhost:3030 in your browser
echo.
echo 5. Login with:
echo    Email: demo@example.com
echo    Password: demo@example.com
echo.
echo ✅ Setup complete!
echo.
pause
