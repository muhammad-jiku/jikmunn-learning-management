/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resend } from 'resend';
import logger from '../config/logger';
import Notification from '../models/notificationModel';
import { EMAIL_TEMPLATE_MAP, EmailTemplateType } from './emailTemplates';

// ─── Resend Client ──────────────────────────────────────────────────────────────

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.EMAIL_FROM || 'Learn Now <notifications@learnnow.dev>';

let resend: Resend | null = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  logger.warn(
    'RESEND_API_KEY not configured — emails will be logged but not sent'
  );
}

// ─── Core Send Function ─────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  template: EmailTemplateType;
  data: Record<string, any>;
  userId?: string;
}

export const sendEmail = async (
  options: SendEmailOptions
): Promise<boolean> => {
  const { to, template, data, userId } = options;

  try {
    const templateFn = EMAIL_TEMPLATE_MAP[template];
    if (!templateFn) {
      logger.error('Unknown email template', { template });
      return false;
    }

    const { subject, html } = templateFn(data);

    // Log the notification
    const notification = new Notification({
      userId: userId || 'system',
      type: template,
      channel: 'email',
      recipient: to,
      subject,
      status: 'pending',
      metadata: data,
    });

    if (resend) {
      const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
      });

      if (result.error) {
        notification.status = 'failed';
        notification.error = result.error.message;
        await notification.save();
        logger.error('Email send failed', {
          to,
          template,
          error: result.error,
        });
        return false;
      }

      notification.status = 'sent';
      notification.externalId = result.data?.id;
      await notification.save();

      logger.info('Email sent successfully', {
        to,
        template,
        externalId: result.data?.id,
      });
      return true;
    } else {
      // Dev mode — log only
      notification.status = 'logged';
      await notification.save();
      logger.info('Email logged (dev mode — no RESEND_API_KEY)', {
        to,
        template,
        subject,
      });
      return true;
    }
  } catch (error) {
    logger.error('Email service error', {
      to,
      template,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
};

// ─── Convenience Helpers ────────────────────────────────────────────────────────

export const sendWelcomeEmail = (
  to: string,
  userName: string,
  userId?: string
) =>
  sendEmail({
    to,
    template: 'welcome',
    data: {
      userName,
      loginUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/signin`,
    },
    userId,
  });

export const sendEnrollmentEmail = (
  to: string,
  userName: string,
  courseName: string,
  courseId: string,
  amount: number,
  userId?: string
) =>
  sendEmail({
    to,
    template: 'enrollment_confirmation',
    data: {
      userName,
      courseName,
      courseUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/student/courses/${courseId}`,
      amount,
    },
    userId,
  });

export const sendCourseCompletionEmail = (
  to: string,
  userName: string,
  courseName: string,
  certificateUrl?: string,
  userId?: string
) =>
  sendEmail({
    to,
    template: 'course_completion',
    data: {
      userName,
      courseName,
      certificateUrl,
      dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/student/courses`,
    },
    userId,
  });

export const sendProgressReminderEmail = (
  to: string,
  userName: string,
  coursesInProgress: { title: string; progress: number }[],
  userId?: string
) =>
  sendEmail({
    to,
    template: 'progress_reminder',
    data: {
      userName,
      coursesInProgress,
      dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/student/courses`,
    },
    userId,
  });
