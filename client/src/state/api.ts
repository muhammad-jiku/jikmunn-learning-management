/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from '@clerk/nextjs/server';
import { BaseQueryApi, FetchArgs } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { toast } from 'sonner';

const customBaseQuery = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: any
) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      const token = await window.Clerk?.session?.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  });

  try {
    const result: any = await baseQuery(args, api, extraOptions);

    if (result.error) {
      const errorData = result.error.data;
      const errorMessage =
        errorData?.message ||
        result.error.status.toString() ||
        'An error occurred';

      // Only show error toast for client errors (4xx) and server errors (5xx)
      if (result.error.status >= 400) {
        toast.error(`Error: ${errorMessage}`);
      }
    }

    const isMutationRequest =
      (args as FetchArgs).method && (args as FetchArgs).method !== 'GET';

    if (isMutationRequest && result.data) {
      const successMessage = result.data?.message;
      if (successMessage) toast.success(successMessage);
    }

    if (result.data) {
      result.data = result.data.data;
    } else if (
      result.error?.status === 204 ||
      result.meta?.response?.status === 204
    ) {
      return { data: null };
    }

    return result;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return { error: { status: 'FETCH_ERROR', error: errorMessage } };
  }
};

export const api = createApi({
  baseQuery: customBaseQuery,
  reducerPath: 'api',
  tagTypes: [
    'Courses',
    'Users',
    'UserCourseProgress',
    'Transactions',
    'Comments',
    'Quizzes',
    'Reviews',
  ],
  endpoints: (build) => ({
    /* 
    ===============
    USER CLERK
    =============== 
    */
    updateUser: build.mutation<User, Partial<User> & { userId: string }>({
      query: ({ userId, ...updatedUser }) => ({
        url: `users/clerk/${userId}`,
        method: 'PUT',
        body: updatedUser,
      }),
      invalidatesTags: ['Users'],
    }),

    /* 
    ===============
    COURSES
    =============== 
    */
    getCourses: build.query<Course[], { category?: string }>({
      query: ({ category }) => ({
        url: 'courses',
        params: { category },
      }),
      providesTags: ['Courses'],
    }),

    getCourse: build.query<Course, string>({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Courses', id }],
    }),

    createCourse: build.mutation<Course, void>({
      query: () => ({
        url: `courses`,
        method: 'POST',
      }),
      invalidatesTags: ['Courses'],
    }),

    // createCourse: build.mutation<
    //   Course,
    //   { teacherId: string; teacherName: string }
    // >({
    //   query: (body) => ({
    //     url: `courses`,
    //     method: 'POST',
    //     body,
    //   }),
    //   invalidatesTags: ['Courses'],
    // }),

    updateCourse: build.mutation<
      Course,
      { courseId: string; formData: FormData }
    >({
      query: ({ courseId, formData }) => ({
        url: `courses/${courseId}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Courses', id: courseId },
      ],
    }),

    deleteCourse: build.mutation<{ message: string }, string>({
      query: (courseId) => ({
        url: `courses/${courseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),

    getUploadImageSignature: build.mutation<
      {
        signature: string;
        timestamp: number;
        cloudName: string;
        apiKey: string;
        folder: string;
      },
      string
    >({
      query: (courseId) => ({
        url: `courses/${courseId}/upload-signature`,
        method: 'POST',
      }),
    }),

    /* 
    ===============
    COMMENTS
    =============== 
    */
    getChapterComments: build.query<
      ChapterComment[],
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) =>
        `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments`,
      providesTags: (result, error, { chapterId }) => [
        { type: 'Comments', id: chapterId },
      ],
    }),

    addComment: build.mutation<
      ChapterComment,
      { courseId: string; sectionId: string; chapterId: string; text: string }
    >({
      query: ({ courseId, sectionId, chapterId, text }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments`,
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: (result, error, { chapterId }) => [
        { type: 'Comments', id: chapterId },
      ],
    }),

    deleteComment: build.mutation<
      { message: string },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        commentId: string;
      }
    >({
      query: ({ courseId, sectionId, chapterId, commentId }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { chapterId }) => [
        { type: 'Comments', id: chapterId },
      ],
    }),

    /* 
    ===============
    TRANSACTIONS
    =============== 
    */
    getTransactions: build.query<Transaction[], string>({
      query: (userId) => `transactions?userId=${userId}`,
      providesTags: ['Transactions'],
    }),

    createStripePaymentIntent: build.mutation<
      { clientSecret: string },
      { amount: number }
    >({
      query: ({ amount }) => ({
        url: `/transactions/stripe/payment-intent`,
        method: 'POST',
        body: { amount },
      }),
    }),

    createTransaction: build.mutation<Transaction, Partial<Transaction>>({
      query: (transaction) => ({
        url: 'transactions',
        method: 'POST',
        body: transaction,
      }),
      invalidatesTags: ['Transactions', 'Courses', 'UserCourseProgress'],
    }),

    /* 
    ===============
    USER COURSE PROGRESS
    =============== 
    */
    getUserEnrolledCourses: build.query<Course[], string>({
      query: (userId) => `users/course-progress/${userId}/enrolled-courses`,
      providesTags: ['Courses', 'UserCourseProgress'],
    }),

    getUserCourseProgress: build.query<
      UserCourseProgress,
      { userId: string; courseId: string }
    >({
      query: ({ userId, courseId }) =>
        `users/course-progress/${userId}/courses/${courseId}`,
      providesTags: ['UserCourseProgress'],
    }),

    updateUserCourseProgress: build.mutation<
      UserCourseProgress,
      {
        userId: string;
        courseId: string;
        progressData: {
          sections: SectionProgress[];
        };
      }
    >({
      query: ({ userId, courseId, progressData }) => ({
        url: `users/course-progress/${userId}/courses/${courseId}`,
        method: 'PUT',
        body: progressData,
      }),
      invalidatesTags: ['UserCourseProgress'],
      async onQueryStarted(
        { userId, courseId, progressData },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getUserCourseProgress',
            { userId, courseId },
            (draft) => {
              Object.assign(draft, {
                ...draft,
                sections: progressData.sections,
              });
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /* 
    ===============
    QUIZZES
    =============== 
    */
    getChapterQuiz: build.query<
      Quiz,
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) =>
        `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/quiz`,
      providesTags: (result, error, { chapterId }) => [
        { type: 'Quizzes', id: chapterId },
      ],
    }),

    getChapterQuizTeacher: build.query<
      Quiz,
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) =>
        `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/quiz/teacher`,
      providesTags: (result, error, { chapterId }) => [
        { type: 'Quizzes', id: chapterId },
      ],
    }),

    upsertChapterQuiz: build.mutation<
      Quiz,
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        quiz: Partial<Quiz>;
      }
    >({
      query: ({ courseId, sectionId, chapterId, quiz }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/quiz`,
        method: 'POST',
        body: quiz,
      }),
      invalidatesTags: (result, error, { chapterId, courseId }) => [
        { type: 'Quizzes', id: chapterId },
        { type: 'Courses', id: courseId },
      ],
    }),

    deleteChapterQuiz: build.mutation<
      { message: string },
      { courseId: string; sectionId: string; chapterId: string }
    >({
      query: ({ courseId, sectionId, chapterId }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/quiz`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { chapterId, courseId }) => [
        { type: 'Quizzes', id: chapterId },
        { type: 'Courses', id: courseId },
      ],
    }),

    submitQuizAnswers: build.mutation<
      QuizAttempt & {
        questionResults: any[];
        passingScore: number;
        message: string;
      },
      {
        courseId: string;
        sectionId: string;
        chapterId: string;
        answers: Record<string, string>;
      }
    >({
      query: ({ courseId, sectionId, chapterId, answers }) => ({
        url: `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/quiz/submit`,
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: ['UserCourseProgress'],
    }),

    /* 
    ===============
    REVIEWS
    =============== 
    */
    getCourseReviews: build.query<
      {
        reviews: Review[];
        summary: {
          averageRating: number;
          totalReviews: number;
          distribution: Record<string, number>;
        };
      },
      { courseId: string; rating?: number; sort?: string }
    >({
      query: ({ courseId, rating, sort }) => ({
        url: `reviews/courses/${courseId}/reviews`,
        params: { ...(rating && { rating }), ...(sort && { sort }) },
      }),
      providesTags: (result, error, { courseId }) => [
        { type: 'Reviews', id: courseId },
      ],
    }),

    getCourseRatingSummary: build.query<CourseRatingSummary, string>({
      query: (courseId) => `reviews/courses/${courseId}/rating`,
      providesTags: (result, error, courseId) => [
        { type: 'Reviews', id: courseId },
      ],
    }),

    addReview: build.mutation<
      Review,
      { courseId: string; rating: number; comment?: string }
    >({
      query: ({ courseId, rating, comment }) => ({
        url: `reviews/courses/${courseId}/reviews`,
        method: 'POST',
        body: { rating, comment },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Reviews', id: courseId },
      ],
    }),

    updateReview: build.mutation<
      Review,
      { reviewId: string; courseId: string; rating?: number; comment?: string }
    >({
      query: ({ reviewId, rating, comment }) => ({
        url: `reviews/${reviewId}`,
        method: 'PUT',
        body: { rating, comment },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Reviews', id: courseId },
      ],
    }),

    deleteReview: build.mutation<
      { message: string },
      { reviewId: string; courseId: string }
    >({
      query: ({ reviewId }) => ({
        url: `reviews/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Reviews', id: courseId },
      ],
    }),

    markReviewHelpful: build.mutation<
      Review,
      { reviewId: string; courseId: string }
    >({
      query: ({ reviewId }) => ({
        url: `reviews/${reviewId}/helpful`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Reviews', id: courseId },
      ],
    }),
  }),
});

export const {
  useUpdateUserMutation,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetUploadImageSignatureMutation,
  useGetChapterCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useCreateStripePaymentIntentMutation,
  useGetUserEnrolledCoursesQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
  useGetChapterQuizQuery,
  useGetChapterQuizTeacherQuery,
  useUpsertChapterQuizMutation,
  useDeleteChapterQuizMutation,
  useSubmitQuizAnswersMutation,
  useGetCourseReviewsQuery,
  useGetCourseRatingSummaryQuery,
  useAddReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useMarkReviewHelpfulMutation,
} = api;
