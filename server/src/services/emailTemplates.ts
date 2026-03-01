// ─── Email Templates ────────────────────────────────────────────────────────────
// HTML email templates for the Learning Management System
// All templates use inline styles for maximum email client compatibility.

const baseStyles = {
  container:
    'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;',
  header:
    'background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;',
  headerTitle: 'color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;',
  headerSubtitle:
    'color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 8px;',
  body: 'padding: 32px;',
  greeting: 'font-size: 18px; color: #ffffff; margin-bottom: 16px;',
  text: 'font-size: 14px; line-height: 1.7; color: #b0b0c0; margin-bottom: 16px;',
  button:
    'display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0;',
  card: 'background-color: #16213e; border-radius: 8px; padding: 20px; margin: 16px 0; border: 1px solid #2a2a4a;',
  cardLabel:
    'font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;',
  cardValue: 'font-size: 16px; color: #ffffff; font-weight: 600;',
  footer:
    'padding: 24px 32px; text-align: center; border-top: 1px solid #2a2a4a;',
  footerText: 'font-size: 12px; color: #666; margin: 0;',
  divider: 'border: none; border-top: 1px solid #2a2a4a; margin: 24px 0;',
};

function wrapTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 20px; background-color: #0f0f23;">
  <div style="${baseStyles.container}">
    ${content}
    <div style="${baseStyles.footer}">
      <p style="${baseStyles.footerText}">
        &copy; ${new Date().getFullYear()} Learn Now &mdash; Jikmunn Learning Management System
      </p>
      <p style="${baseStyles.footerText}; margin-top: 8px;">
        You received this email because of your account settings.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Welcome Email ──────────────────────────────────────────────────────────────

