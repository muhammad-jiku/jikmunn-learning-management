import { z } from 'zod';

// ─── Common Param Schemas ──────────────────────────────────────────────────────

export const courseIdParam = z.object({
  courseId: z.string().min(1, 'courseId is required'),
});

export const chapterParams = z.object({
  courseId: z.string().min(1),
  sectionId: z.string().min(1),
  chapterId: z.string().min(1),
});

export const commentParams = z.object({
  courseId: z.string().min(1),
  sectionId: z.string().min(1),
  chapterId: z.string().min(1),
  commentId: z.string().min(1),
});

export const userIdParam = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const userCourseParams = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
});

export const reviewIdParam = z.object({
  reviewId: z.string().min(1, 'reviewId is required'),
});

// ─── Course Schemas ────────────────────────────────────────────────────────────

export const listCoursesQuery = z.object({
  category: z.string().optional(),
});

export const updateCourseBody = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    image: z.string().optional(),
    price: z.union([z.string(), z.number()]).optional(),
    level: z.string().optional(),
    status: z.enum(['Draft', 'Published']).optional(),
    sections: z.union([z.string(), z.array(z.any())]).optional(),
  })
  .passthrough();

export const addCommentBody = z.object({
  text: z.string().min(1, 'Comment text is required').max(2000),
});

// ─── Quiz Schemas ──────────────────────────────────────────────────────────────

const quizQuestionSchema = z.object({
  questionId: z.string().optional(),
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer']).optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  points: z.number().int().positive().optional(),
});

export const upsertQuizBody = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  questions: z
    .array(quizQuestionSchema)
    .min(1, 'At least one question is required'),
  passingScore: z.number().int().min(0).max(100).optional(),
  timeLimit: z.number().int().positive().optional(),
});

export const submitQuizBody = z.object({
  answers: z.record(z.string(), z.string()),
});

// ─── Transaction Schemas ───────────────────────────────────────────────────────

export const listTransactionsQuery = z.object({
  userId: z.string().optional(),
});

export const createTransactionBody = z.object({
  userId: z.string().min(1, 'userId is required'),
  courseId: z.string().min(1, 'courseId is required'),
  transactionId: z.string().min(1, 'transactionId is required'),
  amount: z.number().optional(),
  paymentProvider: z.string().min(1, 'paymentProvider is required'),
});

export const stripePaymentIntentBody = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
});

// ─── User Schemas ──────────────────────────────────────────────────────────────

export const updateUserBody = z.object({
  publicMetadata: z.object({
    userType: z.enum(['teacher', 'student']).optional(),
    settings: z.any().optional(),
    bio: z.string().max(500).optional(),
  }),
});

// ─── User Course Progress Schemas ──────────────────────────────────────────────

export const updateProgressBody = z.object({
  sections: z
    .array(
      z.object({
        sectionId: z.string().min(1),
        chapters: z.array(
          z.object({
            chapterId: z.string().min(1),
            completed: z.boolean(),
          })
        ),
      })
    )
    .optional(),
});

// ─── Review Schemas ────────────────────────────────────────────────────────────

export const getCourseReviewsQuery = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(['oldest', 'highest', 'lowest', 'helpful']).optional(),
});

export const addReviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const updateReviewBody = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
});

// ─── Certificate Schemas ───────────────────────────────────────────────────────

export const certificateIdParam = z.object({
  certificateId: z.string().min(1, 'certificateId is required'),
});

export const generateCertificateBody = z.object({
  courseId: z.string().min(1, 'courseId is required'),
});

// ─── Analytics Schemas ─────────────────────────────────────────────────────────

export const teacherIdParam = z.object({
  teacherId: z.string().min(1, 'teacherId is required'),
});

export const teacherCourseParams = z.object({
  teacherId: z.string().min(1, 'teacherId is required'),
  courseId: z.string().min(1, 'courseId is required'),
});

// ─── Notification Schemas ──────────────────────────────────────────────────────

export const notificationIdParam = z.object({
  userId: z.string().min(1, 'userId is required'),
  notificationId: z.string().min(1, 'notificationId is required'),
});

export const sendTestEmailBody = z.object({
  template: z
    .enum([
      'welcome',
      'enrollment_confirmation',
      'course_completion',
      'progress_reminder',
      'new_course',
    ])
    .optional(),
  email: z.string().email().optional(),
});

export const notificationsQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
