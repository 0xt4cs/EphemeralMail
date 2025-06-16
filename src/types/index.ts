export interface EmailMessage {
  id: string;
  messageId?: string;
  to: string;
  from: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  size: number;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAttachment {
  filename?: string;
  contentType?: string;
  size: number;
  checksum?: string;
  cid?: string;
}

export interface EmailAddress {
  id: string;
  address: string;
  domain: string;
  localPart: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
  emailCount: number;
}

export interface CreateEmailRequest {
  messageId?: string;
  to: string;
  from: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  size?: number;
}

export interface EmailListResponse {
  emails: EmailMessage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GenerateEmailResponse {
  address: string;
  domain: string;
  localPart: string;
  expires?: Date;
}

export interface SMTPSession {
  id: string;
  remoteAddress: string;
  clientHostname: string;
  envelope: {
    mailFrom: { address: string };
    rcptTo: { address: string }[];
  };
  user?: any;
  secure: boolean;
}

export interface ServerConfig {
  port: number;
  smtpPort: number;
  domain: string;
  maxEmailSize: number;
  emailRetentionHours: number;
  maxEmailsPerAddress: number;
  allowedOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
