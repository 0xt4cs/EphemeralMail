import { Request, Response } from 'express';
import { EmailService } from '@/services/EmailService';
import { sendSuccess, sendError, asyncHandler } from '@/utils/response';
import { logger } from '@/utils/logger';

export class EmailController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Generate a new random email address
   */
  generateEmail = asyncHandler(async (req: Request, res: Response) => {
    const { customPrefix } = req.body;

    try {
      const emailAddress = await this.emailService.generateEmailAddress(customPrefix);
      
      sendSuccess(res, {
        address: emailAddress.address,
        domain: emailAddress.domain,
        localPart: emailAddress.localPart,
        createdAt: emailAddress.createdAt,
      }, 'Email address generated successfully', 201);
    } catch (error) {
      logger.error('Error generating email:', error);
      if (error instanceof Error && error.message === 'Email address already exists') {
        return sendError(res, 'Email address already exists', 409);
      }
      sendError(res, 'Failed to generate email address', 500);
    }
  });

  /**
   * Get emails for a specific address
   */
  getEmails = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const { page = 1, limit = 20, search, unreadOnly = false } = req.query;

    try {
      const result = await this.emailService.getEmailsForAddress(
        address,
        parseInt(page as string),
        parseInt(limit as string),
        unreadOnly === 'true',
        search as string
      );

      sendSuccess(res, result, 'Emails retrieved successfully');
    } catch (error) {
      logger.error('Error getting emails:', error);
      sendError(res, 'Failed to retrieve emails', 500);
    }
  });

  /**
   * Get a specific email by ID
   */
  getEmailById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const email = await this.emailService.getEmailById(id);
      
      if (!email) {
        return sendError(res, 'Email not found', 404);
      }

      // Mark email as read when viewed
      await this.emailService.markEmailAsRead(id);

      sendSuccess(res, email, 'Email retrieved successfully');
    } catch (error) {
      logger.error('Error getting email by ID:', error);
      sendError(res, 'Failed to retrieve email', 500);
    }
  });

  /**
   * Delete a specific email
   */
  deleteEmail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await this.emailService.deleteEmail(id);
      sendSuccess(res, null, 'Email deleted successfully');
    } catch (error) {
      logger.error('Error deleting email:', error);
      sendError(res, 'Failed to delete email', 500);
    }
  });

  /**
   * Delete all emails for an address
   */
  deleteAllEmails = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
      const deletedCount = await this.emailService.deleteAllEmailsForAddress(address);
      sendSuccess(res, { deletedCount }, `${deletedCount} emails deleted successfully`);
    } catch (error) {
      logger.error('Error deleting all emails:', error);
      sendError(res, 'Failed to delete emails', 500);
    }
  });

  /**
   * Get unread email count for an address
   */
  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
      const count = await this.emailService.getUnreadCount(address);
      sendSuccess(res, { unreadCount: count }, 'Unread count retrieved successfully');
    } catch (error) {
      logger.error('Error getting unread count:', error);
      sendError(res, 'Failed to get unread count', 500);
    }
  });

  /**
   * Get email address information
   */
  getAddressInfo = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
      const addressInfo = await this.emailService.getEmailAddressInfo(address);
      
      if (!addressInfo) {
        return sendError(res, 'Email address not found', 404);
      }

      sendSuccess(res, addressInfo, 'Address information retrieved successfully');
    } catch (error) {
      logger.error('Error getting address info:', error);
      sendError(res, 'Failed to get address information', 500);
    }
  });

  /**
   * Check if email address is available
   */
  checkAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;

    try {
      const addressInfo = await this.emailService.getEmailAddressInfo(address);
      const isAvailable = !addressInfo;

      sendSuccess(res, { 
        address,
        available: isAvailable 
      }, isAvailable ? 'Address is available' : 'Address is already taken');
    } catch (error) {
      logger.error('Error checking availability:', error);
      sendError(res, 'Failed to check address availability', 500);
    }
  });

  /**
   * Get list of generated email addresses
   */
  getGeneratedAddresses = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 50 } = req.query;

    try {
      const result = await this.emailService.getGeneratedAddresses(
        parseInt(page as string),
        parseInt(limit as string)
      );

      sendSuccess(res, result, 'Generated addresses retrieved successfully');
    } catch (error) {
      logger.error('Error getting generated addresses:', error);
      sendError(res, 'Failed to retrieve generated addresses', 500);
    }
  });
}
