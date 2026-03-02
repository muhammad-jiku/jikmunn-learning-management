/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  addCommentBody,
  addReviewBody,
  certificateIdParam,
  chapterParams,
  couponIdParam,
  courseIdParam,
  createCouponBody,
  createDiscussionBody,
  createReplyBody,
  createTransactionBody,
  discussionIdParam,
  generateCertificateBody,
  getCourseReviewsQuery,
  getDiscussionsQuery,
  notificationIdParam,
  notificationsQuery,
  replyIdParam,
  sendTestEmailBody,
  submitQuizBody,
  teacherCourseParams,
  teacherIdParam,
  updateCouponBody,
  updateCourseBody,
  updateReviewBody,
  updateUserBody,
  upsertQuizBody,
  validateCouponParams,
  validateCouponQuery,
} from '../validators/schemas';

describe('Server Zod Schemas', () => {
  describe('courseIdParam', () => {
    it('should accept valid courseId', () => {
      expect(courseIdParam.safeParse({ courseId: 'abc123' }).success).toBe(
        true
      );
    });

    it('should reject empty courseId', () => {
      expect(courseIdParam.safeParse({ courseId: '' }).success).toBe(false);
    });

    it('should reject missing courseId', () => {
      expect(courseIdParam.safeParse({}).success).toBe(false);
    });
  });

  describe('chapterParams', () => {
    it('should accept valid params', () => {
      const result = chapterParams.safeParse({
        courseId: 'c1',
        sectionId: 's1',
        chapterId: 'ch1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing sectionId', () => {
      const result = chapterParams.safeParse({
        courseId: 'c1',
        chapterId: 'ch1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateCourseBody', () => {
    it('should accept partial update', () => {
      const result = updateCourseBody.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    it('should accept empty body (no required fields)', () => {
      const result = updateCourseBody.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept status enum values', () => {
      expect(updateCourseBody.safeParse({ status: 'Draft' }).success).toBe(
        true
      );
      expect(updateCourseBody.safeParse({ status: 'Published' }).success).toBe(
        true
      );
    });

    it('should reject invalid status', () => {
      expect(updateCourseBody.safeParse({ status: 'Invalid' }).success).toBe(
        false
      );
    });
  });

  describe('addCommentBody', () => {
    it('should accept valid comment', () => {
      expect(addCommentBody.safeParse({ text: 'Great!' }).success).toBe(true);
    });

    it('should reject empty text', () => {
      expect(addCommentBody.safeParse({ text: '' }).success).toBe(false);
    });

    it('should reject text over 2000 chars', () => {
      const result = addCommentBody.safeParse({ text: 'x'.repeat(2001) });
      expect(result.success).toBe(false);
    });
  });

  describe('upsertQuizBody', () => {
    it('should accept valid quiz', () => {
      const result = upsertQuizBody.safeParse({
        title: 'Quiz 1',
        questions: [{ text: 'What is 1+1?', correctAnswer: '2' }],
      });
      expect(result.success).toBe(true);
    });

    it('should reject quiz without questions', () => {
      const result = upsertQuizBody.safeParse({
        title: 'Quiz 1',
        questions: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject quiz without title', () => {
      const result = upsertQuizBody.safeParse({
        title: '',
        questions: [{ text: 'Q?', correctAnswer: 'A' }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('submitQuizBody', () => {
    it('should accept valid answers', () => {
      const result = submitQuizBody.safeParse({
        answers: { q1: 'a', q2: 'b' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-object answers', () => {
      const result = submitQuizBody.safeParse({ answers: 'bad' });
      expect(result.success).toBe(false);
    });
  });

  describe('createTransactionBody', () => {
    it('should accept valid transaction', () => {
      const result = createTransactionBody.safeParse({
        userId: 'u1',
        courseId: 'c1',
        transactionId: 't1',
        paymentProvider: 'stripe',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const result = createTransactionBody.safeParse({
        userId: 'u1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserBody', () => {
    it('should accept valid user update', () => {
      const result = updateUserBody.safeParse({
        publicMetadata: { userType: 'teacher' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid userType', () => {
      const result = updateUserBody.safeParse({
        publicMetadata: { userType: 'admin' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('addReviewBody', () => {
    it('should accept valid review', () => {
      const result = addReviewBody.safeParse({ rating: 5 });
      expect(result.success).toBe(true);
    });

    it('should reject rating > 5', () => {
      const result = addReviewBody.safeParse({ rating: 6 });
      expect(result.success).toBe(false);
    });

    it('should reject rating < 1', () => {
      const result = addReviewBody.safeParse({ rating: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateReviewBody', () => {
    it('should accept partial review update', () => {
      const result = updateReviewBody.safeParse({ comment: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should accept empty body', () => {
      const result = updateReviewBody.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('getCourseReviewsQuery', () => {
    it('should accept valid sort values', () => {
      for (const sort of ['oldest', 'highest', 'lowest', 'helpful']) {
        expect(getCourseReviewsQuery.safeParse({ sort }).success).toBe(true);
      }
    });

    it('should reject invalid sort', () => {
      expect(getCourseReviewsQuery.safeParse({ sort: 'random' }).success).toBe(
        false
      );
    });

    it('should coerce rating string to number', () => {
      const result = getCourseReviewsQuery.safeParse({ rating: '4' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(4);
      }
    });
  });

  // ─── Certificate Schemas ──────────────────────────────────────────────────────

  describe('certificateIdParam', () => {
    it('should accept valid certificateId', () => {
      expect(
        certificateIdParam.safeParse({ certificateId: 'uuid-123' }).success
      ).toBe(true);
    });

    it('should reject empty certificateId', () => {
      expect(certificateIdParam.safeParse({ certificateId: '' }).success).toBe(
        false
      );
    });

    it('should reject missing certificateId', () => {
      expect(certificateIdParam.safeParse({}).success).toBe(false);
    });
  });

  describe('generateCertificateBody', () => {
    it('should accept valid courseId', () => {
      expect(
        generateCertificateBody.safeParse({ courseId: 'course-abc' }).success
      ).toBe(true);
    });

    it('should reject empty courseId', () => {
      expect(generateCertificateBody.safeParse({ courseId: '' }).success).toBe(
        false
      );
    });

    it('should reject missing courseId', () => {
      expect(generateCertificateBody.safeParse({}).success).toBe(false);
    });
  });

  // ─── Analytics Schemas ──────────────────────────────────────────────────────

  describe('teacherIdParam', () => {
    it('should accept valid teacherId', () => {
      expect(
        teacherIdParam.safeParse({ teacherId: 'teacher-123' }).success
      ).toBe(true);
    });

    it('should reject empty teacherId', () => {
      expect(teacherIdParam.safeParse({ teacherId: '' }).success).toBe(false);
    });

    it('should reject missing teacherId', () => {
      expect(teacherIdParam.safeParse({}).success).toBe(false);
    });
  });

  describe('teacherCourseParams', () => {
    it('should accept valid teacherId and courseId', () => {
      const result = teacherCourseParams.safeParse({
        teacherId: 'teacher-123',
        courseId: 'course-abc',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing courseId', () => {
      const result = teacherCourseParams.safeParse({
        teacherId: 'teacher-123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing teacherId', () => {
      const result = teacherCourseParams.safeParse({
        courseId: 'course-abc',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty strings', () => {
      const result = teacherCourseParams.safeParse({
        teacherId: '',
        courseId: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── Notification Schemas ────────────────────────────────────────────────────

  describe('notificationIdParam', () => {
    it('should accept valid userId and notificationId', () => {
      const result = notificationIdParam.safeParse({
        userId: 'user-123',
        notificationId: 'notif-abc',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing notificationId', () => {
      const result = notificationIdParam.safeParse({
        userId: 'user-123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty notificationId', () => {
      const result = notificationIdParam.safeParse({
        userId: 'user-123',
        notificationId: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sendTestEmailBody', () => {
    it('should accept valid template', () => {
      expect(sendTestEmailBody.safeParse({ template: 'welcome' }).success).toBe(
        true
      );
    });

    it('should accept empty body (all optional)', () => {
      expect(sendTestEmailBody.safeParse({}).success).toBe(true);
    });

    it('should reject invalid template', () => {
      expect(
        sendTestEmailBody.safeParse({ template: 'invalid_type' }).success
      ).toBe(false);
    });

    it('should accept valid email', () => {
      expect(
        sendTestEmailBody.safeParse({ email: 'test@example.com' }).success
      ).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(
        sendTestEmailBody.safeParse({ email: 'not-an-email' }).success
      ).toBe(false);
    });
  });

  describe('notificationsQuery', () => {
    it('should accept valid page and limit', () => {
      expect(
        notificationsQuery.safeParse({ page: '1', limit: '20' }).success
      ).toBe(true);
    });

    it('should accept empty query (all optional)', () => {
      expect(notificationsQuery.safeParse({}).success).toBe(true);
    });

    it('should reject limit above 50', () => {
      expect(notificationsQuery.safeParse({ limit: '100' }).success).toBe(
        false
      );
    });

    it('should reject page of 0', () => {
      expect(notificationsQuery.safeParse({ page: '0' }).success).toBe(false);
    });
  });

  // ─── Coupon Schemas ──────────────────────────────────────────────────────────

  describe('createCouponBody', () => {
    const validCoupon = {
      code: 'SUMMER2026',
      discountType: 'percentage',
      discountValue: 20,
      validFrom: '2026-06-01T00:00:00Z',
      validUntil: '2026-08-31T23:59:59Z',
      createdBy: 'user_123',
    };

    it('should accept valid coupon', () => {
      expect(createCouponBody.safeParse(validCoupon).success).toBe(true);
    });

    it('should accept valid coupon with optional fields', () => {
      const result = createCouponBody.safeParse({
        ...validCoupon,
        usageLimit: 100,
        courseIds: ['course1', 'course2'],
        minPurchase: 999,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty code', () => {
      expect(
        createCouponBody.safeParse({ ...validCoupon, code: '' }).success
      ).toBe(false);
    });

    it('should reject code with spaces', () => {
      expect(
        createCouponBody.safeParse({ ...validCoupon, code: 'INVALID CODE' })
          .success
      ).toBe(false);
    });

    it('should reject code shorter than 3 chars', () => {
      expect(
        createCouponBody.safeParse({ ...validCoupon, code: 'AB' }).success
      ).toBe(false);
    });

    it('should reject invalid discountType', () => {
      expect(
        createCouponBody.safeParse({
          ...validCoupon,
          discountType: 'invalid',
        }).success
      ).toBe(false);
    });

    it('should reject negative discountValue', () => {
      expect(
        createCouponBody.safeParse({ ...validCoupon, discountValue: -5 })
          .success
      ).toBe(false);
    });

    it('should reject missing createdBy', () => {
      const { createdBy, ...noCb } = validCoupon;
      expect(createCouponBody.safeParse(noCb).success).toBe(false);
    });

    it('should accept fixed discountType', () => {
      expect(
        createCouponBody.safeParse({
          ...validCoupon,
          discountType: 'fixed',
          discountValue: 500,
        }).success
      ).toBe(true);
    });
  });

  describe('updateCouponBody', () => {
    it('should accept partial update', () => {
      expect(updateCouponBody.safeParse({ discountValue: 30 }).success).toBe(
        true
      );
    });

    it('should accept empty body', () => {
      expect(updateCouponBody.safeParse({}).success).toBe(true);
    });

    it('should accept isActive toggle', () => {
      expect(updateCouponBody.safeParse({ isActive: false }).success).toBe(
        true
      );
    });

    it('should reject invalid discountType', () => {
      expect(
        updateCouponBody.safeParse({ discountType: 'bogus' }).success
      ).toBe(false);
    });
  });

  describe('validateCouponParams', () => {
    it('should accept valid code', () => {
      expect(validateCouponParams.safeParse({ code: 'SAVE20' }).success).toBe(
        true
      );
    });

    it('should reject empty code', () => {
      expect(validateCouponParams.safeParse({ code: '' }).success).toBe(false);
    });
  });

  describe('validateCouponQuery', () => {
    it('should accept empty query', () => {
      expect(validateCouponQuery.safeParse({}).success).toBe(true);
    });

    it('should accept courseId and amount', () => {
      expect(
        validateCouponQuery.safeParse({ courseId: 'c1', amount: '4999' })
          .success
      ).toBe(true);
    });

    it('should reject negative amount', () => {
      expect(validateCouponQuery.safeParse({ amount: '-1' }).success).toBe(
        false
      );
    });
  });

  describe('couponIdParam', () => {
    it('should accept valid couponId', () => {
      expect(couponIdParam.safeParse({ couponId: 'abc123' }).success).toBe(
        true
      );
    });

    it('should reject empty couponId', () => {
      expect(couponIdParam.safeParse({ couponId: '' }).success).toBe(false);
    });
  });

  // ─── Discussion Schemas ──────────────────────────────────────────────────────

  describe('discussionIdParam', () => {
    it('should accept valid discussionId', () => {
      expect(
        discussionIdParam.safeParse({ discussionId: 'disc-123' }).success
      ).toBe(true);
    });

    it('should reject empty discussionId', () => {
      expect(discussionIdParam.safeParse({ discussionId: '' }).success).toBe(
        false
      );
    });
  });

  describe('replyIdParam', () => {
    it('should accept valid replyId', () => {
      expect(replyIdParam.safeParse({ replyId: 'rep-456' }).success).toBe(true);
    });

    it('should reject empty replyId', () => {
      expect(replyIdParam.safeParse({ replyId: '' }).success).toBe(false);
    });
  });

  describe('getDiscussionsQuery', () => {
    it('should accept empty query', () => {
      expect(getDiscussionsQuery.safeParse({}).success).toBe(true);
    });

    it('should accept all valid params', () => {
      expect(
        getDiscussionsQuery.safeParse({
          chapterId: 'ch1',
          search: 'hello',
          sort: 'popular',
          page: '2',
          limit: '10',
        }).success
      ).toBe(true);
    });

    it('should reject invalid sort value', () => {
      expect(getDiscussionsQuery.safeParse({ sort: 'invalid' }).success).toBe(
        false
      );
    });

    it('should reject page less than 1', () => {
      expect(getDiscussionsQuery.safeParse({ page: '0' }).success).toBe(false);
    });

    it('should reject limit greater than 50', () => {
      expect(getDiscussionsQuery.safeParse({ limit: '51' }).success).toBe(
        false
      );
    });

    it('should reject search longer than 200 chars', () => {
      expect(
        getDiscussionsQuery.safeParse({ search: 'a'.repeat(201) }).success
      ).toBe(false);
    });
  });

  describe('createDiscussionBody', () => {
    it('should accept valid discussion', () => {
      expect(
        createDiscussionBody.safeParse({
          title: 'Question about module 3',
          content: 'I am confused about...',
        }).success
      ).toBe(true);
    });

    it('should accept discussion with optional chapterId', () => {
      expect(
        createDiscussionBody.safeParse({
          title: 'Chapter discussion',
          content: 'Related to chapter...',
          chapterId: 'ch-1',
        }).success
      ).toBe(true);
    });

    it('should reject empty title', () => {
      expect(
        createDiscussionBody.safeParse({
          title: '',
          content: 'some content',
        }).success
      ).toBe(false);
    });

    it('should reject empty content', () => {
      expect(
        createDiscussionBody.safeParse({
          title: 'A title',
          content: '',
        }).success
      ).toBe(false);
    });

    it('should reject title longer than 200 chars', () => {
      expect(
        createDiscussionBody.safeParse({
          title: 'x'.repeat(201),
          content: 'some content',
        }).success
      ).toBe(false);
    });

    it('should reject content longer than 5000 chars', () => {
      expect(
        createDiscussionBody.safeParse({
          title: 'A title',
          content: 'x'.repeat(5001),
        }).success
      ).toBe(false);
    });
  });

  describe('createReplyBody', () => {
    it('should accept valid reply', () => {
      expect(
        createReplyBody.safeParse({ content: 'Great question!' }).success
      ).toBe(true);
    });

    it('should reject empty content', () => {
      expect(createReplyBody.safeParse({ content: '' }).success).toBe(false);
    });

    it('should reject content longer than 3000 chars', () => {
      expect(
        createReplyBody.safeParse({ content: 'y'.repeat(3001) }).success
      ).toBe(false);
    });
  });
});
