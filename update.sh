#!/bin/bash

# Update script for existing EphemeralMail installations
# Run this from your existing installation directory

set -e

SERVICE_USER="ephemeral-mail"
CURRENT_DIR=$(pwd)

echo "🔄 Updating EphemeralMail..."
echo "📍 Current directory: $CURRENT_DIR"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run from your EphemeralMail installation directory."
    exit 1
fi

# Stop PM2 processes
echo "⏹️  Stopping services..."
sudo -u $SERVICE_USER pm2 stop ephemeral-mail 2>/dev/null || true

# Update code
echo "📥 Updating code..."
sudo -u $SERVICE_USER git stash || true
sudo -u $SERVICE_USER git pull origin main
sudo -u $SERVICE_USER git stash pop || true

# Install dependencies and build
echo "🔨 Building application..."
sudo -u $SERVICE_USER npm install
sudo -u $SERVICE_USER npm run build

# Update database
echo "🗄️  Updating database..."
sudo -u $SERVICE_USER npx prisma generate
sudo -u $SERVICE_USER npx prisma db push

# Restart services
echo "🔄 Restarting services..."
sudo -u $SERVICE_USER pm2 start ephemeral-mail 2>/dev/null || {
    echo "Starting new PM2 process..."
    sudo -u $SERVICE_USER pm2 start dist/index.js --name ephemeral-mail
}

echo "✅ Update completed!"
echo "🔧 Useful commands:"
echo "  - Check status: sudo -u $SERVICE_USER pm2 status"
echo "  - View logs: sudo -u $SERVICE_USER pm2 logs ephemeral-mail"
