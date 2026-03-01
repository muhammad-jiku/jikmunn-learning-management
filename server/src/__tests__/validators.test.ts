import {
  addCommentBody,
  addReviewBody,
  chapterParams,
  courseIdParam,
  createTransactionBody,
  getCourseReviewsQuery,
  submitQuizBody,
  updateCourseBody,
  updateReviewBody,
  updateUserBody,
  upsertQuizBody,
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
});
