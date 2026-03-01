'use client';

import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { useGetTeacherOverviewQuery } from '@/state/api';
import { useUser } from '@clerk/nextjs';
import {
  Award,
  BookOpen,
  DollarSign,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const EnrollmentChart = dynamic(
  () => import('@/components/analytics/EnrollmentChart'),
  { ssr: false }
);
const RevenueChart = dynamic(
  () => import('@/components/analytics/RevenueChart'),
  { ssr: false }
);
const CoursePerformanceTable = dynamic(
  () => import('@/components/analytics/CoursePerformanceTable'),
  { ssr: false }
);

const TeacherAnalyticsPage = () => {
  const { user, isLoaded } = useUser();

  const {
    data: analytics,
    isLoading,
    isError,
  } = useGetTeacherOverviewQuery(user?.id ?? '', {
    skip: !isLoaded || !user,
  });

  if (!isLoaded || isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view analytics.</div>;
  if (isError || !analytics)
    return <div className='text-red-500'>Error loading analytics.</div>;

  const summaryCards = [
    {
      title: 'Total Students',
      value: analytics.totalStudents.toLocaleString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Total Revenue',
      value: formatPrice(analytics.totalRevenue),
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Total Courses',
      value: analytics.totalCourses.toString(),
      icon: BookOpen,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      title: 'Average Rating',
      value:
        analytics.averageRating > 0 ? `${analytics.averageRating} / 5` : 'N/A',
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
  ];

  return (
    <div className='analytics-page w-full'>
      <Header
        title='Analytics Dashboard'
        subtitle='Track your teaching performance and student engagement'
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

      {/* Charts Row */}
      <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card className='border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-white-100'>
              <TrendingUp className='h-5 w-5 text-blue-400' />
              Enrollments Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnrollmentChart data={analytics.enrollmentsTrend} />
          </CardContent>
        </Card>

        <Card className='border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-white-100'>
              <DollarSign className='h-5 w-5 text-green-400' />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={analytics.revenueTrend} />
          </CardContent>
        </Card>
      </div>

      {/* Course Performance Table */}
      <div className='mt-6'>
        <Card className='border-customgreys-dirtyGrey/30 bg-customgreys-secondarybg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-white-100'>
              <Award className='h-5 w-5 text-purple-400' />
              Course Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CoursePerformanceTable courses={analytics.coursePerformance} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherAnalyticsPage;
