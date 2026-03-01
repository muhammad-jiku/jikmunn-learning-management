'use client';

import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGetStudentAnalyticsQuery } from '@/state/api';
import { useUser } from '@clerk/nextjs';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const CategoryChart = dynamic(
  () => import('@/components/analytics/CategoryChart'),
  { ssr: false }
);

const StudentAnalyticsPage = () => {
  const { user, isLoaded } = useUser();

  const {
    data: analytics,
    isLoading,
    isError,
  } = useGetStudentAnalyticsQuery(user?.id ?? '', {
    skip: !isLoaded || !user,
  });

  if (!isLoaded || isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view analytics.</div>;
  if (isError || !analytics)
    return <div className='text-red-500'>Error loading analytics.</div>;

  const summaryCards = [
    {
      title: 'Enrolled Courses',
      value: analytics.totalCoursesEnrolled.toString(),
      icon: BookOpen,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Completed',
      value: analytics.completedCourses.toString(),
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'In Progress',
      value: analytics.inProgressCourses.toString(),
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      title: 'Certificates',
      value: analytics.certificatesEarned.toString(),
      icon: Award,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  return (
    <div className='analytics-page w-full'>
      <Header
        title='Learning Analytics'
        subtitle='Track your learning progress and achievements'
      />

      {/* Summary Cards */}
      <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {summaryCards.map((card) => (
          <Card
            key={card.title}
            className='border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg'
          >
            <CardContent className='flex items-center gap-4 p-5'>
              <div className={`rounded-lg p-3 ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className='text-sm text-customgreys-dirtyGrey'>
                  {card.title}
                </p>
                <p className='text-2xl font-bold text-white-100'>
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Progress + Category Distribution */}
      <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Overall Stats */}
        <Card className='border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-white-100'>
              <Target className='h-5 w-5 text-blue-400' />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-sm text-customgreys-dirtyGrey'>
                  Average Course Progress
                </span>
                <span className='text-sm font-medium text-white-100'>
                  {analytics.averageProgress}%
                </span>
              </div>
              <Progress value={analytics.averageProgress} className='h-3' />
            </div>

            <div className='grid grid-cols-2 gap-4 pt-2'>
              <div className='rounded-lg bg-customgreys-primarybg p-3'>
                <p className='text-xs text-customgreys-dirtyGrey'>
                  Chapters Completed
                </p>
                <p className='text-lg font-bold text-white-100'>
                  {analytics.totalChaptersCompleted}
                  <span className='text-sm font-normal text-customgreys-dirtyGrey'>
                    {' '}
                    / {analytics.totalChapters}
                  </span>
                </p>
              </div>
              <div className='rounded-lg bg-customgreys-primarybg p-3'>
                <p className='text-xs text-customgreys-dirtyGrey'>
                  Recent Activity
                </p>
                <p className='text-lg font-bold text-white-100'>
                  {analytics.recentActivityCount}
                  <span className='text-sm font-normal text-customgreys-dirtyGrey'>
                    {' '}
                    courses
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className='border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-white-100'>
              <BarChart3 className='h-5 w-5 text-purple-400' />
              Courses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.categoryDistribution.length > 0 ? (
              <CategoryChart data={analytics.categoryDistribution} />
            ) : (
              <p className='py-8 text-center text-sm text-customgreys-dirtyGrey'>
                No category data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Progress List */}
      <div className='mt-6'>
        <Card className='border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-white-100'>
              <BookOpen className='h-5 w-5 text-green-400' />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.courseProgress.length === 0 ? (
              <p className='py-8 text-center text-sm text-customgreys-dirtyGrey'>
                No enrolled courses yet.
              </p>
            ) : (
              <div className='space-y-4'>
                {analytics.courseProgress.map((course) => (
                  <div
                    key={course.courseId}
                    className='rounded-lg border border-customgreys-dirtyGrey/20 bg-customgreys-primarybg p-4'
                  >
                    <div className='mb-2 flex items-center justify-between'>
                      <div>
                        <h4 className='font-medium text-white-100'>
                          {course.title}
                        </h4>
                        <p className='text-xs text-customgreys-dirtyGrey'>
                          {course.category}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        {course.hasCertificate && (
                          <Award className='h-4 w-4 text-yellow-400' />
                        )}
                        <span className='text-sm font-medium text-white-100'>
                          {course.overallProgress}%
                        </span>
                      </div>
                    </div>
                    <Progress value={course.overallProgress} className='h-2' />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnalyticsPage;
