'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className='dashboard__body flex min-h-[60vh] flex-col items-center justify-center'>
      <div className='w-full max-w-md rounded-lg bg-customgreys-secondarybg p-8 text-center'>
        <div className='mb-4 inline-flex items-center justify-center rounded-full bg-red-500/20 p-3'>
          <svg
            className='h-8 w-8 text-red-500'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        </div>
        <h2 className='mb-2 text-xl font-bold text-white-50'>
          Dashboard Error
        </h2>
        <p className='mb-6 text-sm text-customgreys-dirty-grey'>
          {error.message ||
            'Something went wrong loading this page. Please try again.'}
        </p>
        <button
          onClick={reset}
          className='rounded-md bg-primary-700 px-6 py-2 text-sm font-medium text-white-100 transition hover:bg-primary-600'
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
