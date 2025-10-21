import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import examRoutes from './exam.routes.js';
import examMediaRoutes from './examMedia.routes.js';
import reminderRoutes from './reminder.routes.js';
import shareLinkRoutes from './shareLink.routes.js';
import sharedExamRoutes from './sharedExam.routes.js';
import shareAccessLogRoutes from './shareAccessLog.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Rotas principais
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/exams', examRoutes);
router.use('/exam-media', examMediaRoutes);
router.use('/reminders', reminderRoutes);
router.use('/share-links', shareLinkRoutes);
router.use('/shared-exams', sharedExamRoutes);
router.use('/share-access-logs', shareAccessLogRoutes);

export default router;

