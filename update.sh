#!/bin/bash

# Update script for existing EphemeralMail installations
# Repository: https://github.com/tacssuki/EphemeralMail
# Run this from your installation directory: cd /opt/ephemeral-mail && ./update.sh

set -e

SERVICE_USER="ephemeral-mail"
EXPECTED_DIR="/opt/ephemeral-mail"
CURRENT_DIR=$(pwd)

echo "🔄 EphemeralMail Update Script"
echo "📍 Current directory: $CURRENT_DIR"

# Check if we're in the expected directory
if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
    echo "⚠️  Warning: Not in expected directory ($EXPECTED_DIR)"
    echo "💡 Consider running: cd $EXPECTED_DIR && ./update.sh"
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run from your EphemeralMail installation directory."
    echo "💡 Expected location: $EXPECTED_DIR"
    exit 1
fi

# Check if service user exists
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "❌ Service user '$SERVICE_USER' not found. Please run deploy.sh first."
    exit 1
fi

# Stop PM2 processes
echo "⏹️  Stopping services..."
sudo -u $SERVICE_USER pm2 stop ephemeral-mail 2>/dev/null || true

# Update code
echo "📥 Updating code from GitHub..."
sudo -u $SERVICE_USER git stash || true
sudo -u $SERVICE_USER git pull origin main
sudo -u $SERVICE_USER git stash pop || true

# Install dependencies and build
echo "🔨 Building application..."
sudo -u $SERVICE_USER npm install
sudo -u $SERVICE_USER npm run build

# Update database with session management
echo "🗄️  Updating database schema..."
echo "  - Generating Prisma client..."
sudo -u $SERVICE_USER npx prisma generate

echo "  - Applying database migrations..."
# Try migrate deploy first (for production)
if sudo -u $SERVICE_USER npx prisma migrate deploy 2>/dev/null; then
    echo "  ✅ Migrations applied successfully"
else
    echo "  ⚠️  Migrate deploy failed, trying db push..."
    sudo -u $SERVICE_USER npx prisma db push
fi

# Verify database is ready
echo "  - Verifying database schema..."
if sudo -u $SERVICE_USER npx prisma db pull --force 2>/dev/null; then
    echo "  ✅ Database schema verified"
else
    echo "  ⚠️  Database verification had issues, but continuing..."
fi

# Restart services
echo "🔄 Restarting services..."
sudo -u $SERVICE_USER pm2 start ephemeral-mail 2>/dev/null || {
    echo "Starting new PM2 process..."
    sudo -u $SERVICE_USER pm2 start dist/index.js --name ephemeral-mail
}

# Wait a moment for service to start
sleep 3

# Verify service health
echo "🏥 Checking service health..."
if curl -f http://localhost:4444/health >/dev/null 2>&1; then
    echo "  ✅ Service is responding"
else
    echo "  ⚠️  Service may not be fully ready yet"
    echo "  💡 Check logs: sudo -u $SERVICE_USER pm2 logs ephemeral-mail"
fi

echo "✅ Update completed!"
echo "🔧 Useful commands:"
echo "  - Check status: sudo -u $SERVICE_USER pm2 status"
echo "  - View logs: sudo -u $SERVICE_USER pm2 logs ephemeral-mail"
