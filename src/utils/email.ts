import { nanoid } from 'nanoid';
import { config } from '@/config';

/**
 * Generate a random email address for the configured domain
 */
export function generateRandomEmail(): string {
  const localPart = nanoid(10).toLowerCase();
  return `${localPart}@${config.email.domain}`;
}

/**
 * Extract domain and local part from email address
 */
export function parseEmailAddress(email: string): { localPart: string; domain: string } {
  const [localPart, domain] = email.split('@');
  return { localPart: localPart || '', domain: domain || '' };
}

/**
 * Validate email address format (RFC 5322 compliant)
 */
export function isValidEmail(email: string): boolean {
  // Basic format check
  if (!email || typeof email !== 'string') return false;
  
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  
  // Local part validation
  if (!localPart || localPart.length < 1 || localPart.length > 64) return false;
  if (!/^[a-zA-Z0-9._+-]+$/.test(localPart)) return false;
  if (localPart.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) return false;
  
  // Domain validation (basic)
  if (!domain || domain.length < 1 || domain.length > 253) return false;
  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return false;
  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) return false;
  if (domain.startsWith('-') || domain.endsWith('-')) return false;
  
  return true;
}

/**
 * Check if email belongs to our domain
 */
export function isOurDomain(email: string): boolean {
  const { domain } = parseEmailAddress(email);
  return domain === config.email.domain;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `${nanoid(16)}@${config.email.domain}`;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sanitize email content for safe display
 */
export function sanitizeEmailContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Calculate email retention expiry date
 */
export function calculateExpiryDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + (config.email.retentionHours * 60 * 60 * 1000));
}

/**
 * Check if email has expired based on retention policy
 */
export function isEmailExpired(createdAt: Date): boolean {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + (config.email.retentionHours * 60 * 60 * 1000));
  return now > expiryTime;
}
