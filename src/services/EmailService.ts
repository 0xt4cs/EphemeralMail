import { prisma } from '@/utils/database';
import { EmailMessage, CreateEmailRequest, EmailAddress } from '@/types';
import { 
  generateRandomEmail, 
  parseEmailAddress, 
  isOurDomain,
  generateMessageId,
  isEmailExpired 
} from '@/utils/email';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export class EmailService {
  /**
   * Create a new email in the database
   */
  async createEmail(emailData: CreateEmailRequest): Promise<EmailMessage> {
    try {
      // Generate message ID if not provided
      const messageId = emailData.messageId || generateMessageId();

      const email = await prisma.email.create({
        data: {
          messageId,
          to: emailData.to,
          from: emailData.from,
          subject: emailData.subject || '',
          textBody: emailData.textBody || '',
          htmlBody: emailData.htmlBody || '',          attachments: emailData.attachments ? JSON.stringify(emailData.attachments) : null,
          headers: emailData.headers ? JSON.stringify(emailData.headers) : null,
          size: emailData.size || 0,
        },
      });

      // Update email address statistics
      await this.updateEmailAddressStats(emailData.to);

      logger.info(`Email created for ${emailData.to} from ${emailData.from}`);
      return this.transformEmailToMessage(email);
    } catch (error) {
      logger.error('Failed to create email:', error);
      throw new Error('Failed to create email');
    }
  }

  /**
   * Get emails for a specific address with pagination
   */
  async getEmailsForAddress(
    address: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
    search?: string
  ) {
    try {
      const offset = (page - 1) * limit;
      
      const where: any = { to: address };
      
      if (unreadOnly) {
        where.isRead = false;
      }
      
      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { from: { contains: search, mode: 'insensitive' } },
          { textBody: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [emails, total] = await Promise.all([
        prisma.email.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.email.count({ where }),
      ]);

      return {
        emails: emails.map((email: any) => this.transformEmailToMessage(email)),
        total,
        page,
        limit,
        hasMore: offset + emails.length < total,
      };
    } catch (error) {
      logger.error('Failed to get emails:', error);
      throw new Error('Failed to retrieve emails');
    }
  }

  /**
   * Get a specific email by ID
   */
  async getEmailById(id: string): Promise<EmailMessage | null> {
    try {
      const email = await prisma.email.findUnique({
        where: { id },
      });

      return email ? this.transformEmailToMessage(email) : null;
    } catch (error) {
      logger.error('Failed to get email by ID:', error);
      throw new Error('Failed to retrieve email');
    }
  }

  /**
   * Mark email as read
   */
  async markEmailAsRead(id: string): Promise<void> {
    try {
      await prisma.email.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error('Failed to mark email as read:', error);
      throw new Error('Failed to update email');
    }
  }

  /**
   * Delete email by ID
   */
  async deleteEmail(id: string): Promise<void> {
    try {
      await prisma.email.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Failed to delete email:', error);
      throw new Error('Failed to delete email');
    }
  }
  /**
   * Delete all emails for an address
   */
  async deleteAllEmailsForAddress(address: string): Promise<number> {
    try {
      // Use a transaction to ensure both operations succeed or fail together
      const result = await prisma.$transaction(async (tx) => {
        // First, delete all emails for this address
        const emailDeleteResult = await tx.email.deleteMany({
          where: { to: address },
        });

        // Then, delete the email address itself
        await tx.emailAddress.deleteMany({
          where: { address: address },
        });

        return emailDeleteResult.count;
      });

      logger.info(`Deleted ${result} emails and removed address: ${address}`);
      return result;
    } catch (error) {
      logger.error('Failed to delete emails and address:', error);
      throw new Error('Failed to delete emails and address');
    }
  }

  /**
   * Generate a new random email address
   */
  async generateEmailAddress(customPrefix?: string): Promise<EmailAddress> {
    try {
      let emailAddress: string;
      
      if (customPrefix) {
        emailAddress = `${customPrefix}@${config.email.domain}`;
      } else {
        emailAddress = generateRandomEmail();
      }

      // Check if address already exists
      const existing = await prisma.emailAddress.findUnique({
        where: { address: emailAddress },
      });

      if (existing) {
        if (customPrefix) {
          throw new Error('Email address already exists');
        }
        // Generate a new random one if no custom prefix
        return this.generateEmailAddress();
      }

      const { localPart, domain } = parseEmailAddress(emailAddress);

      const emailAddr = await prisma.emailAddress.create({
        data: {
          address: emailAddress,
          domain,
          localPart,
        },
      });

      return emailAddr as EmailAddress;
    } catch (error) {
      logger.error('Failed to generate email address:', error);
      throw new Error('Failed to generate email address');
    }
  }

  /**
   * Get email address info
   */
  async getEmailAddressInfo(address: string): Promise<EmailAddress | null> {
    try {
      const emailAddr = await prisma.emailAddress.findUnique({
        where: { address },
      });

      return emailAddr as EmailAddress | null;
    } catch (error) {
      logger.error('Failed to get email address info:', error);
      throw new Error('Failed to retrieve email address info');
    }
  }

  /**
   * Update email address statistics
   */
  private async updateEmailAddressStats(address: string): Promise<void> {
    try {
      const { localPart, domain } = parseEmailAddress(address);

      await prisma.emailAddress.upsert({
        where: { address },
        update: {
          lastUsed: new Date(),
          emailCount: { increment: 1 },
        },
        create: {
          address,
          domain,
          localPart,
          emailCount: 1,
        },
      });
    } catch (error) {
      logger.error('Failed to update email address stats:', error);
    }
  }

  /**
   * Clean up expired emails
   */
  async cleanupExpiredEmails(): Promise<number> {
    try {
      const expiryDate = new Date(Date.now() - (config.email.retentionHours * 60 * 60 * 1000));
      
      const result = await prisma.email.deleteMany({
        where: {
          createdAt: {
            lt: expiryDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired emails`);
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired emails:', error);
      throw new Error('Failed to cleanup expired emails');
    }
  }

  /**
   * Get unread email count for address
   */
  async getUnreadCount(address: string): Promise<number> {
    try {
      const count = await prisma.email.count({
        where: {
          to: address,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      throw new Error('Failed to get unread count');
    }
  }

  /**
   * Check if address has reached email limit
   */
  async checkEmailLimit(address: string): Promise<boolean> {
    try {
      const count = await prisma.email.count({
        where: { to: address },
      });

      return count >= config.email.maxEmailsPerAddress;
    } catch (error) {
      logger.error('Failed to check email limit:', error);
      return false;
    }
  }

  /**
   * Transform database email to EmailMessage format
   */
  private transformEmailToMessage(dbEmail: any): EmailMessage {
    return {
      ...dbEmail,
      attachments: dbEmail.attachments ? JSON.parse(dbEmail.attachments) : [],
      headers: dbEmail.headers ? JSON.parse(dbEmail.headers) : {},
    };
  }  /**
   * Get list of generated email addresses with pagination
   */
  async getGeneratedAddresses(page: number = 1, limit: number = 50) {
    try {
      const offset = (page - 1) * limit;

      const [addresses, total] = await Promise.all([
        prisma.emailAddress.findMany({
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.emailAddress.count(),
      ]);

      // Get email counts for each address
      const addressesWithCounts = await Promise.all(
        addresses.map(async (addr) => {
          const emailCount = await prisma.email.count({
            where: { to: addr.address }
          });
          
          return {
            address: addr.address,
            domain: addr.domain,
            localPart: addr.localPart,
            createdAt: addr.createdAt,
            emailCount
          };
        })
      );

      return {
        addresses: addressesWithCounts,
        total,
        page,
        limit,
        hasMore: offset + addresses.length < total,
      };
    } catch (error) {
      logger.error('Failed to get generated addresses:', error);
      throw new Error('Failed to retrieve generated addresses');
    }
  }
}
