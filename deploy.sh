#!/bin/bash

# EphemeralMail Deployment Script for Ubuntu 22.04
# Repository: https://github.com/tacssuki/EphemeralMail
# Usage: bash deploy.sh [your-domain.com]
# 
# This script handles:
# - Fresh installations
# - Updates to existing installations  
# - Migration from old installation locations
# - Complete production setup with optional Nginx and SSL

set -e

DOMAIN=${1:-localhost}
APP_DIR="/opt/ephemeral-mail"
SERVICE_USER="ephemeral-mail"

echo "🚀 EphemeralMail Deployment Script"
echo "📍 Domain: $DOMAIN"
echo "📁 Installation directory: $APP_DIR"
echo ""
echo "💡 DNS Configuration Required:"
echo "   1. A Record: $DOMAIN -> $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP')"
echo "   2. MX Record: $DOMAIN -> $DOMAIN (priority 10)"
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
if ! command -v node &> /dev/null || [[ $(node -v) != v18* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js $(node -v) installed"
else
    echo "✅ Node.js $(node -v) already installed"
fi

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create service user
echo "👤 Setting up service user..."
if ! id "$SERVICE_USER" &>/dev/null; then
    sudo useradd -r -s /bin/false $SERVICE_USER
    echo "✅ Created user: $SERVICE_USER"
else
    echo "✅ User $SERVICE_USER already exists"
fi

# Setup application directory
echo "📁 Setting up application directory..."
sudo mkdir -p $APP_DIR

# Check for existing installations in common locations and offer migration
OLD_LOCATIONS=("/var/www/EphemeralMail" "/opt/tempmail" "/home/ubuntu/EphemeralMail")
MIGRATION_NEEDED=false

for old_dir in "${OLD_LOCATIONS[@]}"; do
    if [ -d "$old_dir" ] && [ "$old_dir" != "$APP_DIR" ]; then
        echo "📍 Found existing installation at: $old_dir"
        read -p "Do you want to migrate from $old_dir to $APP_DIR? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "📦 Migrating installation..."
            # Stop any existing PM2 processes
            pm2 stop all 2>/dev/null || true
            pm2 delete all 2>/dev/null || true
            
            # Copy files
            sudo cp -r "$old_dir"/* "$APP_DIR/" 2>/dev/null || true
            MIGRATION_NEEDED=true
            break
        fi
    fi
done

sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR
cd $APP_DIR

# Clone or update repository
if [ -d ".git" ]; then
    echo "📥 Updating existing repository..."
    sudo -u $SERVICE_USER git stash || true
    sudo -u $SERVICE_USER git pull origin main
    sudo -u $SERVICE_USER git stash pop || true
else
    echo "📥 Cloning repository..."
    sudo -u $SERVICE_USER git clone https://github.com/tacssuki/EphemeralMail.git .
fi

# Install dependencies and build
echo "🔨 Installing dependencies and building..."
sudo -u $SERVICE_USER npm install
sudo -u $SERVICE_USER npm run build

# Setup environment file
echo "⚙️ Setting up environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        sudo -u $SERVICE_USER cp .env.example .env
        echo "📝 Created .env from template"
    else
        echo "📝 Creating .env file..."
        sudo -u $SERVICE_USER tee .env > /dev/null <<EOF
NODE_ENV=production
PORT=4444
DOMAIN=$DOMAIN
DATABASE_URL="file:./prod.db"
SMTP_PORT=25
SMTP_HOST=0.0.0.0
API_KEY_SECRET=temp-key-will-be-replaced
MAX_EMAIL_SIZE=10485760
EMAIL_RETENTION_HOURS=24
CLEANUP_INTERVAL_MINUTES=60
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    fi
fi

# Update environment variables
echo "🔧 Configuring environment variables..."
sudo -u $SERVICE_USER sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/g" .env
sudo -u $SERVICE_USER sed -i "s/NODE_ENV=.*/NODE_ENV=production/g" .env

# Generate secure API key if needed
if ! grep -q "API_KEY_SECRET=" .env || grep -q "your-super-secret-key-here\|temp-key-will-be-replaced" .env; then
    API_KEY=$(openssl rand -hex 32)
    sudo -u $SERVICE_USER sed -i "s/API_KEY_SECRET=.*/API_KEY_SECRET=$API_KEY/g" .env
    echo "🔑 Generated new API Key: $API_KEY"
    echo "🔑 IMPORTANT: Save this API key for admin access!"
else
    API_KEY=$(grep "API_KEY_SECRET=" .env | cut -d'=' -f2)
    echo "🔑 Using existing API key from .env"
fi

# Setup database
echo "🗄️ Setting up database..."
sudo -u $SERVICE_USER npx prisma generate
sudo -u $SERVICE_USER npx prisma db push

# Setup PM2
echo "🔄 Setting up PM2 process manager..."
# Stop and remove existing process if it exists
sudo -u $SERVICE_USER pm2 stop ephemeral-mail 2>/dev/null || true
sudo -u $SERVICE_USER pm2 delete ephemeral-mail 2>/dev/null || true

# Start the application
sudo -u $SERVICE_USER pm2 start dist/index.js --name ephemeral-mail

# Setup PM2 startup
echo "🔄 Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $SERVICE_USER --hp /home/$SERVICE_USER 2>/dev/null || true
sudo -u $SERVICE_USER pm2 save

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 25/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4444/tcp
sudo ufw --force enable

# Setup Nginx reverse proxy
echo "🌐 Setting up Nginx..."
read -p "Do you want to install Nginx reverse proxy? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo apt install -y nginx
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/ephemeral-mail > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:4444;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Increase timeout for large uploads
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/ephemeral-mail /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    echo "✅ Nginx configured and enabled"
fi

# Setup SSL certificate
echo "🔒 Setting up SSL certificate..."
if command -v nginx &> /dev/null; then
    read -p "Do you want to install SSL certificate with Let's Encrypt? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt install -y certbot python3-certbot-nginx
        read -p "Enter your email for SSL certificate: " SSL_EMAIL
        sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $SSL_EMAIL --redirect
        echo "✅ SSL certificate installed and configured"
    fi
else
    echo "⏩ Skipping SSL setup (Nginx not installed)"
fi

# Final status check
echo "🔍 Checking application status..."
sleep 3
sudo -u $SERVICE_USER pm2 status

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "  • Domain: $DOMAIN"
echo "  • Application URL: http://$DOMAIN"
echo "  • API Documentation: http://$DOMAIN/api-docs"
echo "  • API Key: $API_KEY"
echo "  • Installation Directory: $APP_DIR"
echo ""
echo "📧 DNS Configuration Required:"
echo "  1. A Record: $DOMAIN -> $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP')"
echo "  2. MX Record: $DOMAIN -> $DOMAIN (priority 10)"
echo ""
echo "🔧 Management Commands:"
echo "  • Check status: sudo -u $SERVICE_USER pm2 status"
echo "  • View logs: sudo -u $SERVICE_USER pm2 logs ephemeral-mail"
echo "  • Restart app: sudo -u $SERVICE_USER pm2 restart ephemeral-mail"
echo "  • Update app: cd $APP_DIR && sudo -u $SERVICE_USER git pull && sudo -u $SERVICE_USER npm run build && sudo -u $SERVICE_USER pm2 restart ephemeral-mail"
echo ""
echo "📚 Documentation:"
echo "  • Deployment Guide: https://github.com/tacssuki/EphemeralMail/blob/main/DEPLOYMENT.md"
echo "  • Multi-VPS Setup: https://github.com/tacssuki/EphemeralMail/blob/main/MULTI_VPS_GUIDE.md"
echo ""
echo "✨ Your temporary email service is now live!"
