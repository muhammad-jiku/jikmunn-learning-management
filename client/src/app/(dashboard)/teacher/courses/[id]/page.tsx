'use client';

import { CustomFormField } from '@/components/custom/CustomFormField';
import ChapterModal from '@/components/modal/ChapterModal';
import DroppableComponent from '@/components/modal/Droppable';
import SectionModal from '@/components/modal/SectionModal';
import Header from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { courseSchema } from '@/lib/schemas';
import
  {
    centsToDollars,
    createCourseFormData,
    uploadAllVideos,
  } from '@/lib/utils';
import { openSectionModal, setSections } from '@/state';
import
  {
    useGetCourseQuery,
    useGetUploadVideoUrlMutation,
    useUpdateCourseMutation,
  } from '@/state/api';
import { useAppDispatch, useAppSelector } from '@/state/redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const CourseEditor = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: course, isLoading, refetch } = useGetCourseQuery(id);

  const [updateCourse] = useUpdateCourseMutation();
  const [getUploadVideoUrl] = useGetUploadVideoUrlMutation();

  const dispatch = useAppDispatch();
  const { sections } = useAppSelector((state) => state.global.courseEditor);

  const methods = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseTitle: '',
      courseDescription: '',
      courseCategory: '',
      coursePrice: '0',
      courseStatus: false,
    },
  });

  useEffect(() => {
    if (course) {
      methods.reset({
        courseTitle: course.title,
        courseDescription: course.description,
        courseCategory: course.category,
        coursePrice: centsToDollars(course.price),
        courseStatus: course.status === 'Published',
      });
      dispatch(setSections(course.sections || []));
    }
  }, [course, methods]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: CourseFormData) => {
    try {
      // console.log('🚀 STARTING course update - Course ID:', id);

      let updatedSections = sections;

      try {
        console.log('📤 Starting video uploads...');
        const uploadResult = await uploadAllVideos(
          sections,
          id,
          getUploadVideoUrl
        );
        console.log('✅ Video uploads completed');

        // Update global state with the new sections containing video URLs
        dispatch(setSections(uploadResult));
        updatedSections = uploadResult; // Use the uploaded result
      } catch (uploadError) {
        console.log('❌ Video upload failed:', uploadError);
        // Keep original sections if upload fails
        updatedSections = sections;
      }

      // Final validation to ensure data consistency
      const validatedSections = updatedSections.map((section) => ({
        ...section,
        chapters: section.chapters.map((chapter) => {
          // If video exists and is a string, ensure type is Video
          // If no video, ensure type is Text
          const hasVideo =
            typeof chapter.video === 'string' && chapter.video.trim() !== '';

          return {
            ...chapter,
            video: typeof chapter.video === 'string' ? chapter.video : '',
            type: hasVideo ? ('Video' as const) : ('Text' as const),
          };
        }),
      }));

      console.log(
        '📋 Final validated sections to save:',
        JSON.stringify(validatedSections, null, 2)
      );

      const formData = createCourseFormData(data, validatedSections);

      console.log('📨 Sending course update to server...');
      const result = await updateCourse({
        courseId: id,
        formData,
      }).unwrap();

      console.log('✅ Course update successful!', result);
      toast.success('Course updated successfully');
      refetch();
    } catch (error) {
      console.log('💥 Course update failed:', error);
      toast.error('Failed to update course');
    }
  };

  // Add this temporarily to your CourseEditor component
  useEffect(() => {
    console.log(
      '🔄 Current sections in state:',
      JSON.stringify(sections, null, 2)
    );
  }, [sections]);

  return (
    <div className='bg-customgreys-secondarybg'>
      <div className='flex items-center gap-5 mb-5'>
        <button
          className='flex items-center border border-customgreys-dirty-grey rounded-lg p-2 gap-2 cursor-pointer hover:bg-customgreys-dirty-grey hover:text-white-100 text-customgreys-dirty-grey'
          onClick={() => router.push('/teacher/courses', { scroll: false })}
        >
          <ArrowLeft className='w-4 h-4' />
          <span>Back to Courses</span>
        </button>
      </div>

      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Header
            title='Course Setup'
            subtitle='Complete all fields and save your course'
            rightElement={
              <div className='flex items-center space-x-4'>
                <CustomFormField
                  name='courseStatus'
                  label={methods.watch('courseStatus') ? 'Published' : 'Draft'}
                  type='switch'
                  className='flex items-center space-x-2'
                  labelClassName={`text-sm font-medium ${
                    methods.watch('courseStatus')
                      ? 'text-green-500'
                      : 'text-yellow-500'
                  }`}
                  inputClassName='data-[state=checked]:bg-green-500'
                />
                <Button
                  type='submit'
                  className='bg-primary-700 hover:bg-primary-600'
                >
                  {methods.watch('courseStatus')
                    ? 'Update Published Course'
                    : 'Save Draft'}
                </Button>
              </div>
            }
          />

          <div className='flex justify-between md:flex-row flex-col gap-10 mt-5 font-dm-sans'>
            <div className='basis-1/2'>
              <div className='space-y-4'>
                <CustomFormField
                  name='courseTitle'
                  label='Course Title'
                  type='text'
                  placeholder='Write course title here'
                  className='border-none'
                  initialValue={course?.title}
                />

                <CustomFormField
                  name='courseDescription'
                  label='Course Description'
                  type='textarea'
                  placeholder='Write course description here'
                  initialValue={course?.description}
                />

                <CustomFormField
                  name='courseCategory'
                  label='Course Category'
                  type='select'
                  placeholder='Select category here'
                  options={[
                    { value: 'technology', label: 'Technology' },
                    { value: 'science', label: 'Science' },
                    { value: 'mathematics', label: 'Mathematics' },
                    {
                      value: 'Artificial Intelligence',
                      label: 'Artificial Intelligence',
                    },
                  ]}
                  initialValue={course?.category}
                />

                <CustomFormField
                  name='coursePrice'
                  label='Course Price'
                  type='number'
                  placeholder='0'
                  initialValue={course?.price}
                />
              </div>
            </div>

            <div className='bg-customgreys-dark-grey mt-4 md:mt-0 p-4 rounded-lg basis-1/2'>
              <div className='flex justify-between items-center mb-2'>
                <h2 className='text-2xl font-semibold text-secondary-foreground'>
                  Sections
                </h2>

                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    dispatch(openSectionModal({ sectionIndex: null }))
                  }
                  className='border-none text-primary-700 group'
                >
                  <Plus className='mr-1 h-4 w-4 text-primary-700 group-hover:white-100' />
                  <span className='text-primary-700 group-hover:white-100'>
                    Add Section
                  </span>
                </Button>
              </div>

              {isLoading ? (
                <p>Loading course content...</p>
              ) : sections.length > 0 ? (
                <DroppableComponent />
              ) : (
                <p>No sections available</p>
              )}
            </div>
          </div>
        </form>
      </Form>

      <ChapterModal />
      <SectionModal />
    </div>
  );
};

export default CourseEditor;
