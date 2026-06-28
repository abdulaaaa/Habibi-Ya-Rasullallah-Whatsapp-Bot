import { Router } from 'express';
const router = Router();

// Import route modules (will be created next)
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';

// Mount routes
router.use('/', authRoutes);
router.use('/', dashboardRoutes);

export default router;
