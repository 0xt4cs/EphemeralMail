# EphemeralMail - Backend API

<div align="center">
  <img src="https://raw.githubusercontent.com/tacssuki/EphemeralMail/main/eemail.png" alt="EphemeralMail Logo" width="128" height="128">
  <h3>🚀 Lightweight Temporary Email Service</h3>
  <p>A modern, self-hosted backend API for disposable email addresses</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
</div>

## Overview

EphemeralMail Backend is a **lightweight, self-contained API service** for creating and managing temporary email addresses. Perfect for testing, privacy protection, and development environments.

### Key Features

- 🚀 **Lightweight & Fast** - Alpine-based Docker image (~50MB)
- 🔒 **Privacy-Focused** - Auto-delete emails after 24 hours
- 📧 **Built-in SMTP** - No external email server needed
- �️ **Secure by Default** - Rate limiting, validation, security headers
- 📱 **RESTful API** - Clean, documented endpoints
- � **Self-Managing** - Automatic cleanup and resource management
- � **Docker Ready** - One-command deployment
- 📊 **Admin Dashboard** - Monitor usage and manage emails

### Frontend Options

While this backend works with any frontend, we recommend our official web interface:

**🎨 [EphemeralMail-Svelte Frontend](https://github.com/tacssuki/EphemeralMail-svelte)**
- Modern, responsive design
- Real-time email updates  
- Mobile-friendly interface
- PWA capabilities

*Or build your own frontend using our API!*

## Quick Start

### Option 1: One-Command Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail

# Deploy with your domain
chmod +x deploy.sh
./deploy.sh yourdomain.com
```

### Option 2: Docker Compose

```bash
# Clone and start
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Build and run
docker-compose up -d
```

### Option 3: Manual Installation

```bash
# Prerequisites: Node.js 18+
npm install
npm run build
npm start
```

**Detailed Steps:**

1. **Install dependencies**:
   ```bash
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

Configure via environment variables or `.env` file:

```env
# Server
PORT=4444
SMTP_PORT=25
DOMAIN=yourdomain.com

# Security
API_KEY_SECRET=your-secure-api-key
ALLOWED_ORIGINS=https://yourdomain.com

# Email Settings
EMAIL_RETENTION_HOURS=24
MAX_EMAILS_PER_ADDRESS=50
MAX_EMAIL_SIZE=10485760

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/emails/generate` | Generate new email address |
| `GET` | `/api/emails/:address` | Get emails for address |
| `GET` | `/api/emails/:address/:id` | Get specific email content |
| `DELETE` | `/api/emails/:address` | Delete all emails for address |
| `GET` | `/api/health` | Health check |

### Admin Endpoints (Require API Key)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Get system statistics |
| `POST` | `/api/admin/cleanup` | Manual cleanup expired emails |
| `DELETE` | `/api/admin/addresses/:address` | Delete address and emails |
| `DELETE` | `/api/admin/cleanup/all` | Delete all data |

### API Documentation

Interactive API docs available at: `http://localhost:4444/api-docs`
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

## Architecture

```
├── src/
│   ├── config/          # Configuration management
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Security, validation, rate limiting
│   ├── routes/          # API route definitions  
│   ├── services/        # Business logic (Email, SMTP)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Database, logging, helpers
├── prisma/              # Database schema and migrations
├── docker-compose.yml   # Multi-container setup
├── Dockerfile          # Container configuration
└── deploy.sh           # Automated deployment script
```

## Deployment

### VPS Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed VPS deployment instructions including:
- Ubuntu 22.04 setup
- Domain configuration
- SSL certificate setup
- Nginx reverse proxy
- PM2 process management

### Multiple VPS Setup

See [MULTI_VPS_GUIDE.md](./MULTI_VPS_GUIDE.md) for deploying on subdomains or multiple servers.

## Resource Requirements

### Minimum (Small Scale)
- **RAM:** 512MB
- **Storage:** 1GB
- **CPU:** 1 vCPU
- **Network:** Basic bandwidth

### Recommended (Medium Scale)
- **RAM:** 1GB  
- **Storage:** 5GB
- **CPU:** 2 vCPU
- **Network:** Moderate bandwidth

## Security Features

- **Rate Limiting** - Prevents abuse and spam
- **CORS Protection** - Configurable allowed origins
- **Helmet.js** - Security headers and CSP
- **Input Validation** - Joi schema validation
- **API Key Auth** - Secure admin endpoints
- **Auto Cleanup** - Prevents data accumulation
- **Non-root Container** - Secure Docker execution

## Monitoring

### Health Checks
- HTTP: `GET /api/health`
- Docker: Built-in healthcheck
- PM2: Process monitoring

### Logging
- Structured JSON logs with Winston
- Automatic log rotation (5MB, 5 files)
- Separate error logs
- Development console output

## Development

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (if applicable)
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues:** [GitHub Issues](https://github.com/tacssuki/EphemeralMail/issues)
- **Discussions:** [GitHub Discussions](https://github.com/tacssuki/EphemeralMail/discussions)
- **Frontend:** [EphemeralMail-Svelte](https://github.com/tacssuki/EphemeralMail-svelte)

## Acknowledgments

- Built with TypeScript, Express, and Prisma
- Inspired by privacy-focused email solutions
- Designed for simplicity and self-hosting

---

<div align="center">
  <p>Made with ❤️ for privacy and simplicity</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
