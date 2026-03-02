import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clerkClient } from '..';
import logger from '../config/logger';
import Course from '../models/courseModel';
import { Discussion, Reply } from '../models/discussionModel';

/**
 * List discussions for a course
 * GET /discussions/course/:courseId
 */
export const getDiscussions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { chapterId, search, sort, page = '1', limit = '20' } = req.query;

  try {
    const filter: Record<string, unknown> = { courseId };

    if (chapterId) {
      filter.chapterId = chapterId;
    }

    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit as string, 10) || 20)
    );
    const skip = (pageNum - 1) * limitNum;

    let sortOption: Record<string, 1 | -1> = { isPinned: -1, createdAt: -1 };
    if (sort === 'oldest') {
      sortOption = { isPinned: -1, createdAt: 1 };
    } else if (sort === 'popular') {
      sortOption = { isPinned: -1, upvotes: -1, createdAt: -1 };
    }

    const [discussions, total] = await Promise.all([
      Discussion.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Discussion.countDocuments(filter),
    ]);

    res.status(200).json({
      message: 'Discussions retrieved successfully',
      data: discussions,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    logger.error('Error fetching discussions', { courseId, error });
    res.status(500).json({
      message: 'Error retrieving discussions',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Create a new discussion
 * POST /discussions/course/:courseId
 */
export const createDiscussion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { title, content, chapterId } = req.body;
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    // Validate course exists
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    // Get user info for display name
    const user = await clerkClient.users.getUser(userId);
    const userName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Anonymous';

    const isInstructorPost = course.teacherId === userId;

    const discussion = new Discussion({
      discussionId: uuidv4(),
      courseId,
      chapterId: chapterId || undefined,
      userId,
      userName,
      title,
      content,
      isInstructorPost,
    });

    await discussion.save();

    logger.info('Discussion created', {
      discussionId: discussion.discussionId,
      courseId,
      userId,
    });

    res.status(201).json({
      message: 'Discussion created successfully',
      data: discussion,
    });
  } catch (error) {
    logger.error('Error creating discussion', { courseId, userId, error });
    res.status(500).json({
      message: 'Error creating discussion',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Get a single discussion with its replies
 * GET /discussions/:discussionId
 */
export const getDiscussion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { discussionId } = req.params;

  try {
    const discussion = await Discussion.findOne({ discussionId });
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }

    const replies = await Reply.find({ discussionId }).sort({ createdAt: 1 });

    res.status(200).json({
      message: 'Discussion retrieved successfully',
      data: { ...discussion.toObject(), replies },
    });
  } catch (error) {
    logger.error('Error fetching discussion', { discussionId, error });
    res.status(500).json({
      message: 'Error retrieving discussion',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Create a reply on a discussion
 * POST /discussions/:discussionId/replies
 */
export const createReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { discussionId } = req.params;
  const { content } = req.body;
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const discussion = await Discussion.findOne({ discussionId });
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }

    // Get user info
    const user = await clerkClient.users.getUser(userId);
    const userName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Anonymous';

    // Check if user is the course instructor
    const course = await Course.findOne({ courseId: discussion.courseId });
    const isInstructorReply = course?.teacherId === userId;

    const reply = new Reply({
      replyId: uuidv4(),
      discussionId,
      userId,
      userName,
      content,
      isInstructorReply,
    });

    await reply.save();

    // Increment reply count
    await Discussion.updateOne({ discussionId }, { $inc: { replyCount: 1 } });

    logger.info('Reply created', {
      replyId: reply.replyId,
      discussionId,
      userId,
    });

    res.status(201).json({
      message: 'Reply created successfully',
      data: reply,
    });
  } catch (error) {
    logger.error('Error creating reply', { discussionId, userId, error });
    res.status(500).json({
      message: 'Error creating reply',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Upvote a discussion (toggle)
 * PUT /discussions/:discussionId/upvote
 */
export const upvoteDiscussion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { discussionId } = req.params;

  try {
    const discussion = await Discussion.findOneAndUpdate(
      { discussionId },
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }

    res.status(200).json({
      message: 'Discussion upvoted successfully',
      data: discussion,
    });
  } catch (error) {
    logger.error('Error upvoting discussion', { discussionId, error });
    res.status(500).json({
      message: 'Error upvoting discussion',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Upvote a reply
 * PUT /discussions/replies/:replyId/upvote
 */
export const upvoteReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { replyId } = req.params;

  try {
    const reply = await Reply.findOneAndUpdate(
      { replyId },
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (!reply) {
      res.status(404).json({ message: 'Reply not found' });
      return;
    }

    res.status(200).json({
      message: 'Reply upvoted successfully',
      data: reply,
    });
  } catch (error) {
    logger.error('Error upvoting reply', { replyId, error });
    res.status(500).json({
      message: 'Error upvoting reply',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Pin/unpin a discussion (instructor only)
 * PUT /discussions/:discussionId/pin
 */
export const pinDiscussion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { discussionId } = req.params;
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const discussion = await Discussion.findOne({ discussionId });
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }

    // Verify user is the course instructor
    const course = await Course.findOne({ courseId: discussion.courseId });
    if (!course || course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: 'Only the course instructor can pin discussions' });
      return;
    }

    discussion.isPinned = !discussion.isPinned;
    await discussion.save();

    logger.info('AUDIT: Discussion pin toggled', {
      discussionId,
      isPinned: discussion.isPinned,
      userId,
    });

    res.status(200).json({
      message: `Discussion ${discussion.isPinned ? 'pinned' : 'unpinned'} successfully`,
      data: discussion,
    });
  } catch (error) {
    logger.error('Error pinning discussion', { discussionId, error });
    res.status(500).json({
      message: 'Error pinning discussion',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Delete a discussion and its replies (owner or instructor)
 * DELETE /discussions/:discussionId
 */
export const deleteDiscussion = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { discussionId } = req.params;
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const discussion = await Discussion.findOne({ discussionId });
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }

    // Only owner or course instructor can delete
    const course = await Course.findOne({ courseId: discussion.courseId });
    if (discussion.userId !== userId && course?.teacherId !== userId) {
      res
        .status(403)
        .json({ message: 'Not authorized to delete this discussion' });
      return;
    }

    // Delete all replies first, then the discussion
    await Reply.deleteMany({ discussionId });
    await Discussion.deleteOne({ discussionId });

    logger.info('AUDIT: Discussion deleted', { discussionId, userId });

    res.status(200).json({
      message: 'Discussion deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting discussion', { discussionId, error });
    res.status(500).json({
      message: 'Error deleting discussion',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Delete a reply (owner or instructor)
 * DELETE /discussions/replies/:replyId
 */
export const deleteReply = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { replyId } = req.params;
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const reply = await Reply.findOne({ replyId });
    if (!reply) {
      res.status(404).json({ message: 'Reply not found' });
      return;
    }

    // Check authorization: owner or instructor
    const discussion = await Discussion.findOne({
      discussionId: reply.discussionId,
    });
    const course = discussion
      ? await Course.findOne({ courseId: discussion.courseId })
      : null;

    if (reply.userId !== userId && course?.teacherId !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this reply' });
      return;
    }

    await Reply.deleteOne({ replyId });

    // Decrement reply count
    if (discussion) {
      await Discussion.updateOne(
        { discussionId: reply.discussionId },
        { $inc: { replyCount: -1 } }
      );
    }

    logger.info('AUDIT: Reply deleted', { replyId, userId });

    res.status(200).json({
      message: 'Reply deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting reply', { replyId, error });
    res.status(500).json({
      message: 'Error deleting reply',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
