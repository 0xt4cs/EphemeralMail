<div align="center">
  <img src="https://raw.githubusercontent.com/tacssuki/EphemeralMail/main/eemail.png" alt="EphemeralMail Logo" width="128" height="128">
  <h1>EphemeralMail API</h1>
  <p><strong>Standalone Temporary Email Backend Service</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
</div>

## 🎯 **Standalone API**

**EphemeralMail is a complete, standalone API service** for temporary email management. Use it with:
- **Any frontend framework** (React, Vue, Angular, Svelte, plain HTML/JS)
- **Mobile apps** (React Native, Flutter, native iOS/Android)
- **CLI tools** or **automation scripts**
- **Existing applications** needing temporary email functionality

### ✨ Key Features

- 🚀 **Lightweight & Fast** - Alpine-based Docker image (~50MB)
- 🔒 **Privacy-Focused** - Auto-delete emails after 24 hours  
- 📧 **Built-in SMTP** - No external email server needed
- 🛡️ **Secure by Default** - Rate limiting, validation, security headers
- 📱 **RESTful API** - Clean, documented endpoints
- 🤖 **Self-Managing** - Automatic cleanup and resource management
- 🐳 **Docker Ready** - One-command deployment
- 📊 **Admin Dashboard** - Monitor usage and manage emails
- 🌐 **CORS Configurable** - Works with any origin you specify

### 🎨 Optional Frontend

Want a ready-to-use web interface? Check out my frontend:

