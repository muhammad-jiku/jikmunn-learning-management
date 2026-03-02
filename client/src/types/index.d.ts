/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface PaymentMethod {
    methodId: string;
    type: string;
    lastFour: string;
    expiry: string;
  }

  interface Window {
    Clerk?: any;
  }

  interface UserSettings {
    theme?: 'light' | 'dark';
    emailAlerts?: boolean;
    smsAlerts?: boolean;
    courseNotifications?: boolean;
    notificationFrequency?: 'immediate' | 'daily' | 'weekly';
  }

  interface User {
    userId: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email: string;
    publicMetadata: {
      userType: 'teacher' | 'student';
    };
    privateMetadata: {
      settings?: UserSettings;
      paymentMethods?: Array<PaymentMethod>;
      defaultPaymentMethodId?: string;
      stripeCustomerId?: string;
    };
    unsafeMetadata: {
      bio?: string;
      urls?: string[];
    };
  }

  interface Review {
    reviewId: string;
    courseId: string;
    userId: string;
    userName: string;
    rating: number;
    comment?: string;
    helpful: number;
    createdAt: string;
    updatedAt: string;
  }

  interface CourseRatingSummary {
    averageRating: number;
    reviewCount: number;
  }

  interface Certificate {
    certificateId: string;
    userId: string;
    courseId: string;
    courseName: string;
    userName: string;
    issuedAt: string;
    verificationUrl: string;
    createdAt?: string;
    updatedAt?: string;
  }

  interface Course {
    courseId: string;
    teacherId: string;
    teacherName: string;
    teacherBio?: string;
    title: string;
    description?: string;
    category: string;
    image?: string;
    price?: number; // Stored in cents (e.g., 4999 for $49.99)
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    status: 'Draft' | 'Published';
    sections: Section[];
    enrollments?: Array<{
      userId: string;
    }>;
    averageRating?: number;
    reviewCount?: number;
  }

  interface Transaction {
    userId: string;
    transactionId: string;
    dateTime: string;
    courseId: string;
    paymentProvider: 'stripe';
    paymentMethodId?: string;
    amount: number; // Stored in cents
    savePaymentMethod?: boolean;
  }

  interface DateRange {
    from: string | undefined;
    to: string | undefined;
  }

  interface UserCourseProgress {
    userId: string;
    courseId: string;
    enrollmentDate: string;
    overallProgress: number;
    sections: SectionProgress[];
    lastAccessedTimestamp: string;
  }

  type CreateUserArgs = Omit<User, 'userId'>;
  type CreateCourseArgs = Omit<Course, 'courseId'>;
  type CreateTransactionArgs = Omit<Transaction, 'transactionId'>;

  interface CourseCardProps {
    course: Course;
    onGoToCourse: (course: Course) => void;
  }

  interface TeacherCourseCardProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    isOwner: boolean;
  }

  interface Comment {
    commentId: string;
    userId: string;
    text: string;
    timestamp: string;
  }

  interface ChapterComment extends Comment {
    userName: string;
  }

  interface QuizQuestion {
    questionId: string;
    text: string;
    type: 'multiple-choice' | 'true-false';
    options: string[];
    correctAnswer: string;
    points: number;
  }

  interface Quiz {
    quizId: string;
    title: string;
    questions: QuizQuestion[];
    passingScore: number;
    timeLimit?: number;
  }

  interface QuizAttempt {
    quizId: string;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    answers: Record<string, string>;
    submittedAt: string;
  }

  interface Chapter {
    chapterId: string;
    title: string;
    content: string;
    video?: string;
    youtubeVideoId?: string;
    freePreview?: boolean;
    type: 'Text' | 'Quiz' | 'Video';
    quiz?: Quiz;
  }

  interface ChapterProgress {
    chapterId: string;
    completed: boolean;
    quizScore?: number;
    quizPassed?: boolean;
  }

  interface SectionProgress {
    sectionId: string;
    chapters: ChapterProgress[];
  }

  interface Section {
    sectionId: string;
    sectionTitle: string;
    sectionDescription?: string;
    chapters: Chapter[];
  }

  interface WizardStepperProps {
    currentStep: number;
  }

  interface AccordionSectionsProps {
    sections: Section[];
  }

  interface SearchCourseCardProps {
    course: Course;
    isSelected?: boolean;
    onClick?: () => void;
  }

  interface CoursePreviewProps {
    course: Course;
  }

  interface CustomFixedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
  }

  interface HeaderProps {
    title: string;
    subtitle: string;
    rightElement?: ReactNode;
  }

  interface SharedNotificationSettingsProps {
    title?: string;
    subtitle?: string;
  }

  interface SelectedCourseProps {
    course: Course;
    handleEnrollNow: (courseId: string) => void;
  }

  interface ToolbarProps {
    onSearch: (search: string) => void;
    onCategoryChange: (category: string) => void;
  }

  interface ChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    chapterIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
    courseId: string;
  }

  interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  }

  interface DroppableComponentProps {
    sections: Section[];
    setSections: (sections: Section[]) => void;
    handleEditSection: (index: number) => void;
    handleDeleteSection: (index: number) => void;
    handleAddChapter: (sectionIndex: number) => void;
    handleEditChapter: (sectionIndex: number, chapterIndex: number) => void;
    handleDeleteChapter: (sectionIndex: number, chapterIndex: number) => void;
  }

  interface CourseFormData {
    courseTitle: string;
    courseDescription: string;
    courseCategory: string;
    coursePrice: string;
    courseStatus: boolean;
  }

  // ─── Analytics Types ───────────────────────────────────────────────────────────

  interface EnrollmentTrend {
    date: string;
    count: number;
  }

  interface RevenueTrend {
    date: string;
    revenue: number;
  }

  interface CoursePerformance {
    courseId: string;
    title: string;
    enrollments: number;
    completionRate: number;
    averageProgress: number;
    revenue: number;
    status: string;
  }

  interface TeacherOverviewAnalytics {
    totalStudents: number;
    totalRevenue: number;
    totalCourses: number;
    averageRating: number;
    totalReviews: number;
    enrollmentsTrend: EnrollmentTrend[];
    revenueTrend: RevenueTrend[];
    coursePerformance: CoursePerformance[];
  }

  interface ProgressDistribution {
    range: string;
    count: number;
  }

  interface ChapterStat {
    chapterId: string;
    chapterTitle: string;
    sectionTitle: string;
    completions: number;
    totalStudents: number;
  }

  interface TeacherCourseAnalytics {
    courseId: string;
    title: string;
    enrollments: number;
    revenue: number;
    completionRate: number;
    averageProgress: number;
    progressDistribution: ProgressDistribution[];
    chapterStats: ChapterStat[];
    certificatesIssued: number;
  }

  interface StudentCourseProgress {
    courseId: string;
    title: string;
    category: string;
    overallProgress: number;
    enrollmentDate: string;
    lastAccessedTimestamp: string;
    hasCertificate: boolean;
  }

  interface CategoryDistribution {
    name: string;
    value: number;
  }

  interface StudentAnalytics {
    totalCoursesEnrolled: number;
    completedCourses: number;
    inProgressCourses: number;
    averageProgress: number;
    totalChaptersCompleted: number;
    totalChapters: number;
    certificatesEarned: number;
    courseProgress: StudentCourseProgress[];
    recentActivityCount: number;
    categoryDistribution: CategoryDistribution[];
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  interface Notification {
    _id: string;
    userId: string;
    type: string;
    channel: 'email' | 'in_app';
    recipient: string;
    subject: string;
    status: 'pending' | 'sent' | 'failed' | 'logged' | 'read';
    error?: string;
    externalId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }

  interface NotificationPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }

  interface NotificationsResponse {
    notifications: Notification[];
    pagination: NotificationPagination;
  }

  interface UnreadCountResponse {
    unreadCount: number;
  }

  // ─── Coupons ──────────────────────────────────────────────────────────────────

  interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    usedCount: number;
    courseIds: string[];
    minPurchase: number;
    createdBy: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface CouponValidationResult {
    valid: boolean;
    reason?: string;
    coupon?: {
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      minPurchase: number;
      courseIds: string[];
      validUntil: string;
    };
    discountAmount?: number;
    finalAmount?: number;
    originalAmount?: number;
    minPurchase?: number;
  }

  // ─── Discussions ──────────────────────────────────────────────────────────────

  interface Discussion {
    discussionId: string;
    courseId: string;
    chapterId?: string;
    userId: string;
    userName: string;
    title: string;
    content: string;
    upvotes: number;
    replyCount: number;
    isInstructorPost: boolean;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface DiscussionReply {
    replyId: string;
    discussionId: string;
    userId: string;
    userName: string;
    content: string;
    isInstructorReply: boolean;
    upvotes: number;
    createdAt: string;
    updatedAt: string;
  }

  interface DiscussionWithReplies extends Discussion {
    replies: DiscussionReply[];
  }

  interface DiscussionsResponse {
    data: Discussion[];
    total: number;
    page: number;
    limit: number;
  }
}

export {};
