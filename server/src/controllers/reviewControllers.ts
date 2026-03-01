/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clerkClient } from '..';
import logger from '../config/logger';
import Review from '../models/reviewModel';

/**
 * Get all reviews for a course with rating summary
 */
export const getCourseReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { rating, sort } = req.query;

  try {
    const filter: any = { courseId };

    // Filter by rating
    if (rating) {
      filter.rating = Number(rating);
    }

    // Sort options
    let sortOption: any = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
    if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpful: -1, createdAt: -1 };

    const reviews = await Review.find(filter).sort(sortOption).lean();

    // Calculate summary
    const allReviews = await Review.find({ courseId }).lean();
    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) *
              10
          ) / 10
        : 0;

    // Rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    res.status(200).json({
      message: 'Reviews retrieved successfully',
      data: {
        reviews,
        summary: {
          averageRating,
          totalReviews,
          distribution,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching reviews', { courseId, error });
    res.status(500).json({
      message: 'Error retrieving reviews',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Get rating summary for a course (lightweight)
 */
export const getCourseRatingSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;

  try {
    const reviews = await Review.find({ courseId }).lean();
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
          ) / 10
        : 0;

    res.status(200).json({
      message: 'Rating summary retrieved successfully',
      data: {
        averageRating,
        reviewCount: totalReviews,
      },
    });
  } catch (error) {
    logger.error('Error fetching rating summary', { courseId, error });
    res.status(500).json({
      message: 'Error retrieving rating summary',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Add a review for a course (enrolled users only, one per user)
 */
export const addReview = async (req: Request, res: Response): Promise<void> => {
  const courseId = req.params.courseId as string;
  const { userId } = getAuth(req);
  const { rating, comment } = req.body;

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' });
      return;
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ courseId, userId });
    if (existingReview) {
      res
        .status(409)
        .json({ message: 'You have already reviewed this course' });
      return;
    }

    // Get user name from Clerk
    let userName = 'Anonymous';
    try {
      const user = await clerkClient.users.getUser(userId);
      userName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.username ||
        'Anonymous';
    } catch {
      // Use default name if Clerk lookup fails
    }

    const review = await Review.create({
      reviewId: uuidv4(),
      courseId,
      userId,
      userName,
      rating: Math.round(rating),
      comment: comment?.trim() || undefined,
      helpful: 0,
    });

    logger.info('AUDIT: Review added', {
      reviewId: review.reviewId,
      courseId,
      userId,
      rating,
    });

    res.status(201).json({
      message: 'Review added successfully',
      data: review,
    });
  } catch (error) {
    logger.error('Error adding review', { courseId, error });
    res.status(500).json({
      message: 'Error adding review',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Update own review
 */
export const updateReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reviewId } = req.params;
  const { userId } = getAuth(req);
  const { rating, comment } = req.body;

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const review = await Review.findOne({ reviewId });
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    if (review.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to edit this review' });
      return;
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        res.status(400).json({ message: 'Rating must be between 1 and 5' });
        return;
      }
      review.rating = Math.round(rating);
    }

    if (comment !== undefined) {
      review.comment = comment?.trim() || undefined;
    }

    await review.save();

    res.status(200).json({
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    logger.error('Error updating review', { reviewId, error });
    res.status(500).json({
      message: 'Error updating review',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Delete own review (or course teacher can delete)
 */
export const deleteReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reviewId } = req.params;
  const { userId } = getAuth(req);

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const review = await Review.findOne({ reviewId });
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    if (review.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this review' });
      return;
    }

    await Review.deleteOne({ reviewId });

    logger.info('AUDIT: Review deleted', { reviewId, deletedBy: userId });

    res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting review', { reviewId, error });
    res.status(500).json({
      message: 'Error deleting review',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Mark a review as helpful (increment helpful count)
 */
export const markReviewHelpful = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { reviewId } = req.params;
  const { userId } = getAuth(req);

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const review = await Review.findOne({ reviewId });
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Don't allow marking own review as helpful
    if (review.userId === userId) {
      res
        .status(400)
        .json({ message: 'Cannot mark your own review as helpful' });
      return;
    }

    review.helpful = (review.helpful || 0) + 1;
    await review.save();

    res.status(200).json({
      message: 'Review marked as helpful',
      data: review,
    });
  } catch (error) {
    logger.error('Error marking review helpful', { reviewId, error });
    res.status(500).json({
      message: 'Error marking review as helpful',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
