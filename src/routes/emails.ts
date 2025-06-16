import { Router } from 'express';
import { EmailController } from '@/controllers/EmailController';
import { emailValidation } from '@/middleware/validation';
import { validate } from '@/middleware/validation-middleware';

const router = Router();
const emailController = new EmailController();

/**
 * @swagger
 * /api/emails/generate:
 *   post:
 *     summary: Generate a new temporary email address
 *     tags: [Emails]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customPrefix:
 *                 type: string
 *                 description: Custom prefix for the email address (optional)
 *     responses:
 *       201:
 *         description: Email address generated successfully
 */
router.post('/generate', validate(emailValidation.generateEmail), emailController.generateEmail);

/**
 * @swagger
 * /api/emails/{address}:
 *   get:
 *     summary: Get emails for a specific address
 *     tags: [Emails]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Email address
 */
router.get('/:address', validate(emailValidation.emailAddress, 'params'), emailController.getEmails);

/**
 * @swagger
 * /api/emails/{address}/unread-count:
 *   get:
 *     summary: Get unread email count for an address
 *     tags: [Emails]
 */
router.get('/:address/unread-count', validate(emailValidation.emailAddress, 'params'), emailController.getUnreadCount);

/**
 * @swagger
 * /api/emails/{address}/info:
 *   get:
 *     summary: Get email address information
 *     tags: [Emails]
 */
router.get('/:address/info', validate(emailValidation.emailAddress, 'params'), emailController.getAddressInfo);

/**
 * @swagger
 * /api/emails/{address}/check:
 *   get:
 *     summary: Check if email address is available
 *     tags: [Emails]
 */
router.get('/:address/check', validate(emailValidation.emailAddress, 'params'), emailController.checkAvailability);

/**
 * @swagger
 * /api/emails/{address}:
 *   delete:
 *     summary: Delete all emails for an address
 *     tags: [Emails]
 */
router.delete('/:address', validate(emailValidation.emailAddress, 'params'), emailController.deleteAllEmails);

/**
 * @swagger
 * /api/emails/message/{id}:
 *   get:
 *     summary: Get a specific email by ID
 *     tags: [Emails]
 */
router.get('/message/:id', validate(emailValidation.emailId, 'params'), emailController.getEmailById);

/**
 * @swagger
 * /api/emails/message/{id}:
 *   delete:
 *     summary: Delete a specific email
 *     tags: [Emails]
 */
router.delete('/message/:id', validate(emailValidation.emailId, 'params'), emailController.deleteEmail);

export default router;
