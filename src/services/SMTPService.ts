import { SMTPServer, SMTPServerAddress, SMTPServerSession } from 'smtp-server';
import { simpleParser, ParsedMail } from 'mailparser';
import { EmailService } from './EmailService';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { isOurDomain, generateMessageId } from '@/utils/email';

export class SMTPService {
  private server!: SMTPServer;
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
    this.setupSMTPServer();
  }

  private setupSMTPServer(): void {
    this.server = new SMTPServer({
      banner: `${config.email.domain} Temporary Email Server`,
      logger: config.isDevelopment,
      authOptional: true,
      size: config.email.maxSize,
      
      // Validate recipient
      onRcptTo: async (address: SMTPServerAddress, session: SMTPServerSession, callback: (error?: Error) => void) => {
        const recipientEmail = address.address.toLowerCase();
        
        // Only accept emails for our domain
        if (!isOurDomain(recipientEmail)) {
          logger.warn(`Rejected email for non-local domain: ${recipientEmail}`);
          return callback(new Error('Recipient not allowed'));
        }

        // Check if recipient has reached email limit
        const hasReachedLimit = await this.emailService.checkEmailLimit(recipientEmail);
        if (hasReachedLimit) {
          logger.warn(`Email limit reached for: ${recipientEmail}`);
          return callback(new Error('Recipient mailbox full'));
        }

        callback();
      },

      // Validate sender
      onMailFrom: (address: SMTPServerAddress, session: SMTPServerSession, callback: (error?: Error) => void) => {
        const senderEmail = address.address.toLowerCase();
        
        // Basic validation - you can add more sophisticated checks here
        if (!senderEmail || senderEmail.length === 0) {
          return callback(new Error('Sender address required'));
        }

        callback();
      },

      // Process incoming email data
      onData: (stream: any, session: SMTPServerSession, callback: (error?: Error | null) => void) => {
        this.processEmailData(stream, session, callback);
      },

      // Connection handling
      onConnect: (session: SMTPServerSession, callback: (error?: Error) => void) => {
        logger.info(`SMTP connection from ${session.remoteAddress}`);
        callback();
      },

      onClose: (session: SMTPServerSession) => {
        logger.info(`SMTP connection closed from ${session.remoteAddress}`);
      },
    });    this.server.on('error', (error: Error) => {
      logger.error('SMTP Server error:', error);
    });
  }
  private async processEmailData(
    stream: any,
    session: SMTPServerSession,
    callback: (error?: Error | null) => void
  ): Promise<void> {
    try {
      const chunks: Buffer[] = [];
      
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', async () => {
        try {
          const emailBuffer = Buffer.concat(chunks);
          const parsedEmail = await simpleParser(emailBuffer);

          // Extract recipient addresses
          const recipients = session.envelope.rcptTo.map((rcpt: SMTPServerAddress) => rcpt.address.toLowerCase());
          const sender = session.envelope.mailFrom.address.toLowerCase();

          // Process each recipient
          for (const recipient of recipients) {
            await this.saveEmail(parsedEmail, recipient, sender, emailBuffer.length);
          }

          logger.info(`Email processed successfully for ${recipients.join(', ')}`);
          callback();
        } catch (error) {
          logger.error('Failed to process email:', error);
          callback(new Error('Failed to process email'));
        }
      });

      stream.on('error', (error: Error) => {
        logger.error('Stream error:', error);
        callback(error);
      });
    } catch (error) {
      logger.error('Error in processEmailData:', error);
      callback(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private async saveEmail(
    parsedEmail: ParsedMail,
    recipient: string,
    sender: string,
    size: number
  ): Promise<void> {
    try {
      // Extract attachments metadata
      const attachments = parsedEmail.attachments?.map((attachment: any) => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        cid: attachment.cid,
      })) || [];

      // Extract headers
      const headers: Record<string, string> = {};
      if (parsedEmail.headers) {
        for (const [key, value] of parsedEmail.headers) {
          headers[key] = Array.isArray(value) ? value.join(', ') : value;
        }
      }

      await this.emailService.createEmail({
        messageId: parsedEmail.messageId || generateMessageId(),
        to: recipient,
        from: sender,
        subject: parsedEmail.subject || '(No Subject)',
        textBody: parsedEmail.text || '',
        htmlBody: parsedEmail.html || '',
        attachments,
        headers,
        size,
      });
    } catch (error) {
      logger.error('Failed to save email:', error);
      throw error;
    }
  }

  /**
   * Start the SMTP server
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(config.smtpPort, '0.0.0.0', (error?: Error) => {
        if (error) {
          logger.error('Failed to start SMTP server:', error);
          reject(error);
        } else {
          logger.info(`SMTP server listening on port ${config.smtpPort}`);
          resolve();
        }
      });
    });
  }

  /**
   * Stop the SMTP server
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('SMTP server stopped');
        resolve();
      });
    });
  }
}
