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
  couponCode: z.string().optional(),
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

// ─── Coupon Schemas ────────────────────────────────────────────────────────────

export const createCouponBody = z.object({
  code: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20, 'Coupon code must be at most 20 characters')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'Coupon code can only contain letters, numbers, hyphens, and underscores'
    ),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be positive'),
  validFrom: z.string().min(1, 'validFrom is required'),
  validUntil: z.string().min(1, 'validUntil is required'),
  usageLimit: z.number().int().positive().optional(),
  courseIds: z.array(z.string()).optional(),
  minPurchase: z.number().int().min(0).optional(),
  createdBy: z.string().min(1, 'createdBy is required'),
});

export const updateCouponBody = z
  .object({
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().positive().optional(),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    courseIds: z.array(z.string()).optional(),
    minPurchase: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough();

export const validateCouponParams = z.object({
  code: z.string().min(1, 'Coupon code is required'),
});

export const validateCouponQuery = z.object({
  courseId: z.string().optional(),
  amount: z.coerce.number().int().min(0).optional(),
});

export const couponIdParam = z.object({
  couponId: z.string().min(1, 'couponId is required'),
});

// ─── Discussion Schemas ────────────────────────────────────────────────────────

export const discussionIdParam = z.object({
  discussionId: z.string().min(1, 'discussionId is required'),
});

export const replyIdParam = z.object({
  replyId: z.string().min(1, 'replyId is required'),
});

export const getDiscussionsQuery = z.object({
  chapterId: z.string().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['newest', 'oldest', 'popular']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const createDiscussionBody = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be at most 5000 characters'),
  chapterId: z.string().optional(),
});

export const createReplyBody = z.object({
  content: z
    .string()
    .min(1, 'Reply content is required')
    .max(3000, 'Reply must be at most 3000 characters'),
});
