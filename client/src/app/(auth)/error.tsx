'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Authentication error:', error);
  }, [error]);

  return (
    <div className='auth-layout__main'>
      <div className='w-full max-w-sm rounded-lg bg-customgreys-secondarybg p-8 text-center'>
        <h2 className='mb-2 text-xl font-bold text-white-50'>
          Authentication Error
        </h2>
        <p className='mb-6 text-sm text-customgreys-dirty-grey'>
          {error.message || 'There was a problem with authentication.'}
        </p>
        <div className='flex justify-center gap-4'>
          <button
            onClick={reset}
            className='rounded-md bg-primary-700 px-6 py-2 text-sm font-medium text-white-100 transition hover:bg-primary-600'
          >
            Try Again
          </button>
          <Link
            href='/'
            className='rounded-md border border-customgreys-dirty-grey px-6 py-2 text-sm font-medium text-white-50 transition hover:bg-customgreys-darker-grey'
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
