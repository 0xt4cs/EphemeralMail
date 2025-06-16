# 🚀 VPS Deployment Guide for Ubuntu 22.04

This guide will help you deploy the Temporary Email Service on your Ubuntu 22.04 VPS and configure it with your GoDaddy domain.

> **💡 Multiple VPS Setup?** If your domain already points to another VPS, see [MULTI_VPS_GUIDE.md](./MULTI_VPS_GUIDE.md) for subdomain and multi-server deployment options.

## 📋 Prerequisites

- Ubuntu 22.04 VPS with root access
- Domain purchased from GoDaddy
- Basic knowledge of Linux commands

## 🔧 Step 1: Server Preparation

Connect to your VPS via SSH:

```bash
ssh root@your-vps-ip
```

Update the system:

```bash
apt update && apt upgrade -y
```

## 🚀 Step 2: Automated Deployment

Upload your project to the VPS and run the deployment script:

```bash
# Clone or upload your project
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail  # or whatever you name the repo

# Make deployment script executable
chmod +x deploy.sh

# Run deployment (replace with your domain)
./deploy.sh yourdomain.com
```

The script will automatically:
- Install Node.js 18
- Install PM2 process manager
- Build and start the application
- Configure firewall
- Optionally setup Nginx and SSL

## 🌐 Step 3: DNS Configuration in GoDaddy

1. **Login to GoDaddy**:
   - Go to [GoDaddy DNS Management](https://dcc.godaddy.com/manage/dns)
   - Select your domain

2. **Add MX Record**:
   ```
   Type: MX
   Host: @
   Points to: yourdomain.com
   Priority: 10
   TTL: 1 Hour
   ```

3. **Add A Record**:
   ```
   Type: A
   Host: @
   Points to: YOUR_VPS_IP_ADDRESS
   TTL: 1 Hour
   ```

4. **Optional - Add WWW redirect**:
   ```
   Type: CNAME
   Host: www
   Points to: yourdomain.com
   TTL: 1 Hour
   ```

## 🔒 Step 4: SSL Certificate (Optional but Recommended)

If you chose to install SSL during deployment:

```bash
# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## ⚙️ Step 5: Configuration

Edit the environment file:

```bash
sudo nano /opt/tempmail/.env
```

Update these values:
```env
DOMAIN=yourdomain.com
NODE_ENV=production
API_KEY_SECRET=your-generated-api-key
```

Restart the service:
```bash
sudo -u tempmail pm2 restart tempmail
```

## 🔍 Step 6: Testing

1. **Test API**:
   ```bash
   curl http://yourdomain.com/api/health
   ```

2. **Test Email Reception**:
   ```bash
   # Generate test email
   curl -X POST http://yourdomain.com/api/emails/generate
   
   # Send test email to the generated address
   echo "Test email body" | mail -s "Test Subject" generated-email@yourdomain.com
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

### Next Steps

1. Test email reception thoroughly
2. Set up monitoring and alerting
3. Consider setting up the frontend interface
4. Configure additional domains if needed

For ongoing maintenance, refer to the [README.md](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md) files.
