'use client';

import StarRating from '@/components/course/StarRating';
import { useGetCourseRatingSummaryQuery } from '@/state/api';

interface CourseRatingBadgeProps {
  courseId: string;
  size?: 'sm' | 'md';
}

const CourseRatingBadge = ({
  courseId,
  size = 'sm',
}: CourseRatingBadgeProps) => {
  const { data } = useGetCourseRatingSummaryQuery(courseId, {
    skip: !courseId,
  });

  if (!data || data.reviewCount === 0) return null;

  return (
    <div className='flex items-center gap-1'>
      <StarRating rating={data.averageRating} size={size} />
      <span className='text-xs text-customgreys-dirty-grey'>
        {data.averageRating.toFixed(1)} ({data.reviewCount})
      </span>
    </div>
  );
};

export default CourseRatingBadge;
