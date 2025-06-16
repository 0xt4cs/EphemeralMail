import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '@/config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {      
      title: 'EphemeralMail API',
      version: '1.0.0',
      description: 'A modern-lightweight temporary email service API',
      contact: {
        name: 'API Support',
        email: `admin@${config.email.domain}`,
      },
    },
    servers: [
      {
        url: config.isDevelopment 
          ? `http://localhost:${config.port}/api`
          : `https://${config.email.domain}/api`,
        description: config.isDevelopment ? 'Development server' : 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for admin endpoints',
        },
      },
      schemas: {
        EmailMessage: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            messageId: { type: 'string' },
            to: { type: 'string' },
            from: { type: 'string' },
            subject: { type: 'string' },
            textBody: { type: 'string' },
            htmlBody: { type: 'string' },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  contentType: { type: 'string' },
                  size: { type: 'number' },
                },
              },
            },
            size: { type: 'number' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        EmailAddress: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            domain: { type: 'string' },
            localPart: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            lastUsed: { type: 'string', format: 'date-time' },
            emailCount: { type: 'number' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Emails',
        description: 'Email management endpoints',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (requires API key)',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
