import {
  useGetCourseQuery,
  useGetUserCourseProgressQuery,
  useUpdateUserCourseProgressMutation,
} from '@/state/api';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export const useCourseProgressData = () => {
  const { courseId, chapterId } = useParams();
  const { user, isLoaded } = useUser();
  const [hasMarkedComplete, setHasMarkedComplete] = useState<boolean>(false);
  const [updateProgress] = useUpdateUserCourseProgressMutation();

  // console.log('Params in useCourseProgressData hook:', { courseId, chapterId });

  const { data: course, isLoading: courseLoading } = useGetCourseQuery(
    (courseId as string) ?? '',
    {
      skip: !courseId,
    }
  );
  // console.log('Course data in useCourseProgressData hook:', course);

  const { data: userProgress, isLoading: progressLoading } =
    useGetUserCourseProgressQuery(
      {
        userId: user?.id ?? '',
        courseId: (courseId as string) ?? '',
      },
      {
        skip: !isLoaded || !user || !courseId,
      }
    );
  // console.log(
  //   'User progress data in useCourseProgressData hook:',
  //   userProgress
  // );

  const isLoading = !isLoaded || courseLoading || progressLoading;

  const currentSection = course?.sections.find((s) =>
    s.chapters.some((c) => c.chapterId === chapterId)
  );
  // console.log('Current section in useCourseProgressData hook:', currentSection);

  const currentChapter = currentSection?.chapters.find(
    (c) => c.chapterId === chapterId
  );
  // console.log('Current chapter in useCourseProgressData hook:', currentChapter);

  const isChapterCompleted = () => {
    if (!currentSection || !currentChapter || !userProgress?.sections)
      return false;

    const section = userProgress.sections.find(
      (s) => s.sectionId === currentSection.sectionId
    );
    return (
      section?.chapters.some(
        (c) => c.chapterId === currentChapter.chapterId && c.completed
      ) ?? false
    );
  };
  // console.log('Is chapter completed:', isChapterCompleted());

  const updateChapterProgress = (
    sectionId: string,
    chapterId: string,
    completed: boolean
  ) => {
    if (!user) return;

    const updatedSections = [
      {
        sectionId,
        chapters: [
          {
            chapterId,
            completed,
          },
        ],
      },
    ];

    updateProgress({
      userId: user.id,
      courseId: (courseId as string) ?? '',
      progressData: {
        sections: updatedSections,
      },
    });
  };

  return {
    user,
    courseId,
    chapterId,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
  };
};
