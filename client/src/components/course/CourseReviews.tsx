'use client';

import StarRating from '@/components/course/StarRating';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useAddReviewMutation,
  useDeleteReviewMutation,
  useGetCourseReviewsQuery,
  useMarkReviewHelpfulMutation,
  useUpdateReviewMutation,
} from '@/state/api';
import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Loader2, Send, ThumbsUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CourseReviewsProps {
  courseId: string;
}

const CourseReviews = ({ courseId }: CourseReviewsProps) => {
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterRating, setFilterRating] = useState<number | undefined>(
    undefined
  );

  // Review form state
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  const { data, isLoading } = useGetCourseReviewsQuery({
    courseId,
    rating: filterRating,
    sort: sortBy,
  });
  const [addReview, { isLoading: isAdding }] = useAddReviewMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const [markHelpful] = useMarkReviewHelpfulMutation();

  const reviews = data?.reviews || [];
  const summary = data?.summary;

  const userReview = reviews.find((r) => r.userId === user?.id);

  const handleAddReview = async () => {
    if (newRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      await addReview({
        courseId,
        rating: newRating,
        comment: newComment.trim() || undefined,
      }).unwrap();
      setNewRating(0);
      setNewComment('');
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleUpdateReview = async (reviewId: string) => {
    if (editRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      await updateReview({
        reviewId,
        courseId,
        rating: editRating,
        comment: editComment.trim() || undefined,
      }).unwrap();
      setEditingReviewId(null);
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return;
    await deleteReview({ reviewId, courseId });
  };

  const handleMarkHelpful = async (reviewId: string) => {
    await markHelpful({ reviewId, courseId });
  };

  const startEditing = (review: Review) => {
    setEditingReviewId(review.reviewId);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin text-primary-700' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Rating Summary */}
      {summary && summary.totalReviews > 0 && (
        <div className='flex flex-col gap-4 rounded-lg bg-customgreys-dark-grey p-4 sm:flex-row sm:items-center'>
          <div className='flex flex-col items-center'>
            <span className='text-3xl font-bold text-white-100'>
              {summary.averageRating.toFixed(1)}
            </span>
            <StarRating rating={summary.averageRating} size='md' />
            <span className='mt-1 text-xs text-customgreys-dirty-grey'>
              {summary.totalReviews} review
              {summary.totalReviews !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Rating Distribution */}
          <div className='flex-1 space-y-1'>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] || 0;
              const pct =
                summary.totalReviews > 0
                  ? (count / summary.totalReviews) * 100
                  : 0;

              return (
                <button
                  key={star}
                  onClick={() =>
                    setFilterRating(filterRating === star ? undefined : star)
                  }
                  className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-xs transition-colors ${
                    filterRating === star
                      ? 'bg-primary-700/20'
                      : 'hover:bg-customgreys-secondarybg'
                  }`}
                >
                  <span className='w-8 text-right text-customgreys-dirty-grey'>
                    {star} ★
                  </span>
                  <div className='h-2 flex-1 rounded-full bg-customgreys-secondarybg'>
                    <div
                      className='h-2 rounded-full bg-yellow-400 transition-all'
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className='w-6 text-left text-customgreys-dirty-grey'>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className='flex items-center gap-2'>
        <span className='text-sm text-customgreys-dirty-grey'>Sort by:</span>
        {[
          { value: 'newest', label: 'Newest' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'highest', label: 'Highest' },
          { value: 'lowest', label: 'Lowest' },
          { value: 'helpful', label: 'Most Helpful' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              sortBy === opt.value
                ? 'bg-primary-700 text-white-100'
                : 'bg-customgreys-dark-grey text-customgreys-dirty-grey hover:text-white-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {filterRating && (
          <button
            onClick={() => setFilterRating(undefined)}
            className='ml-2 text-xs text-primary-700 hover:text-primary-600'
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Add Review Form (only if user hasn't reviewed yet) */}
      {user && !userReview && (
        <Card className='border-customgreys-dark-grey'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-white-100'>
              Write a Review
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center gap-3'>
              <span className='text-sm text-customgreys-dirty-grey'>
                Your rating:
              </span>
              <StarRating
                rating={newRating}
                interactive
                onChange={setNewRating}
                size='lg'
              />
            </div>
            <div className='flex gap-2'>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder='Share your experience (optional)...'
                rows={3}
                className='flex-1 rounded-md border border-gray-600 bg-customgreys-darkGrey px-3 py-2 text-sm text-white-100 placeholder:text-gray-500 focus:border-primary-700 focus:outline-none'
              />
            </div>
            <div className='flex justify-end'>
              <Button
                onClick={handleAddReview}
                disabled={newRating === 0 || isAdding}
                className='bg-primary-700 hover:bg-primary-600'
              >
                {isAdding ? (
                  <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                ) : (
                  <Send className='mr-1 h-4 w-4' />
                )}
                Submit Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review List */}
      {reviews.length === 0 ? (
        <p className='py-8 text-center text-sm text-customgreys-dirty-grey'>
          No reviews yet. Be the first to review this course!
        </p>
      ) : (
        <div className='space-y-3'>
          {reviews.map((review) => (
            <Card
              key={review.reviewId}
              className={`border-customgreys-dark-grey ${
                review.userId === user?.id ? 'ring-1 ring-primary-700/30' : ''
              }`}
            >
              <CardContent className='py-4'>
                {editingReviewId === review.reviewId ? (
                  // Edit mode
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3'>
                      <span className='text-sm text-customgreys-dirty-grey'>
                        Rating:
                      </span>
                      <StarRating
                        rating={editRating}
                        interactive
                        onChange={setEditRating}
                        size='md'
                      />
                    </div>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={3}
                      className='w-full rounded-md border border-gray-600 bg-customgreys-darkGrey px-3 py-2 text-sm text-white-100 focus:border-primary-700 focus:outline-none'
                    />
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setEditingReviewId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => handleUpdateReview(review.reviewId)}
                        disabled={isUpdating}
                        className='bg-primary-700 hover:bg-primary-600'
                      >
                        {isUpdating ? (
                          <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                        ) : null}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className='flex gap-3'>
                    <Avatar className='h-8 w-8 shrink-0'>
                      <AvatarFallback className='bg-primary-700 text-xs text-white'>
                        {review.userName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium text-white-100'>
                            {review.userName}
                          </span>
                          <StarRating rating={review.rating} size='sm' />
                          <span className='text-xs text-gray-500'>
                            {formatDistanceToNow(new Date(review.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {review.userId === user?.id && (
                          <div className='flex gap-1'>
                            <button
                              onClick={() => startEditing(review)}
                              className='text-gray-500 transition-colors hover:text-primary-700'
                            >
                              <Edit className='h-4 w-4' />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteReview(review.reviewId)
                              }
                              className='text-gray-500 transition-colors hover:text-red-500'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </div>
                        )}
                      </div>
                      {review.comment && (
                        <p className='mt-2 text-sm text-gray-300'>
                          {review.comment}
                        </p>
                      )}
                      <div className='mt-2'>
                        <button
                          onClick={() => handleMarkHelpful(review.reviewId)}
                          disabled={review.userId === user?.id}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            review.userId === user?.id
                              ? 'cursor-default text-gray-600'
                              : 'text-gray-500 hover:text-primary-700'
                          }`}
                        >
                          <ThumbsUp className='h-3 w-3' />
                          {review.helpful > 0
                            ? `Helpful (${review.helpful})`
                            : 'Helpful'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseReviews;
