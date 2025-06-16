# 🚀 VPS Deployment Guide for Ubuntu 22.04

This guide will help you deploy EphemeralMail on your Ubuntu 22.04 VPS with your custom domain.

> **💡 Multiple VPS Setup?** If your domain already points to another VPS, see [MULTI_VPS_GUIDE.md](./MULTI_VPS_GUIDE.md) for subdomain and multi-server deployment options.

## 📋 Prerequisites

- Ubuntu 22.04 VPS with root access
- Domain name with DNS management access
- Basic knowledge of Linux commands

## � Quick Deployment (Recommended)

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Run the Automated Deployment Script

```bash
# Clone the repository
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail

# Make the script executable
chmod +x deploy.sh

# Run deployment (replace with your domain)
./deploy.sh yourdomain.com
```

The script will automatically:
- ✅ Install Node.js 18 and PM2
- ✅ Build and start the application
- ✅ Setup database with Prisma
- ✅ Generate secure API key
- ✅ Configure firewall rules
- ✅ Setup PM2 auto-startup
- ✅ Optionally install Nginx reverse proxy
- ✅ Optionally setup SSL certificate

### Step 3: Configure DNS

After deployment, configure your DNS records:

**For GoDaddy:**
1. Login to [GoDaddy DNS Management](https://dcc.godaddy.com/manage/dns)
2. Add these records:

```
Type: A
Host: @
Points to: YOUR_VPS_IP
TTL: 1 Hour

Type: MX  
Host: @
Points to: yourdomain.com
Priority: 10
TTL: 1 Hour
```

**For Cloudflare:**
1. Login to Cloudflare dashboard
2. Add these records:

```
Type: A
Name: @
Content: YOUR_VPS_IP
Proxy: Off (DNS only)

Type: MX
Name: @  
Mail server: yourdomain.com
Priority: 10
```

## � Manual Deployment

If you prefer manual installation:

### Step 1: Server Preparation

```bash
# Connect to your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y
```

### Step 2: Install Dependencies

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create service user
sudo useradd -r -s /bin/false ephemeral-mail
```

### Step 3: Deploy Application

```bash
# Create app directory
sudo mkdir -p /opt/ephemeral-mail
sudo chown ephemeral-mail:ephemeral-mail /opt/ephemeral-mail
cd /opt/ephemeral-mail

# Clone repository
sudo -u ephemeral-mail git clone https://github.com/tacssuki/EphemeralMail.git .

# Install and build
sudo -u ephemeral-mail npm install
sudo -u ephemeral-mail npm run build

# Setup database
sudo -u ephemeral-mail npx prisma generate
sudo -u ephemeral-mail npx prisma db push

# Configure environment
sudo -u ephemeral-mail cp .env.example .env
# Edit .env with your domain and settings

# Start with PM2
sudo -u ephemeral-mail pm2 start dist/index.js --name ephemeral-mail
sudo -u ephemeral-mail pm2 startup
sudo -u ephemeral-mail pm2 save
```

## 🔍 Testing Your Deployment

1. **Test API Health**:
   ```bash
   curl http://yourdomain.com/api/health
   ```

2. **Test Email Generation**:
   ```bash
   curl -X POST http://yourdomain.com/api/emails/generate
   ```

3. **Check API Documentation**:
   - Visit: `http://yourdomain.com/api-docs`

## 📊 Step 7: Monitoring

### Check Service Status
```bash
sudo -u tempmail pm2 status
sudo -u tempmail pm2 logs tempmail
```

### View System Logs
```bash
journalctl -u nginx -f
tail -f /opt/tempmail/logs/app.log
```

### Monitor Resources
```bash
htop
df -h
free -m
```

## 🛡️ Step 8: Security Hardening

### Firewall Configuration
```bash
# Check firewall status
sudo ufw status

# Only allow necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 25/tcp   # SMTP
sudo ufw enable
```

### Regular Updates
```bash
# Create update script
cat > /opt/tempmail/update.sh << 'EOF'
#!/bin/bash
cd /opt/tempmail
sudo -u tempmail git pull
sudo -u tempmail npm install
sudo -u tempmail npm run build
sudo -u tempmail npx prisma generate
sudo -u tempmail pm2 restart tempmail
EOF

chmod +x /opt/tempmail/update.sh
```

## 🔧 Step 9: Backup Setup

### Database Backup
```bash
# Create backup script
cat > /opt/tempmail/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/tempmail/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /opt/tempmail/emails.db $BACKUP_DIR/emails_$DATE.db
find $BACKUP_DIR -name "emails_*.db" -mtime +7 -delete
EOF

chmod +x /opt/tempmail/backup.sh

# Add to crontab (daily backup at 2 AM)
echo "0 2 * * * /opt/tempmail/backup.sh" | sudo -u tempmail crontab -
```

## 📞 Step 10: Troubleshooting

### Common Issues

1. **Port 25 blocked by ISP**:
   - Contact your VPS provider
   - Consider using port 587 for submission

2. **DNS propagation**:
   - Wait 24-48 hours for full propagation
   - Test with: `nslookup yourdomain.com`

3. **SSL certificate issues**:
   ```bash
   sudo certbot certificates
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Application not starting**:
   ```bash
   sudo -u tempmail pm2 logs tempmail
   sudo -u tempmail pm2 restart tempmail
   ```

### Health Checks
```bash
# Check if SMTP port is open
telnet yourdomain.com 25

# Check HTTP service
curl -I http://yourdomain.com/api/health

# Check database
sudo -u tempmail node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => {
  console.log('Database OK');
  process.exit(0);
}).catch(err => {
  console.error('Database Error:', err);
  process.exit(1);
});
"
```

## 🎉 Completion

Your temporary email service should now be running at:
- **Website**: `https://yourdomain.com`
- **API**: `https://yourdomain.com/api`
- **Documentation**: `https://yourdomain.com/api-docs`

### Important Information

- **API Key**: Save the generated API key for admin access
- **Logs Location**: `/opt/tempmail/logs/`
- **Database Location**: `/opt/tempmail/emails.db`
- **Service User**: `tempmail`

### TODOs

1. Test email reception thoroughly
2. Set up monitoring and alerting
3. Consider setting up the frontend interface
4. Configure additional domains if needed

For ongoing maintenance, refer to the [README.md](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md) files.
