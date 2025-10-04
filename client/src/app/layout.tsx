import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import './globals.css';
import Providers from './providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Learn Now — Master Your Skills Faster!',
  description:
    'Curated courses, personalized learning paths, and progress tracking to help you learn efficiently and confidently.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en' suppressHydrationWarning>
        <body className={`${dmSans.className}`} suppressHydrationWarning>
          <Providers>
            <Suspense fallback={null}>
              <div className='root-layout'>{children}</div>
            </Suspense>
            <Toaster richColors closeButton />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
