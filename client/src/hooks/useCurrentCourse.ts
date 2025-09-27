import { useGetCourseQuery } from '@/state/api';
import { useSearchParams } from 'next/navigation';

export const useCurrentCourse = () => {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id') ?? '';
  console.log('Search params in useCurrentCourse hook:', searchParams);
  console.log('Current courseId in useCurrentCourse hook:', courseId);

  const { data: course, ...rest } = useGetCourseQuery(courseId);
  console.log('Current course data in useCurrentCourse hook:', course);
  console.log('Rest of the query state in useCurrentCourse hook:', rest);

  return { course, courseId, ...rest };
};
