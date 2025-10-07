/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import TeacherCourseCard from '@/components/course/TeacherCourseCard';
import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import Toolbar from '@/components/shared/Toolbar';
import { Button } from '@/components/ui/button';
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useGetCoursesQuery,
} from '@/state/api';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const Courses = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const {
    data: courses,
    isLoading,
    isError,
  } = useGetCoursesQuery({ category: 'all' });

  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    return courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || course.category === selectedCategory;
      return matchesSearch && matchesCategory && course.teacherId === user?.id;
    });
  }, [courses, searchTerm, selectedCategory, user?.id]);

  const handleEdit = (course: Course) => {
    router.push(`/teacher/courses/${course.courseId}`, {
      scroll: false,
    });
  };

  const handleDelete = async (course: Course) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(course.courseId).unwrap();
        toast.success('Course deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete course:', error);
        const errorMessage = error?.data?.message || 'Failed to delete course';
        toast.error(errorMessage);
      }
    }
  };

  const handleCreateCourse = async () => {
    if (!user || !isLoaded) {
      toast.error('User information not available');
      return;
    }

    // console.log('Creating course with authenticated user:', user.id);

    try {
      // Send empty object since backend gets teacher info from auth
      const result = await createCourse().unwrap();
      // const result = await createCourse( {} ).unwrap();
      // const result = await createCourse({
      //   teacherId: '',
      //   teacherName: '',
      // }).unwrap();

      toast.success('Course created successfully!');
      router.push(`/teacher/courses/${result.courseId}`, {
        scroll: false,
      });
    } catch (error: any) {
      console.error('Failed to create course:', error);
      const errorMessage = error?.data?.message || 'Failed to create course';
      toast.error(errorMessage);
    }
  };

  if (!isLoaded || isLoading) return <Loading />;
  if (isError) return <div>Error loading courses.</div>;

  return (
    <div className='teacher-courses'>
      <Header
        title='Courses'
        subtitle='Browse your courses'
        rightElement={
          <Button
            onClick={handleCreateCourse}
            className='teacher-courses__header'
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Course'}
          </Button>
        }
      />
      <Toolbar
        onSearch={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />
      <div className='teacher-courses__grid'>
        {filteredCourses.length === 0 ? (
          <div className='teacher-courses__empty'>
            <p>
              No courses found.{' '}
              {filteredCourses.length === 0 && courses!.length > 0
                ? "You don't own any courses in this category."
                : 'Create your first course to get started.'}
            </p>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <TeacherCourseCard
              key={course.courseId}
              course={course}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isOwner={course.teacherId === user?.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Courses;
