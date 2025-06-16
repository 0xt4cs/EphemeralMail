#!/bin/bash

# Deployment script for Ubuntu 22.04 VPS
# Run this script as: bash deploy.sh your-subdomain.example.com

set -e

DOMAIN=${1:-localhost}
APP_DIR="/opt/tempmail"
SERVICE_USER="tempmail"

echo "🚀 Starting deployment for domain: $DOMAIN"
echo "💡 Note: If you're using a subdomain (recommended), make sure to:"
echo "   1. Create an A record for '$DOMAIN' pointing to this VPS IP"
echo "   2. Create MX record for '$DOMAIN' pointing to '$DOMAIN'"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create service user
echo "👤 Creating service user..."
sudo useradd -r -s /bin/false $SERVICE_USER || true

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p $APP_DIR
sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR

# Clone and build application
echo "🔨 Building application..."
cd $APP_DIR
sudo -u $SERVICE_USER git clone https://github.com/tacssuki/EphemeralMail.git . || (sudo -u $SERVICE_USER git pull)
sudo -u $SERVICE_USER npm install
sudo -u $SERVICE_USER npm run build

# Setup database
echo "🗄️ Setting up database..."
sudo -u $SERVICE_USER npx prisma generate
sudo -u $SERVICE_USER npx prisma db push

# Configure environment
echo "⚙️ Configuring environment..."
sudo -u $SERVICE_USER cp .env.example .env
sudo -u $SERVICE_USER sed -i "s/DOMAIN=localhost/DOMAIN=$DOMAIN/g" .env
sudo -u $SERVICE_USER sed -i "s/NODE_ENV=development/NODE_ENV=production/g" .env

# Generate random API key
API_KEY=$(openssl rand -hex 32)
sudo -u $SERVICE_USER sed -i "s/API_KEY_SECRET=your-super-secret-key-here-change-in-production/API_KEY_SECRET=$API_KEY/g" .env

echo "🔑 Generated API Key: $API_KEY"
echo "🔑 Save this API key for admin access!"

# Setup PM2
echo "🔄 Setting up PM2..."
sudo -u $SERVICE_USER pm2 start dist/index.js --name ephemeral-mail
sudo -u $SERVICE_USER pm2 startup
sudo -u $SERVICE_USER pm2 save

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 25/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Setup Nginx (optional)
read -p "🌐 Do you want to install Nginx? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing Nginx..."
    sudo apt install -y nginx
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/ephemeral-mail > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    sudo ln -sf /etc/nginx/sites-available/ephemeral-mail /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
fi

# Setup SSL with Certbot (optional)
read -p "🔒 Do you want to install SSL certificate with Let's Encrypt? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure DNS MX record: MX 10 $DOMAIN"
echo "2. Configure DNS A record: A $DOMAIN <your-vps-ip>"
echo "3. API Documentation: http://$DOMAIN/api-docs"
echo "4. API Key for admin: $API_KEY"
echo ""
echo "🔧 Useful commands:"
echo "  - Check status: sudo -u $SERVICE_USER pm2 status"
echo "  - View logs: sudo -u $SERVICE_USER pm2 logs ephemeral-mail"
echo "  - Restart: sudo -u $SERVICE_USER pm2 restart ephemeral-mail"