export function welcomeEmail(data: { userName: string; loginUrl: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: 'Welcome to Learn Now! 🎓',
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="${baseStyles.headerTitle}">Welcome to Learn Now!</h1>
        <p style="${baseStyles.headerSubtitle}">Your learning journey starts here</p>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.greeting}">Hi ${data.userName},</p>
        <p style="${baseStyles.text}">
          We're thrilled to have you on board! Learn Now offers a wide range of courses
          to help you grow your skills and advance your career.
        </p>
        <p style="${baseStyles.text}">Here's what you can do:</p>
        <div style="${baseStyles.card}">
          <p style="color: #e0e0e0; margin: 0 0 8px 0;">📚 Browse hundreds of courses</p>
          <p style="color: #e0e0e0; margin: 0 0 8px 0;">🎯 Track your learning progress</p>
          <p style="color: #e0e0e0; margin: 0 0 8px 0;">📝 Take quizzes to test your knowledge</p>
          <p style="color: #e0e0e0; margin: 0;">🏆 Earn certificates upon completion</p>
        </div>
        <div style="text-align: center;">
          <a href="${data.loginUrl}" style="${baseStyles.button}">Start Learning</a>
        </div>
      </div>
    `),
  };
}

// ─── Enrollment Confirmation ────────────────────────────────────────────────────

export function enrollmentConfirmationEmail(data: {
  userName: string;
  courseName: string;
  courseUrl: string;
  amount: number;
}): { subject: string; html: string } {
  return {
    subject: `You're enrolled in "${data.courseName}" 🎉`,
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="${baseStyles.headerTitle}">Enrollment Confirmed!</h1>
        <p style="${baseStyles.headerSubtitle}">You're all set to start learning</p>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.greeting}">Hi ${data.userName},</p>
        <p style="${baseStyles.text}">
          Great news! You've been successfully enrolled in a new course.
        </p>
        <div style="${baseStyles.card}">
          <p style="${baseStyles.cardLabel}">Course</p>
          <p style="${baseStyles.cardValue}">${data.courseName}</p>
          <hr style="${baseStyles.divider}" />
          <p style="${baseStyles.cardLabel}">Amount Paid</p>
          <p style="${baseStyles.cardValue}">$${(data.amount / 100).toFixed(2)}</p>
        </div>
        <p style="${baseStyles.text}">
          You can start learning right away. All your progress will be tracked automatically.
        </p>
        <div style="text-align: center;">
          <a href="${data.courseUrl}" style="${baseStyles.button}">Go to Course</a>
        </div>
      </div>
    `),
  };
}

// ─── Course Completion ──────────────────────────────────────────────────────────

export function courseCompletionEmail(data: {
  userName: string;
  courseName: string;
  certificateUrl?: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const certSection = data.certificateUrl
    ? `
      <div style="${baseStyles.card}">
        <p style="${baseStyles.cardLabel}">Certificate</p>
        <p style="${baseStyles.cardValue}">🏆 Your certificate has been generated!</p>
        <div style="text-align: center; margin-top: 12px;">
          <a href="${data.certificateUrl}" style="${baseStyles.button}; background: linear-gradient(135deg, #f59e0b, #d97706);">View Certificate</a>
        </div>
      </div>`
    : '';

  return {
    subject: `Congratulations! You completed "${data.courseName}" 🏆`,
    html: wrapTemplate(`
      <div style="${baseStyles.header}; background: linear-gradient(135deg, #10b981, #059669);">
        <h1 style="${baseStyles.headerTitle}">Course Completed!</h1>
        <p style="${baseStyles.headerSubtitle}">Outstanding achievement</p>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.greeting}">Congratulations, ${data.userName}! 🎉</p>
        <p style="${baseStyles.text}">
          You've successfully completed <strong style="color: #fff;">${data.courseName}</strong>. 
          That's a fantastic achievement!
        </p>
        ${certSection}
        <p style="${baseStyles.text}">
          Keep the momentum going — explore more courses to continue growing your skills.
        </p>
        <div style="text-align: center;">
          <a href="${data.dashboardUrl}" style="${baseStyles.button}">View Dashboard</a>
        </div>
      </div>
    `),
  };
}

// ─── Progress Reminder (Weekly Digest) ──────────────────────────────────────────

export function progressReminderEmail(data: {
  userName: string;
  coursesInProgress: {
    title: string;
    progress: number;
  }[];
  dashboardUrl: string;
}): { subject: string; html: string } {
  const courseList = data.coursesInProgress
    .map(
      (c) => `
        <div style="${baseStyles.card}">
          <p style="${baseStyles.cardValue}">${c.title}</p>
          <div style="margin-top: 8px; background: #2a2a4a; border-radius: 4px; height: 8px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); height: 100%; width: ${c.progress}%; border-radius: 4px;"></div>
          </div>
          <p style="font-size: 12px; color: #888; margin-top: 4px;">${c.progress}% complete</p>
        </div>`
    )
    .join('');

  return {
    subject: 'Your Weekly Learning Update 📊',
    html: wrapTemplate(`
      <div style="${baseStyles.header}; background: linear-gradient(135deg, #3b82f6, #2563eb);">
        <h1 style="${baseStyles.headerTitle}">Weekly Progress Update</h1>
        <p style="${baseStyles.headerSubtitle}">Keep up the great work!</p>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.greeting}">Hi ${data.userName},</p>
        <p style="${baseStyles.text}">
          Here's a summary of your learning progress this week:
        </p>
        ${courseList || '<p style="' + baseStyles.text + '">No courses in progress yet. Start one today!</p>'}
        <div style="text-align: center;">
          <a href="${data.dashboardUrl}" style="${baseStyles.button}">Continue Learning</a>
        </div>
      </div>
    `),
  };
}

// ─── New Course Notification ────────────────────────────────────────────────────

export function newCourseNotificationEmail(data: {
  userName: string;
  teacherName: string;
  courseName: string;
  courseDescription: string;
  courseUrl: string;
  price: number;
}): { subject: string; html: string } {
  return {
    subject: `New course by ${data.teacherName}: "${data.courseName}" 🆕`,
    html: wrapTemplate(`
      <div style="${baseStyles.header}; background: linear-gradient(135deg, #f59e0b, #d97706);">
        <h1 style="${baseStyles.headerTitle}">New Course Available!</h1>
        <p style="${baseStyles.headerSubtitle}">From ${data.teacherName}</p>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.greeting}">Hi ${data.userName},</p>
        <p style="${baseStyles.text}">
          A new course has been published that you might be interested in:
        </p>
        <div style="${baseStyles.card}">
          <p style="${baseStyles.cardValue}">${data.courseName}</p>
          <p style="${baseStyles.text}; margin-top: 8px;">${data.courseDescription}</p>
          <hr style="${baseStyles.divider}" />
          <p style="${baseStyles.cardLabel}">Price</p>
          <p style="${baseStyles.cardValue}">$${(data.price / 100).toFixed(2)}</p>
        </div>
        <div style="text-align: center;">
          <a href="${data.courseUrl}" style="${baseStyles.button}">View Course</a>
        </div>
      </div>
    `),
  };
}

// ─── Template Registry ──────────────────────────────────────────────────────────

export type EmailTemplateType =
  | 'welcome'
  | 'enrollment_confirmation'
  | 'course_completion'
  | 'progress_reminder'
  | 'new_course';

export const EMAIL_TEMPLATE_MAP: Record<
  EmailTemplateType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data: any) => { subject: string; html: string }
> = {
  welcome: welcomeEmail,
  enrollment_confirmation: enrollmentConfirmationEmail,
  course_completion: courseCompletionEmail,
  progress_reminder: progressReminderEmail,
  new_course: newCourseNotificationEmail,
};
