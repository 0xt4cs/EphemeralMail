# Temporary Email Service

A modern, feature-rich temporary email service built with TypeScript, Express, and Prisma. Perfect for developers who need a self-hosted disposable email solution.

## Features

- 🚀 **Modern Tech Stack**: TypeScript, Express, Prisma, SQLite
- 📧 **Full SMTP Server**: Receives and processes emails on any domain
- 🔒 **Security**: Rate limiting, CORS, Helmet, API key authentication
- 📊 **Admin Dashboard**: Statistics, cleanup, blacklisting
- 📚 **API Documentation**: OpenAPI/Swagger docs
- 🧹 **Auto Cleanup**: Configurable email retention
- 🔍 **Search & Filter**: Email search and filtering capabilities
- 📱 **API Ready**: RESTful API for any frontend
- 🐳 **Docker Ready**: Easy deployment with Docker
- 🌐 **Multi-domain**: Support for custom domains

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and setup**:  
   ```bash
   git clone https://github.com/tacssuki/EphemeralMail.git
   cd EphemeralMail
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Development**:
   ```bash
   npm run dev
   ```

5. **Production**:
   ```bash
   npm run build
   npm start
   ```

## Configuration

Key environment variables:

```env
# Server
PORT=4444
SMTP_PORT=25
DOMAIN=yourdomain.com
```

> **ℹ️ Why Port 4444?** We use port 4444 instead of the common port 3000 to avoid conflicts with frontend development servers (React, Next.js, Vite, etc.) that typically run on port 3000.

```env
# Security
API_KEY_SECRET=your-secret-key
RATE_LIMIT_MAX_REQUESTS=100

# Email
MAX_EMAIL_SIZE=10485760
EMAIL_RETENTION_HOURS=24
MAX_EMAILS_PER_ADDRESS=50
```

## API Endpoints

### Public Endpoints

- `POST /api/emails/generate` - Generate new email address
- `GET /api/emails/{address}` - Get emails for address
- `GET /api/emails/message/{id}` - Get specific email
- `DELETE /api/emails/message/{id}` - Delete email
- `GET /api/health` - Health check

### Admin Endpoints (require API key)

- `GET /api/admin/stats` - Server statistics
- `POST /api/admin/cleanup` - Clean expired emails
- `POST /api/admin/blacklist` - Blacklist domain
- `GET /api/admin/blacklist` - Get blacklisted domains

## API Examples

### Generate Email Address

**Request:**
```bash
curl -X POST https://yourdomain.com/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "klcppd3gdg@yourdomain.com",
    "domain": "yourdomain.com",
    "localPart": "klcppd3gdg",
    "createdAt": "2025-06-16T08:02:23.136Z"
  },
  "message": "Email address generated successfully",
  "timestamp": "2025-06-16T08:02:23.136Z"
}
```

### Retrieve Emails

**Request:**
```bash
curl https://yourdomain.com/api/emails/klcppd3gdg@yourdomain.com
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "cmbyt3m910008gar5fzux2khg",
        "messageId": "<202506160802.55G82NQO1724277@vultr.guest>",
        "to": "klcppd3gdg@yourdomain.com",
        "from": "sender@example.com",
        "subject": "Test Email",
        "textBody": "This is a test email content.\n",
        "htmlBody": "",
        "attachments": [],
        "size": 361,
        "isRead": false,
        "createdAt": "2025-06-16T08:02:23.462Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "hasMore": false
  },
  "message": "Emails retrieved successfully",
  "timestamp": "2025-06-16T08:02:28.046Z"
}
```

### Testing Email Reception

**Send Test Email:**
```bash
echo "Subject: Test Email

This is a test email content." | sendmail test@yourdomain.com
```

**Verify Reception:**
```bash
curl https://yourdomain.com/api/emails/test@yourdomain.com | jq '.data.emails[0].subject'
# Output: "Test Email"
```

## Deployment

### One-Command VPS Deployment (Ubuntu 22.04)

The easiest way to deploy EphemeralMail is using our automated deployment script:

```bash
# Clone the repository
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail

# Run the deployment script
chmod +x deploy.sh
./deploy.sh yourdomain.com
```

The script automatically handles:
- ✅ Node.js 18 and PM2 installation
- ✅ Application build and database setup
- ✅ Environment configuration with secure API key generation
- ✅ PM2 process management with auto-startup
- ✅ Firewall configuration
- ✅ Optional Nginx reverse proxy setup
- ✅ Optional SSL certificate installation

> 📚 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**  
> 🌐 **For multi-VPS setups, see [MULTI_VPS_GUIDE.md](./MULTI_VPS_GUIDE.md)**

### Manual VPS Deployment

1. **Server Setup**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Deploy Application**:
   ```bash
   # Clone the repository
   git clone https://github.com/tacssuki/EphemeralMail.git
   cd EphemeralMail
   
   # Install dependencies and build
   npm install
   npm run build
   
   # Setup database
   npx prisma generate
   npx prisma db push
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Configure Process Manager**:
   ```bash
   # Start with PM2
   pm2 start dist/index.js --name ephemeral-mail
   pm2 startup
   pm2 save
   ```

4. **Setup Nginx (optional)**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
         location / {
           proxy_pass http://localhost:4444;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. **DNS Configuration**:
   ```
   # Add MX record in your DNS provider
   MX 10 yourdomain.com
   
   # Add A record pointing to your VPS IP
   A yourdomain.com your-vps-ip
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY prisma/ ./prisma/
RUN npx prisma generate
EXPOSE 4444 25
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t ephemeral-mail .
docker run -p 4444:4444 -p 25:25 -v ./data:/app/data ephemeral-mail
```

## Maintenance

### Updating Your Installation

For existing installations, use the update script:

```bash
# Navigate to your installation directory
cd /opt/ephemeral-mail

# Run the update script
./update.sh
```

The update script will:
- Pull the latest code from GitHub
- Install new dependencies
- Rebuild the application
- Update the database schema
- Restart the service with zero downtime

### Manual Updates

If you prefer manual updates:

```bash
cd /opt/ephemeral-mail
sudo -u ephemeral-mail git pull
sudo -u ephemeral-mail npm install
sudo -u ephemeral-mail npm run build
sudo -u ephemeral-mail npx prisma generate
sudo -u ephemeral-mail pm2 restart ephemeral-mail
```

## Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Security Considerations

- Change default API key in production
- Use environment variables for secrets
- Enable HTTPS with SSL certificates
- Configure firewall rules (allow ports 25, 80, 443)
- Regular security updates
- Monitor for abuse and implement rate limiting

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.
