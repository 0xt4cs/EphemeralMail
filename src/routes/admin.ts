import { Router } from 'express';
import { AdminController } from '@/controllers/AdminController';
import { adminValidation } from '@/middleware/validation';
import { validate } from '@/middleware/validation-middleware';
import { requireApiKey } from '@/middleware';

const router = Router();
const adminController = new AdminController();

// Apply API key authentication to all admin routes
router.use(requireApiKey);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get server statistics
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/stats', validate(adminValidation.getStats, 'query'), adminController.getStats);

/**
 * @swagger
 * /api/admin/cleanup:
 *   post:
 *     summary: Clean up expired emails
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post('/cleanup', adminController.cleanupEmails);

/**
 * @swagger
 * /api/admin/blacklist:
 *   post:
 *     summary: Blacklist a domain
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post('/blacklist', validate(adminValidation.blacklistDomain), adminController.blacklistDomain);

/**
 * @swagger
 * /api/admin/blacklist:
 *   get:
 *     summary: Get blacklisted domains
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/blacklist', adminController.getBlacklistedDomains);

/**
 * @swagger
 * /api/admin/blacklist/{domain}:
 *   delete:
 *     summary: Remove domain from blacklist
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 */
router.delete('/blacklist/:domain', adminController.removeFromBlacklist);

/**
 * @swagger
 * /api/admin/usage:
 *   get:
 *     summary: Get API usage statistics
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/usage', adminController.getApiUsage);

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     summary: Get server health status
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/health', adminController.getHealth);

export default router;
