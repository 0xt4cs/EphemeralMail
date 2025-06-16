# Use Node.js 18 Alpine
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY dist ./dist/

# Create non-root user
RUN addgroup -g 1001 -S tempmail && \
    adduser -S tempmail -u 1001

# Create data directory
RUN mkdir -p /app/data && \
    chown -R tempmail:tempmail /app

# Switch to non-root user
USER tempmail

# Expose ports
EXPOSE 4444 25

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4444/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["npm", "start"]
