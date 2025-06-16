#!/bin/bash

# Migration script for EphemeralMail
# Handles migration from old installations or directory moves
# Repository: https://github.com/tacssuki/EphemeralMail

set -e

OLD_DIRS=("/var/www/EphemeralMail" "/opt/tempmail" "/home/ubuntu/EphemeralMail")
NEW_DIR="/opt/ephemeral-mail"
SERVICE_USER="ephemeral-mail"

echo "🔄 EphemeralMail Migration Script"
echo "📁 Target directory: $NEW_DIR"

# Find existing installation
FOUND_DIR=""
for dir in "${OLD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FOUND_DIR="$dir"
        echo "📍 Found existing installation at: $FOUND_DIR"
        break
    fi
done

if [ -z "$FOUND_DIR" ]; then
    echo "❌ No existing installation found"
    echo "💡 Please run the main deploy.sh script instead"
    exit 1
fi

# Stop any running PM2 processes
echo "⏹️  Stopping existing services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Create service user if doesn't exist
echo "👤 Setting up service user..."
if ! id "$SERVICE_USER" &>/dev/null; then
    sudo useradd -r -s /bin/false $SERVICE_USER
    echo "✅ Created user: $SERVICE_USER"
else
    echo "✅ User $SERVICE_USER already exists"
fi

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
