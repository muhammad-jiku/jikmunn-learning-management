'use client';

import ChaptersSidebar from '@/components/course/ChaptersSidebar';
import AppSidebar from '@/components/shared/AppSidebar';
import Loading from '@/components/shared/Loading';
import Navbar from '@/components/shared/Navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const isCoursePage = useMemo(
    () => /^\/student\/courses\/[^/]+(?:\/chapters\/[^/]+)?$/.test(pathname),
    [pathname]
  );

  const courseId = useMemo(() => {
    if (isCoursePage) {
      const match = pathname.match(/\/student\/courses\/([^/]+)/);
      return match ? match[1] : null;
    }
    return null;
  }, [isCoursePage, pathname]);

  if (!isLoaded) return <Loading />;
  if (!user) return <div>Please sign in to access this page.</div>;

  return (
    <SidebarProvider>
      <div className='dashboard'>
        <AppSidebar />
        <div className='dashboard__content'>
          {courseId && <ChaptersSidebar />}
          <div
            className={cn(
              'dashboard__main',
              isCoursePage && 'dashboard__main--not-course'
            )}
            style={{ height: '100vh' }}
          >
            <Navbar isCoursePage={isCoursePage} />
            <main className='dashboard__body'>{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
