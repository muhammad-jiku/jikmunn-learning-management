'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPrice } from '@/lib/utils';

interface CoursePerformanceTableProps {
  courses: CoursePerformance[];
}

const CoursePerformanceTable = ({ courses }: CoursePerformanceTableProps) => {
  if (!courses || courses.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-customgreys-dirtyGrey'>
        No course data available yet.
      </p>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow className='border-customgreys-dirtyGrey/30 hover:bg-transparent'>
            <TableHead className='text-customgreys-dirtyGrey'>Course</TableHead>
            <TableHead className='text-right text-customgreys-dirtyGrey'>
              Students
            </TableHead>
            <TableHead className='text-right text-customgreys-dirtyGrey'>
              Completion
            </TableHead>
            <TableHead className='text-right text-customgreys-dirtyGrey'>
              Avg Progress
            </TableHead>
            <TableHead className='text-right text-customgreys-dirtyGrey'>
              Revenue
            </TableHead>
            <TableHead className='text-right text-customgreys-dirtyGrey'>
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow
              key={course.courseId}
              className='border-customgreys-dirtyGrey/20 hover:bg-customgreys-primarybg/50'
            >
              <TableCell className='max-w-[200px] truncate font-medium text-white-100'>
                {course.title}
              </TableCell>
              <TableCell className='text-right text-white-100'>
                {course.enrollments.toLocaleString()}
              </TableCell>
              <TableCell className='text-right'>
                <span
                  className={
                    course.completionRate >= 75
                      ? 'text-green-400'
                      : course.completionRate >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }
                >
                  {course.completionRate}%
                </span>
              </TableCell>
              <TableCell className='text-right text-white-100'>
                {course.averageProgress}%
              </TableCell>
              <TableCell className='text-right text-green-400'>
                {formatPrice(course.revenue)}
              </TableCell>
              <TableCell className='text-right'>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    course.status === 'Published'
                      ? 'bg-green-400/10 text-green-400'
                      : 'bg-yellow-400/10 text-yellow-400'
                  }`}
                >
                  {course.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CoursePerformanceTable;
