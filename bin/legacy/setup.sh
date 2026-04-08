#!/bin/bash

# Finance Manager Setup Script

echo "🚀 Finance Manager - Setup Script"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found, creating from template..."
    cat > .env.local << EOF
APP_PORT=3030
NODE_ENV=development

# Supabase
SUPABASE_URL=https://smhfyezfhbwsaamwmazv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3030
NEXT_PUBLIC_SUPABASE_URL=https://smhfyezfhbwsaamwmazv.supabase.co
EOF
    echo "✅ .env.local created"
    echo ""
    echo "📝 Please update .env.local with your Supabase credentials:"
    echo "   1. Set SUPABASE_SERVICE_ROLE_KEY"
    echo "   2. Update JWT_SECRET if needed"
    echo ""
fi

echo "📋 Next steps:"
echo ""
echo "1. Update .env.local with your Supabase credentials"
echo ""
echo "2. Run the schema.sql file in Supabase:"
echo "   - Go to Supabase Dashboard"
echo "   - Select your project"
echo "   - Go to 'SQL Editor'"
echo "   - Create new query and paste schema.sql contents"
echo "   - Execute"
echo ""
echo "3. Start Docker containers:"
echo "   docker-compose up -d"
echo ""
echo "4. Open http://localhost:3030 in your browser"
echo ""
echo "5. Login with:"
echo "   Email: demo@example.com"
echo "   Password: demo@example.com"
echo ""
echo "✅ Setup complete!"