**[EphemeralMail-Svelte Frontend](https://github.com/tacssuki/EphemeralMail-svelte)**
- Modern, responsive design
- Real-time email updates
- Mobile-friendly interface
- PWA capabilities

*The backend works perfectly fine without any frontend - use your own!*

---

## 🚀 Quick Start

### Option 1: One-Command VPS Deployment (Recommended)

Deploy to a VPS with domain, SSL, and Nginx in one command:

```bash
# Clone the repository
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail

# Deploy with your domain (requires root access)
chmod +x deploy.sh
sudo ./deploy.sh yourdomain.com
```

**What this does:**
- ✅ Installs Node.js, PM2, Nginx, Certbot
- ✅ Sets up the API service on port 4444
- ✅ Configures Nginx reverse proxy with `/api/*` routing
- ✅ Obtains SSL certificate with Let's Encrypt
- ✅ Sets up MX record instructions for email reception
- ✅ Configures automatic startup and monitoring

**After deployment, your API will be available at:**
- `https://yourdomain.com/api/` - API endpoints
- `https://yourdomain.com/api-docs` - Interactive API documentation

### Option 2: Docker Compose

```bash
# Clone and configure
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail
cp .env.example .env

# Edit .env with your settings (see Configuration section)
nano .env

# Build and run
docker-compose up -d
```

### Option 3: Manual Installation

```bash
# Prerequisites: Node.js 18+, npm
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma generate
npx prisma db push

# Development
npm run dev

# Production
npm run build
npm start
```

---

## ⚙️ Configuration

Configure via environment variables or `.env` file:

```env
# ===== SERVER CONFIGURATION =====
PORT=4444                    # API server port
SMTP_PORT=25                 # SMTP server port for receiving emails
DOMAIN=yourdomain.com        # Your domain name

# ===== SECURITY =====
API_KEY_SECRET=your-secure-api-key-change-this
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000,http://localhost:4173

# ===== EMAIL SETTINGS =====
EMAIL_RETENTION_HOURS=24     # Auto-delete emails after this many hours
MAX_EMAILS_PER_ADDRESS=50    # Maximum emails per temporary address
MAX_EMAIL_SIZE=10485760      # Maximum email size in bytes (10MB)

# ===== RATE LIMITING =====
RATE_LIMIT_MAX_REQUESTS=100  # Requests per window
RATE_LIMIT_WINDOW_MS=900000  # Window duration in milliseconds (15 min)

# ===== API ROUTING (for reverse proxy) =====
API_BASE_PATH=/api           # Base path for API routes (with reverse proxy)
```

### 🔧 CORS Configuration for Custom Frontends

To use the API with your own frontend, add your domain to `ALLOWED_ORIGINS`:

```env
# For multiple origins, separate with commas
ALLOWED_ORIGINS=https://yourapp.com,https://staging.yourapp.com,http://localhost:3000
```

### 🌐 API Base Path Configuration

When using a reverse proxy (like Nginx), configure the API base path:

```env
# If your Nginx serves API at /api/*
API_BASE_PATH=/api

# If your API is at the root
API_BASE_PATH=
```

---

## 📡 API Reference

### Base URL
- **Development**: `http://localhost:4444`
- **Production**: `https://yourdomain.com/api` (with reverse proxy)

### Authentication
- **Public endpoints**: No authentication required
- **Admin endpoints**: Require `X-API-Key` header with your `API_KEY_SECRET`

### Public Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/emails/generate` | Generate new email address | `{}` |
| `GET` | `/api/emails/:address` | Get emails for address | - |
| `GET` | `/api/emails/:address/:id` | Get specific email content | - |
| `DELETE` | `/api/emails/:address` | Delete all emails for address | - |
| `GET` | `/api/health` | Health check | - |

### Admin Endpoints

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| `GET` | `/api/admin/stats` | Get system statistics | `X-API-Key: your-secret` |
| `POST` | `/api/admin/cleanup` | Manual cleanup expired emails | `X-API-Key: your-secret` |
| `DELETE` | `/api/admin/addresses/:address` | Delete address and emails | `X-API-Key: your-secret` |
| `DELETE` | `/api/admin/cleanup/all` | Delete all data | `X-API-Key: your-secret` |

### Example API Calls

**Generate a temporary email:**
```bash
curl -X POST https://yourdomain.com/api/emails/generate

# Response:
{
  "success": true,
  "data": {
    "address": "temp_abc123@yourdomain.com"
  },
  "message": "Email address generated successfully"
}
```

**Get emails for an address:**
```bash
curl https://yourdomain.com/api/emails/temp_abc123@yourdomain.com

# Response:
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "email_123",
        "subject": "Welcome!",
        "from": "sender@example.com",
        "to": "temp_abc123@yourdomain.com",
        "date": "2025-01-16T08:02:28.046Z",
        "preview": "Welcome to our service...",
        "isRead": false
      }
    ],
    "hasMore": false
  }
}
```

**Get specific email content:**
```bash
curl https://yourdomain.com/api/emails/temp_abc123@yourdomain.com/email_123

# Response:
{
  "success": true,
  "data": {
    "email": {
      "id": "email_123",
      "subject": "Welcome!",
      "from": "sender@example.com",
      "to": "temp_abc123@yourdomain.com",
      "date": "2025-01-16T08:02:28.046Z",
      "body": "<!DOCTYPE html><html>...",
      "bodyText": "Welcome to our service...",
      "attachments": []
    }
  }
}
```

**Admin: Get system statistics:**
```bash
curl -H "X-API-Key: your-secret" https://yourdomain.com/api/admin/stats

# Response:
{
  "success": true,
  "data": {
    "totalAddresses": 42,
    "totalEmails": 127,
    "diskUsage": "2.3MB",
    "uptime": "5 days"
  }
}
```

### Interactive Documentation
Visit `https://yourdomain.com/api-docs` for full Swagger/OpenAPI documentation.

---

## 🧪 Testing the API

### 1. Test API Health
```bash
curl https://yourdomain.com/api/health
# Should return: {"status": "healthy", "timestamp": "..."}
```

### 2. Generate and Test Email Reception

**Generate a temporary email:**
```bash
EMAIL=$(curl -s -X POST https://yourdomain.com/api/emails/generate | jq -r '.data.address')
echo "Generated email: $EMAIL"
```

**Send a test email:**
```bash
echo "Subject: Test Email
From: test@example.com
To: $EMAIL

This is a test email." | sendmail $EMAIL
```

**Check for received emails:**
```bash
curl "https://yourdomain.com/api/emails/$EMAIL" | jq '.data.emails[0].subject'
# Should return: "Test Email"
```

### 3. Integration Testing with Your Frontend

**JavaScript/Fetch example:**
```javascript
// Generate email address
const response = await fetch('https://yourdomain.com/api/emails/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});
const { data } = await response.json();
const emailAddress = data.address;

// Check for emails
const emailsResponse = await fetch(`https://yourdomain.com/api/emails/${emailAddress}`);
const { data: emailsData } = await emailsResponse.json();
console.log(emailsData.emails);
```

**cURL testing script:**
```bash
#!/bin/bash
API_BASE="https://yourdomain.com/api"

echo "🧪 Testing EphemeralMail API..."

# Health check
echo "1. Health check..."
curl -s "$API_BASE/health" | jq '.'

# Generate email
echo "2. Generating email..."
EMAIL=$(curl -s -X POST "$API_BASE/emails/generate" | jq -r '.data.address')
echo "Generated: $EMAIL"

# Check emails (should be empty initially)
echo "3. Checking emails..."
curl -s "$API_BASE/emails/$EMAIL" | jq '.data.emails | length'

echo "✅ API tests completed!"
```

---

## 🌐 Integrating with Your Frontend

### React Example

```jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://yourdomain.com/api';

function TempEmailApp() {
  const [emailAddress, setEmailAddress] = useState('');
  const [emails, setEmails] = useState([]);

  const generateEmail = async () => {
    const response = await fetch(`${API_BASE}/emails/generate`, {
      method: 'POST'
    });
    const { data } = await response.json();
    setEmailAddress(data.address);
  };

  const fetchEmails = async () => {
    if (!emailAddress) return;
    const response = await fetch(`${API_BASE}/emails/${emailAddress}`);
    const { data } = await response.json();
    setEmails(data.emails);
  };

  useEffect(() => {
    if (emailAddress) {
      const interval = setInterval(fetchEmails, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [emailAddress]);

  return (
    <div>
      <button onClick={generateEmail}>Generate Temporary Email</button>
      {emailAddress && (
        <div>
          <p>Your temporary email: {emailAddress}</p>
          <div>
            {emails.map(email => (
              <div key={email.id}>
                <h3>{email.subject}</h3>
                <p>From: {email.from}</p>
                <p>{email.preview}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Vue.js Example

```vue
<template>
  <div>
    <button @click="generateEmail">Generate Temporary Email</button>
    <div v-if="emailAddress">
      <p>Your temporary email: {{ emailAddress }}</p>
      <div v-for="email in emails" :key="email.id">
        <h3>{{ email.subject }}</h3>
        <p>From: {{ email.from }}</p>
        <p>{{ email.preview }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      emailAddress: '',
      emails: [],
      API_BASE: 'https://yourdomain.com/api'
    };
  },
  methods: {
    async generateEmail() {
      const response = await fetch(`${this.API_BASE}/emails/generate`, {
        method: 'POST'
      });
      const { data } = await response.json();
      this.emailAddress = data.address;
      this.startEmailPolling();
    },
    async fetchEmails() {
      if (!this.emailAddress) return;
      const response = await fetch(`${this.API_BASE}/emails/${this.emailAddress}`);
      const { data } = await response.json();
      this.emails = data.emails;
    },
    startEmailPolling() {
      setInterval(this.fetchEmails, 5000);
    }
  }
};
</script>
```

---

## 🐳 Docker Deployment

### Docker Compose (Recommended)

```yaml
version: '3.8'
services:
  ephemeral-mail:
    build: .
    ports:
      - "4444:4444"
      - "25:25"
    environment:
      - PORT=4444
      - SMTP_PORT=25
      - DOMAIN=yourdomain.com
      - API_KEY_SECRET=your-secure-secret
      - ALLOWED_ORIGINS=https://yourdomain.com
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4444/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Standalone Docker

```bash
# Build
docker build -t ephemeral-mail .

# Run
docker run -d \
  --name ephemeral-mail \
  -p 4444:4444 \
  -p 25:25 \
  -e DOMAIN=yourdomain.com \
  -e API_KEY_SECRET=your-secure-secret \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  ephemeral-mail
```

---

## 🔧 Nginx Configuration

### Simple Reverse Proxy

For serving the API at `/api/*`:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # API routes
    location /api/ {
        proxy_pass http://localhost:4444/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Serve your own frontend
    location / {
        root /var/www/your-frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

### Direct API Access

For serving the API directly (no `/api` prefix):

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4444;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📧 Email Reception Setup

### DNS Configuration

**Required DNS records for email reception:**

```
# A Record (for web access)
yourdomain.com.    300    IN    A    YOUR_VPS_IP

# MX Record (for email reception)
yourdomain.com.    300    IN    MX   10 yourdomain.com.
```

### Testing Email Reception

**Test with telnet:**
```bash
telnet yourdomain.com 25
HELO test.com
MAIL FROM: <test@example.com>
RCPT TO: <temp123@yourdomain.com>
DATA
Subject: Test Email

This is a test.
.
QUIT
```

**Test with sendmail:**
```bash
echo "Subject: Test Email

Test content" | sendmail temp123@yourdomain.com
```

---

## 📊 Monitoring & Management

### Health Checks

```bash
# Basic health check
curl https://yourdomain.com/api/health

# Detailed health with admin key
curl -H "X-API-Key: your-secret" https://yourdomain.com/api/admin/stats
```

### PM2 Management (if using deployment script)

```bash
# Check status
pm2 status ephemeral-mail

# View logs
pm2 logs ephemeral-mail

# Restart
pm2 restart ephemeral-mail

# Monitor in real-time
pm2 monit
```

### Log Files

```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Nginx logs (if using deployment script)
tail -f /var/log/nginx/access.log
```

---

## 🛠️ Development

### Local Development Setup

```bash
# Clone and install
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail
npm install

# Set up environment
cp .env.example .env
# Edit .env for local development

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm start          # Start production server
npm test           # Run tests
npm run lint       # Lint TypeScript code
npm run clean      # Clean build artifacts
```

### Project Structure

```
src/
├── config/          # Configuration management
│   ├── index.ts     # Environment variables
│   └── swagger.ts   # API documentation config
├── controllers/     # Route handlers
│   ├── AdminController.ts
│   └── EmailController.ts
├── middleware/      # Express middleware
│   ├── validate.ts
│   └── validation-middleware.ts
├── routes/          # API route definitions
│   ├── admin.ts
│   ├── emails.ts
│   └── index.ts
├── services/        # Business logic
│   ├── EmailService.ts
│   └── SMTPService.ts
├── types/           # TypeScript definitions
│   └── index.ts
├── utils/           # Utility functions
│   ├── database.ts
│   ├── logger.ts
│   └── response.ts
├── app.ts           # Express app setup
└── index.ts         # Application entry point
```

---

## 🔒 Security

### Built-in Security Features

- **Rate Limiting** - Prevents abuse and spam
- **CORS Protection** - Configurable allowed origins
- **Helmet.js** - Security headers and CSP
- **Input Validation** - Joi schema validation
- **API Key Auth** - Secure admin endpoints
- **Auto Cleanup** - Prevents data accumulation
- **Non-root Container** - Secure Docker execution

### Security Best Practices

1. **Change default API key:**
   ```bash
   # Generate a secure API key
   openssl rand -hex 32
   ```

2. **Configure CORS properly:**
   ```env
   # Only allow your actual domains
   ALLOWED_ORIGINS=https://yourapp.com,https://yourmobileapp.com
   ```

3. **Use HTTPS in production:**
   - The deployment script sets up SSL automatically
   - Never use HTTP for production APIs

4. **Monitor logs regularly:**
   ```bash
   # Check for suspicious activity
   grep "429\|401\|403" logs/app.log
   ```

---

## 🚀 Production Deployment

### Resource Requirements

**Minimum (Small Scale - <100 emails/day):**
- RAM: 512MB
- Storage: 1GB
- CPU: 1 vCPU
- Network: Basic bandwidth

**Recommended (Medium Scale - <1000 emails/day):**
- RAM: 1GB
- Storage: 5GB
- CPU: 2 vCPU
- Network: Moderate bandwidth

### Scaling Considerations

- **Horizontal scaling**: Run multiple instances behind a load balancer
- **Database**: Consider PostgreSQL for higher loads
- **Storage**: Monitor disk usage for email attachments
- **Memory**: Monitor memory usage with many concurrent connections

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
```bash
# Check ALLOWED_ORIGINS in .env
echo $ALLOWED_ORIGINS

# Update to include your frontend domain
sed -i 's/ALLOWED_ORIGINS=.*/ALLOWED_ORIGINS=https:\/\/yourapp.com/' .env
```

**2. Email Not Received**
```bash
# Check MX record
dig MX yourdomain.com

# Check SMTP port
telnet yourdomain.com 25

# Check logs
tail -f logs/app.log | grep SMTP
```

**3. API Not Accessible**
```bash
# Check if service is running
curl http://localhost:4444/api/health

# Check Nginx config (if using reverse proxy)
nginx -t

# Check ports
netstat -tlnp | grep :4444
```

**4. High Memory Usage**
```bash
# Check number of emails
curl -H "X-API-Key: your-secret" https://yourdomain.com/api/admin/stats

# Manual cleanup
curl -X POST -H "X-API-Key: your-secret" https://yourdomain.com/api/admin/cleanup
```

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/tacssuki/EphemeralMail/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tacssuki/EphemeralMail/discussions)
- **API Docs**: `https://yourdomain.com/api-docs`

---

## 📚 Additional Resources

- **[Deployment Guide](./DEPLOYMENT.md)** - Detailed VPS deployment instructions
- **[Multi-VPS Guide](./MULTI_VPS_GUIDE.md)** - Deploy on multiple servers
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Optional Frontend](https://github.com/tacssuki/EphemeralMail-svelte)** - Ready-to-use web interface

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>⭐ Star this repo if you find it useful!</p>
  <p>🔗 <a href="https://github.com/tacssuki/EphemeralMail-svelte">Optional Frontend</a> | <a href="https://github.com/tacssuki/EphemeralMail/issues">Report Issues</a> | <a href="https://github.com/tacssuki/EphemeralMail/discussions">Discussions</a></p>
</div>
