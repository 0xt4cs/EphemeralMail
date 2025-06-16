# Multiple VPS Deployment Guide

This guide covers scenarios where you have multiple VPS instances and want to deploy EphemeralMail alongside existing applications.

## 🎯 Scenario: Domain Already in Use

If your domain `example.com` already points to another VPS running a different application, you have several deployment options:

### ✅ **Option 1: Subdomain (Recommended)**

Use a subdomain for the email service:

**Setup:**
- Main domain: `example.com` → VPS1 (existing webapp)  
- Email service: `mail.example.com` → VPS2 (EphemeralMail)

**DNS Configuration:**
```
Type: A
Name: mail
Value: [VPS2_IP_ADDRESS]
TTL: 600

Type: MX
Name: mail
Value: mail.example.com
Priority: 10
TTL: 600
```

**Deployment:**
```bash
# Clone on VPS2
git clone https://github.com/tacssuki/EphemeralMail.git
cd EphemeralMail

# Deploy with subdomain
chmod +x deploy.sh
./deploy.sh mail.example.com
```

### ✅ **Option 2: Path-based Routing**

Configure your existing nginx on VPS1 to proxy email requests to VPS2:

**On VPS1 (existing server), add to nginx config:**
```nginx
location /mail/ {
    proxy_pass http://VPS2_IP:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Access:** `https://example.com/mail/`

### ✅ **Option 3: Port-based Access**

Run temp mail on a different port:

**Deployment:**
```bash
# Edit .env on VPS2
PORT=8080
ALLOWED_ORIGINS=https://example.com:8080

# Deploy
bash deploy.sh example.com
```

**Access:** `https://example.com:8080`

## 🔧 **Configuration Examples**

### **Subdomain Deployment (.env)**
```env
# VPS2 - Temp Mail Service
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./emails.db"
ALLOWED_ORIGINS=https://mail.example.com
CORS_ORIGINS=https://mail.example.com
DOMAIN=mail.example.com
SMTP_PORT=25
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### **Multiple Service Architecture**

```
┌─────────────────┐    ┌─────────────────┐
│   example.com   │    │ mail.example.com │
│                 │    │                 │
│   VPS1 (Main)   │    │   VPS2 (Mail)   │
│   ├─ webapp     │    │   ├─ temp mail  │
│   ├─ nginx      │    │   ├─ nginx      │
│   └─ SSL cert   │    │   └─ SSL cert   │
└─────────────────┘    └─────────────────┘
```

### **Email Configuration**

For subdomains, you need separate MX records:

```
# Main domain mail (if you have one)
Type: MX
Name: @
Value: mail.example.com
Priority: 10

# Temp mail subdomain
Type: MX  
Name: mail
Value: mail.example.com
Priority: 10
```

## 🚀 **Deployment Steps for Subdomain**

1. **DNS Setup:**
   ```bash
   # Add A record: mail.example.com → VPS2_IP
   # Add MX record: mail.example.com → mail.example.com
   ```

2. **Deploy to VPS2:**
   ```bash   git clone https://github.com/tacssuki/EphemeralMail.git
   cd EphemeralMail
   bash deploy.sh mail.example.com
   ```

3. **Verify:**
   ```bash
   # Check if service is running
   curl https://mail.example.com/api/health
   
   # Test email reception
   curl -X POST https://mail.example.com/api/emails \
     -H "Content-Type: application/json" \
     -d '{"to": "test@mail.example.com", "subject": "Test"}'
   ```

## 🔒 **SSL Certificates**

Each domain/subdomain needs its own SSL certificate:

```bash
# On VPS2 for subdomain
sudo certbot --nginx -d mail.example.com
```

## 📋 **Checklist**

- [ ] DNS A record created for subdomain
- [ ] DNS MX record created for subdomain  
- [ ] VPS2 configured and accessible
- [ ] SSL certificate obtained for subdomain
- [ ] Application deployed and running
- [ ] Email reception tested
- [ ] Web interface accessible

This approach allows you to run multiple services on different VPS instances while maintaining clean separation and independent scaling.
