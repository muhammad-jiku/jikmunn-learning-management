import { requireAuth } from '@clerk/express';
import express from 'express';
import {
  addReview,
  deleteReview,
  getCourseRatingSummary,
  getCourseReviews,
  markReviewHelpful,
  updateReview,
} from '../controllers/reviewControllers';
import {
  addReviewBody,
  courseIdParam,
  getCourseReviewsQuery,
  reviewIdParam,
  updateReviewBody,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

// Course reviews
router
  .route('/courses/:courseId/reviews')
  .get(
    validateRequest({ params: courseIdParam, query: getCourseReviewsQuery }),
    getCourseReviews
  )
  .post(
    requireAuth(),
    validateRequest({ params: courseIdParam, body: addReviewBody }),
    addReview
  );

// Course rating summary (lightweight)
router
  .route('/courses/:courseId/rating')
  .get(validateRequest({ params: courseIdParam }), getCourseRatingSummary);

// Individual review operations
router
  .route('/:reviewId')
  .put(
    requireAuth(),
    validateRequest({ params: reviewIdParam, body: updateReviewBody }),
    updateReview
  )
  .delete(
    requireAuth(),
    validateRequest({ params: reviewIdParam }),
    deleteReview
  );

// Mark review as helpful
router
  .route('/:reviewId/helpful')
  .put(
    requireAuth(),
    validateRequest({ params: reviewIdParam }),
    markReviewHelpful
  );

export default router;
