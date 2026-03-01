/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import logger from '../config/logger';
import { clerkClient } from '../index';
import Course from '../models/courseModel';
import Notification from '../models/notificationModel';
import UserCourseProgress from '../models/userCourseProgressModel';
import { sendEmail, sendProgressReminderEmail } from '../services/emailService';

// ─── Get Notification History ───────────────────────────────────────────────────

export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
    ]);

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications', { userId, error });
    res.status(500).json({
      message: 'Error retrieving notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ─── Mark Notification as Read ──────────────────────────────────────────────────

export const markNotificationRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, notificationId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { status: 'read' },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.status(200).json({
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    logger.error('Error marking notification read', {
      userId,
      notificationId,
      error,
    });
    res.status(500).json({
      message: 'Error updating notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ─── Mark All Notifications Read ────────────────────────────────────────────────

export const markAllNotificationsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const result = await Notification.updateMany(
      { userId, status: { $in: ['sent', 'logged'] } },
      { status: 'read' }
    );

    res.status(200).json({
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    logger.error('Error marking all notifications read', { userId, error });
    res.status(500).json({
      message: 'Error updating notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ─── Get Unread Count ───────────────────────────────────────────────────────────

export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const count = await Notification.countDocuments({
      userId,
      status: { $in: ['sent', 'logged'] },
    });

    res.status(200).json({
      message: 'Unread count retrieved',
      data: { unreadCount: count },
    });
  } catch (error) {
    logger.error('Error fetching unread count', { userId, error });
    res.status(500).json({
      message: 'Error retrieving unread count',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ─── Send Test Email ────────────────────────────────────────────────────────────

export const sendTestEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const { template, email } = req.body;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const targetEmail = email || user.emailAddresses[0]?.emailAddress;

    if (!targetEmail) {
      res.status(400).json({ message: 'No email address found' });
      return;
    }

    const userName =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.username ||
      'User';

    const success = await sendEmail({
      to: targetEmail,
      template: template || 'welcome',
      data: {
        userName,
        loginUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/signin`,
        courseName: 'Sample Course',
        courseUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/student/courses`,
        amount: 4999,
        dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/student/courses`,
        coursesInProgress: [
          { title: 'Introduction to TypeScript', progress: 65 },
          { title: 'React Mastery', progress: 30 },
        ],
      },
      userId,
    });

    if (success) {
      res.status(200).json({
        message: `Test email (${template || 'welcome'}) sent to ${targetEmail}`,
        data: { sent: true },
      });
    } else {
      res.status(500).json({ message: 'Failed to send test email' });
    }
  } catch (error) {
    logger.error('Error sending test email', { userId, error });
    res.status(500).json({
      message: 'Error sending test email',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ─── Send Progress Reminders (Cron / Manual Trigger) ────────────────────────────

export const triggerProgressReminders = async (
  req: Request,
  res: Response
): Promise<void> => {
  // This endpoint can be triggered by a cron job (Vercel Cron / external)
  // It requires a secret key header for security
  const cronSecret = req.headers['x-cron-secret'];
  const auth = getAuth(req);

  // Allow either cron secret or authenticated admin
  if (cronSecret !== process.env.CRON_SECRET && !auth?.userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    // Find all users with in-progress courses
    const progressRecords = await UserCourseProgress.find({
      overallProgress: { $gt: 0, $lt: 100 },
    });

    // Group by user
    const userProgressMap = new Map<string, any[]>();
    for (const record of progressRecords) {
      const existing = userProgressMap.get(record.userId) || [];
      existing.push(record);
      userProgressMap.set(record.userId, existing);
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const [userId, records] of userProgressMap) {
      try {
        // Check user preferences
        const user = await clerkClient.users.getUser(userId);
        const settings = (user.publicMetadata as any)?.settings;

        if (settings?.emailAlerts === false) {
          skippedCount++;
          continue;
        }

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) {
          skippedCount++;
          continue;
        }

        // Check if we already sent a reminder this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentReminder = await Notification.findOne({
          userId,
          type: 'progress_reminder',
          createdAt: { $gte: oneWeekAgo },
        });

        if (recentReminder) {
          skippedCount++;
          continue;
        }

        // Get course titles
        const courseIds = records.map((r) => r.courseId);
        const courses = await Course.find({ courseId: { $in: courseIds } });

        const coursesInProgress = records.map((r) => {
          const course = courses.find((c) => c.courseId === r.courseId);
          return {
            title: course?.title || 'Unknown Course',
            progress: Math.round(r.overallProgress),
          };
        });

        const userName =
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.username ||
          'Student';

        await sendProgressReminderEmail(
          email,
          userName,
          coursesInProgress,
          userId
        );
        sentCount++;
      } catch (userError) {
        logger.warn('Failed to send reminder for user', {
          userId,
          error: userError,
        });
        skippedCount++;
      }
    }

    logger.info('Progress reminders completed', { sentCount, skippedCount });

    res.status(200).json({
      message: 'Progress reminders processed',
      data: { sentCount, skippedCount, totalUsers: userProgressMap.size },
    });
  } catch (error) {
    logger.error('Error triggering progress reminders', { error });
    res.status(500).json({
      message: 'Error processing progress reminders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
