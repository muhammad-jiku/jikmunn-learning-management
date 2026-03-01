/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { CustomFormField } from '@/components/custom/CustomFormField';
import ChapterModal from '@/components/modal/ChapterModal';
import DroppableComponent from '@/components/modal/Droppable';
import SectionModal from '@/components/modal/SectionModal';
import Header from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { uploadToCloudinary, validateImageFile } from '@/lib/cloudinary';
import { courseSchema } from '@/lib/schemas';
import { centsToDollars, createCourseFormData } from '@/lib/utils';
import { openSectionModal, setSections } from '@/state';
import {
  useGetCourseQuery,
  useGetUploadImageSignatureMutation,
  useUpdateCourseMutation,
} from '@/state/api';
import { useAppDispatch, useAppSelector } from '@/state/redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ImagePlus, Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const CourseEditor = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: course, isLoading, refetch } = useGetCourseQuery(id);

  const [updateCourse] = useUpdateCourseMutation();
  const [getUploadSignature] = useGetUploadImageSignatureMutation();

  const dispatch = useAppDispatch();
  const { sections } = useAppSelector((state) => state.global.courseEditor);

  const [courseImage, setCourseImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setCourseImage(course.image || '');
    }
  }, [course, methods]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file, 10);
      setIsUploading(true);

      // Get upload signature from server
      const signatureData = await getUploadSignature(id).unwrap();

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file, signatureData);
      setCourseImage(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setCourseImage('');
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      // Validate sections - ensure chapter types are consistent
      const validatedSections = sections.map((section) => ({
        ...section,
        chapters: section.chapters.map((chapter) => {
          const hasYouTubeVideo =
            typeof chapter.youtubeVideoId === 'string' &&
            chapter.youtubeVideoId.trim() !== '';

          return {
            ...chapter,
            type: hasYouTubeVideo ? ('Video' as const) : ('Text' as const),
          };
        }),
      }));

      const formData = createCourseFormData(data, validatedSections);

      // Include the uploaded image URL
      if (courseImage) {
        formData.append('image', courseImage);
      }

      const result = await updateCourse({
        courseId: id,
        formData,
      }).unwrap();

      // console.log('✅ Course update successful!', result);
      toast.success('Course updated successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to update course');
    }
  };

  // // Add this temporarily to your CourseEditor component
  // useEffect(() => {
  //   console.log(
  //     '🔄 Current sections in state:',
  //     JSON.stringify(sections, null, 2)
  //   );
  // }, [sections]);

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
                      value: 'artificial-intelligence',
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

                {/* Course Image Upload */}
                <div className='space-y-2'>
                  <label className='text-customgreys-dirty-grey text-sm'>
                    Course Image
                  </label>
                  {courseImage ? (
                    <div className='relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-customgreys-dark-grey'>
                      <Image
                        src={courseImage}
                        alt='Course image'
                        fill
                        className='object-cover'
                      />
                      <button
                        type='button'
                        onClick={handleRemoveImage}
                        className='absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className='flex aspect-video w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-customgreys-dirty-grey bg-customgreys-dark-grey transition-colors hover:border-primary-700'
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className='h-8 w-8 animate-spin text-primary-700' />
                          <span className='text-sm text-customgreys-dirty-grey'>
                            Uploading...
                          </span>
                        </>
                      ) : (
                        <>
                          <ImagePlus className='h-8 w-8 text-customgreys-dirty-grey' />
                          <span className='text-sm text-customgreys-dirty-grey'>
                            Click to upload course image
                          </span>
                          <span className='text-xs text-customgreys-dirty-grey'>
                            JPEG, PNG, GIF, WebP (max 10MB)
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/jpeg,image/png,image/gif,image/webp'
                    onChange={handleImageUpload}
                    className='hidden'
                  />
                </div>
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
