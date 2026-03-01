import { requireAuth } from '@clerk/express';
import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  sendTestEmail,
  triggerProgressReminders,
} from '../controllers/notificationControllers';
import {
  notificationIdParam,
  notificationsQuery,
  sendTestEmailBody,
  userIdParam,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = Router();

// User notification endpoints (require auth)
router.get(
  '/:userId',
  requireAuth(),
  validateRequest({ params: userIdParam, query: notificationsQuery }),
  getNotifications
);

router.get(
  '/:userId/unread-count',
  requireAuth(),
  validateRequest({ params: userIdParam }),
  getUnreadCount
);

router.put(
  '/:userId/read-all',
  requireAuth(),
  validateRequest({ params: userIdParam }),
  markAllNotificationsRead
);

router.put(
  '/:userId/:notificationId/read',
  requireAuth(),
  validateRequest({ params: notificationIdParam }),
  markNotificationRead
);

// Test email endpoint (requires auth)
router.post(
  '/:userId/test',
  requireAuth(),
  validateRequest({ params: userIdParam, body: sendTestEmailBody }),
  sendTestEmail
);

// Cron trigger for progress reminders (secured by cron secret)
router.post('/cron/progress-reminders', triggerProgressReminders);

export default router;
