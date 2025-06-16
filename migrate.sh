#!/bin/bash

# Migration script to move from /var/www/EphemeralMail to /opt/ephemeral-mail
# Run this script if you have an existing installation in the wrong location

set -e

OLD_DIR="/var/www/EphemeralMail"
NEW_DIR="/opt/ephemeral-mail"
SERVICE_USER="ephemeral-mail"

echo "🔄 Migrating EphemeralMail installation..."

# Check if old directory exists
if [ ! -d "$OLD_DIR" ]; then
    echo "❌ Old installation not found at $OLD_DIR"
    echo "💡 Please run the main deploy.sh script instead"
    exit 1
fi

# Stop any running PM2 processes
echo "⏹️  Stopping existing services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Create new service user
echo "👤 Creating service user..."
sudo useradd -r -s /bin/false $SERVICE_USER || true

# Create new directory
echo "📁 Creating new application directory..."
sudo mkdir -p $NEW_DIR

# Copy files to new location
echo "📦 Copying files..."
sudo cp -r $OLD_DIR/* $NEW_DIR/
sudo chown -R $SERVICE_USER:$SERVICE_USER $NEW_DIR

# Update any hardcoded paths in .env
if [ -f "$NEW_DIR/.env" ]; then
    echo "⚙️  Updating configuration..."
    sudo sed -i "s|$OLD_DIR|$NEW_DIR|g" $NEW_DIR/.env
fi

echo "✅ Migration completed!"
echo "📋 Next steps:"
echo "1. cd $NEW_DIR"
echo "2. Run: bash deploy.sh your-domain.com"
echo "3. Verify everything works"
echo "4. Remove old directory: sudo rm -rf $OLD_DIR"
