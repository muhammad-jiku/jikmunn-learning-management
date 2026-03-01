'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const StarRating = ({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  return (
    <div className='flex items-center gap-1'>
      <div className='flex'>
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const filled = displayRating >= starValue;
          const halfFilled = !filled && displayRating >= starValue - 0.5;

          return (
            <button
              key={i}
              type='button'
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive
                  ? 'cursor-pointer transition-transform hover:scale-110'
                  : 'cursor-default'
              }`}
            >
              <Star
                className={`${sizeMap[size]} ${
                  filled
                    ? 'fill-yellow-400 text-yellow-400'
                    : halfFilled
                      ? 'fill-yellow-400/50 text-yellow-400'
                      : 'fill-none text-gray-500'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className='ml-1 text-sm text-customgreys-dirty-grey'>
          {rating > 0 ? rating.toFixed(1) : ''}
        </span>
      )}
    </div>
  );
};

export default StarRating;
