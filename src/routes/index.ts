import { Router } from 'express';
import emailRoutes from './emails';
import adminRoutes from './admin';

const router = Router();

// API routes
router.use('/emails', emailRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
