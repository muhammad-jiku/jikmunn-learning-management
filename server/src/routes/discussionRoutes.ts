import { requireAuth } from '@clerk/express';
import express from 'express';
import {
  createDiscussion,
  createReply,
  deleteDiscussion,
  deleteReply,
  getDiscussion,
  getDiscussions,
  pinDiscussion,
  upvoteDiscussion,
  upvoteReply,
} from '../controllers/discussionControllers';
import {
  courseIdParam,
  createDiscussionBody,
  createReplyBody,
  discussionIdParam,
  getDiscussionsQuery,
  replyIdParam,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

// Course discussions: list & create
router
  .route('/course/:courseId')
  .get(
    validateRequest({ params: courseIdParam, query: getDiscussionsQuery }),
    getDiscussions
  )
  .post(
    requireAuth(),
    validateRequest({ params: courseIdParam, body: createDiscussionBody }),
    createDiscussion
  );

// Single discussion: get & delete
router
  .route('/:discussionId')
  .get(validateRequest({ params: discussionIdParam }), getDiscussion)
  .delete(
    requireAuth(),
    validateRequest({ params: discussionIdParam }),
    deleteDiscussion
  );

// Replies on a discussion
router
  .route('/:discussionId/replies')
  .post(
    requireAuth(),
    validateRequest({ params: discussionIdParam, body: createReplyBody }),
    createReply
  );

// Upvote discussion
router
  .route('/:discussionId/upvote')
  .put(
    requireAuth(),
    validateRequest({ params: discussionIdParam }),
    upvoteDiscussion
  );

// Pin/unpin discussion (instructor only)
router
  .route('/:discussionId/pin')
  .put(
    requireAuth(),
    validateRequest({ params: discussionIdParam }),
    pinDiscussion
  );

// Reply actions
router
  .route('/replies/:replyId/upvote')
  .put(requireAuth(), validateRequest({ params: replyIdParam }), upvoteReply);

router
  .route('/replies/:replyId')
  .delete(
    requireAuth(),
    validateRequest({ params: replyIdParam }),
    deleteReply
  );

export default router;
