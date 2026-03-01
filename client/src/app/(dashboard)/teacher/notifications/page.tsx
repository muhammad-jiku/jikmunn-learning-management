'use client';

import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useSendTestEmailMutation,
} from '@/state/api';
import { useUser } from '@clerk/nextjs';
import {
  Bell,
  BookOpen,
  CheckCircle,
  CheckCircle2,
  Mail,
  MailCheck,
  Send,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';

const notificationTypeIcons: Record<string, typeof Bell> = {
  welcome: Mail,
  enrollment_confirmation: BookOpen,
  course_completion: Trophy,
  progress_reminder: Bell,
  new_course: BookOpen,
};

const notificationTypeLabels: Record<string, string> = {
  welcome: 'Welcome',
  enrollment_confirmation: 'Enrollment',
  course_completion: 'Completion',
  progress_reminder: 'Reminder',
  new_course: 'New Course',
};

const statusColors: Record<string, string> = {
  sent: 'bg-blue-400/10 text-blue-400',
  logged: 'bg-blue-400/10 text-blue-400',
  read: 'bg-customgreys-dirtyGrey/20 text-customgreys-dirtyGrey',
  failed: 'bg-red-400/10 text-red-400',
  pending: 'bg-yellow-400/10 text-yellow-400',
};

const TeacherNotificationsPage = () => {
  const { user, isLoaded } = useUser();
  const [page, setPage] = useState(1);
  const [testTemplate, setTestTemplate] = useState<string>('welcome');

  const {
    data: notifData,
    isLoading,
    isError,
  } = useGetNotificationsQuery(
    { userId: user?.id ?? '', page, limit: 20 },
    { skip: !isLoaded || !user }
  );

  const { data: unreadData } = useGetUnreadCountQuery(user?.id ?? '', {
    skip: !isLoaded || !user,
  });

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [sendTest, { isLoading: isSending }] = useSendTestEmailMutation();

  if (!isLoaded || isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view notifications.</div>;
  if (isError)
    return <div className='text-red-500'>Error loading notifications.</div>;

  const notifications = notifData?.notifications || [];
  const pagination = notifData?.pagination;
  const unreadCount = unreadData?.unreadCount || 0;

  const handleMarkRead = async (notificationId: string) => {
    await markRead({ userId: user.id, notificationId });
  };

  const handleMarkAllRead = async () => {
    await markAllRead(user.id);
  };

  const handleSendTest = async () => {
    await sendTest({ userId: user.id, template: testTemplate });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className='notifications-page w-full px-4 py-2'>
      <div className='flex items-center justify-between'>
        <Header
          title='Notifications'
          subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        />
        {unreadCount > 0 && (
          <Button
            variant='outline'
            size='sm'
            onClick={handleMarkAllRead}
            className='border-customgreys-dirtyGrey/30 text-customgreys-dirtyGrey hover:text-white-100'
          >
            <MailCheck className='mr-2 h-4 w-4' />
            Mark all read
          </Button>
        )}
      </div>

      {/* Test Email Card */}
      <Card className='mt-6 border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm text-white-100'>
            <Send className='h-4 w-4 text-primary-500' />
            Send Test Email
          </CardTitle>
        </CardHeader>
        <CardContent className='flex items-center gap-3'>
          <Select value={testTemplate} onValueChange={setTestTemplate}>
            <SelectTrigger className='w-[200px] border-customgreys-dirtyGrey/30 bg-customgreys-primarybg text-white-100'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='border-customgreys-dirtyGrey/30 bg-customgreys-primarybg'>
              <SelectItem value='welcome'>Welcome</SelectItem>
              <SelectItem value='enrollment_confirmation'>
                Enrollment Confirmation
              </SelectItem>
              <SelectItem value='course_completion'>
                Course Completion
              </SelectItem>
              <SelectItem value='progress_reminder'>
                Progress Reminder
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            size='sm'
            onClick={handleSendTest}
            disabled={isSending}
            className='bg-primary-700 hover:bg-primary-600'
          >
            {isSending ? 'Sending...' : 'Send Test'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className='mt-8 rounded-xl border border-dashed border-customgreys-dirtyGrey/30 p-12 text-center'>
          <Bell className='mx-auto h-12 w-12 text-customgreys-dirtyGrey/50' />
          <p className='mt-4 text-customgreys-dirtyGrey'>
            No notifications yet. Send a test email above to get started.
          </p>
        </div>
      ) : (
        <div className='mt-6 space-y-3'>
          {notifications.map((notif) => {
            const Icon = notificationTypeIcons[notif.type] || Bell;
            const isUnread =
              notif.status === 'sent' || notif.status === 'logged';

            return (
              <Card
                key={notif._id}
                className={`border-customgreys-dirtyGrey/20 transition-colors ${
                  isUnread
                    ? 'border-l-4 border-l-primary-700 bg-customgreys-secondarybg'
                    : 'bg-customgreys-secondarybg/60'
                }`}
              >
                <CardContent className='flex items-start gap-4 p-4'>
                  <div
                    className={`rounded-lg p-2 ${
                      isUnread
                        ? 'bg-primary-700/10'
                        : 'bg-customgreys-primarybg'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isUnread
                          ? 'text-primary-500'
                          : 'text-customgreys-dirtyGrey'
                      }`}
                    />
                  </div>

                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[notif.status] || ''
                        }`}
                      >
                        {notificationTypeLabels[notif.type] || notif.type}
                      </span>
                      <span className='text-xs text-customgreys-dirtyGrey'>
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-sm ${
                        isUnread
                          ? 'font-medium text-white-100'
                          : 'text-customgreys-dirtyGrey'
                      }`}
                    >
                      {notif.subject}
                    </p>
                    <p className='mt-0.5 text-xs text-customgreys-dirtyGrey'>
                      Sent to {notif.recipient}
                    </p>
                  </div>

                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      className='shrink-0 text-customgreys-dirtyGrey transition-colors hover:text-white-100'
                      title='Mark as read'
                    >
                      <CheckCircle2 className='h-5 w-5' />
                    </button>
                  )}
                  {notif.status === 'read' && (
                    <CheckCircle className='h-5 w-5 shrink-0 text-green-400/50' />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='mt-6 flex items-center justify-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className='border-customgreys-dirtyGrey/30 text-customgreys-dirtyGrey'
          >
            Previous
          </Button>
          <span className='text-sm text-customgreys-dirtyGrey'>
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className='border-customgreys-dirtyGrey/30 text-customgreys-dirtyGrey'
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeacherNotificationsPage;
