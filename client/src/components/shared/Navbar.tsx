'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useGetUnreadCountQuery } from '@/state/api';
import { UserButton, useUser } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Bell, BookOpen } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ isCoursePage }: { isCoursePage: boolean }) => {
  const { user } = useUser();
  const { theme } = useTheme();
  const userRole = user?.publicMetadata?.userType as 'student' | 'teacher';

  const { data: unreadData } = useGetUnreadCountQuery(user?.id ?? '', {
    skip: !user,
    pollingInterval: 60000, // poll every 60s for live badge
  });

  const unreadCount = unreadData?.unreadCount || 0;
  const notificationsHref =
    userRole === 'teacher'
      ? '/teacher/notifications'
      : '/student/notifications';

  return (
    <nav className='dashboard-navbar'>
      <div className='dashboard-navbar__container'>
        <div className='dashboard-navbar__search'>
          <div className='md:hidden'>
            <SidebarTrigger className='dashboard-navbar__sidebar-trigger' />
          </div>

          <div className='flex items-center gap-4'>
            <div className='relative group'>
              <Link
                href='/search'
                className={cn('dashboard-navbar__search-input', {
                  '!bg-customgreys-secondarybg': isCoursePage,
                })}
                scroll={false}
              >
                <span className='hidden sm:inline'>Search Courses</span>
                <span className='sm:hidden'>Search</span>
              </Link>
              <BookOpen className='dashboard-navbar__search-icon' size={18} />
            </div>
          </div>
        </div>

        <div className='dashboard-navbar__actions'>
          <ThemeToggle />

          <Link
            href={notificationsHref}
            className='nondashboard-navbar__notification-button relative'
          >
            {unreadCount > 0 && (
              <span className='absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-700 px-1 text-[10px] font-bold text-white'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <Bell className='nondashboard-navbar__notification-icon' />
          </Link>

          <UserButton
            appearance={{
              baseTheme: theme === 'dark' ? dark : undefined,
              elements: {
                userButtonOuterIdentifier: 'text-customgreys-dirty-grey',
                userButtonBox: 'scale-90 sm:scale-100',
              },
            }}
            showName={true}
            userProfileMode='navigation'
            userProfileUrl={
              userRole === 'teacher' ? '/teacher/profile' : '/student/profile'
            }
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
