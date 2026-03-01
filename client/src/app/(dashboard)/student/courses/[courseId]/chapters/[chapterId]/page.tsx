/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import CompletionCelebrationModal from '@/components/certificate/CompletionCelebrationModal';
import CourseReviews from '@/components/course/CourseReviews';
import QuizPlayer from '@/components/quiz/QuizPlayer';
import Loading from '@/components/shared/Loading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseProgressData } from '@/hooks/useCourseProgressData';
import { getYouTubeWatchUrl } from '@/lib/utils';
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetChapterCommentsQuery,
} from '@/state/api';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send, Star, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

// Dynamic import to avoid SSR issues with react-player
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
}) as any;

const Course = () => {
  const {
    user,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
  } = useCourseProgressData();

  const playerRef = useRef<any>(null);
  const [commentText, setCommentText] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Comment queries
  const { data: comments = [] } = useGetChapterCommentsQuery(
    {
      courseId: course?.courseId ?? '',
      sectionId: currentSection?.sectionId ?? '',
      chapterId: currentChapter?.chapterId ?? '',
    },
    {
      skip:
        !course?.courseId ||
        !currentSection?.sectionId ||
        !currentChapter?.chapterId,
    }
  );
  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const handleProgress: NonNullable<any['onProgress']> = (state: {
    played: number;
  }) => {
    if (
      state.played >= 0.8 &&
      !hasMarkedComplete &&
      currentChapter &&
      currentSection &&
      userProgress?.sections &&
      !isChapterCompleted()
    ) {
      setHasMarkedComplete(true);
      updateChapterProgress(
        currentSection.sectionId,
        currentChapter.chapterId,
        true
      );

      // Check if this completion makes overall progress 100%
      if (userProgress && course) {
        const totalChapters = course.sections.reduce(
          (sum, s) => sum + s.chapters.length,
          0
        );
        const completedChapters = userProgress.sections.reduce(
          (sum, s) => sum + s.chapters.filter((c) => c.completed).length,
          0
        );
        // +1 for the chapter just marked complete
        if (completedChapters + 1 >= totalChapters && totalChapters > 0) {
          setShowCelebration(true);
        }
      }
    }
  };

  const handleAddComment = async () => {
    if (
      !commentText.trim() ||
      !course?.courseId ||
      !currentSection?.sectionId ||
      !currentChapter?.chapterId
    )
      return;

    await addComment({
      courseId: course.courseId,
      sectionId: currentSection.sectionId,
      chapterId: currentChapter.chapterId,
      text: commentText,
    });
    setCommentText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (
      !course?.courseId ||
      !currentSection?.sectionId ||
      !currentChapter?.chapterId
    )
      return;

    await deleteComment({
      courseId: course.courseId,
      sectionId: currentSection.sectionId,
      chapterId: currentChapter.chapterId,
      commentId,
    });
  };

  // Determine video URL: prefer YouTube, fallback to legacy video field
  const videoUrl = currentChapter?.youtubeVideoId
    ? getYouTubeWatchUrl(currentChapter.youtubeVideoId)
    : currentChapter?.video || null;

  const fileConfig: any = {
    file: { attributes: { controlsList: 'nodownload' } },
  };

  if (isLoading) return <Loading />;
  if (!user) return <div>Please sign in to view this course.</div>;
  if (!course || !userProgress) return <div>Error loading course</div>;

  return (
    <div className='course'>
      <CompletionCelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        courseId={course.courseId}
        courseName={course.title}
      />
      <div className='course__container'>
        <div className='course__breadcrumb'>
          <div className='course__path'>
            {course.title} / {currentSection?.sectionTitle} /{' '}
            <span className='course__current-chapter'>
              {currentChapter?.title}
            </span>
          </div>
          <h2 className='course__title'>{currentChapter?.title}</h2>
          <div className='course__header'>
            <div className='course__instructor'>
              <Avatar className='course__avatar'>
                <AvatarImage alt={course.teacherName} />
                <AvatarFallback className='course__avatar-fallback'>
                  {course.teacherName[0]}
                </AvatarFallback>
              </Avatar>
              <span className='course__instructor-name'>
                {course.teacherName}
              </span>
            </div>
          </div>
        </div>

        <Card className='course__video'>
          <CardContent className='course__video-container'>
            {videoUrl ? (
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                controls
                width='100%'
                height='100%'
                onProgress={handleProgress}
                config={currentChapter?.youtubeVideoId ? undefined : fileConfig}
              />
            ) : (
              <div className='course__no-video'>
                No video available for this chapter.
              </div>
            )}
          </CardContent>
        </Card>

        <div className='course__content'>
          <Tabs defaultValue='Notes' className='course__tabs'>
            <TabsList className='course__tabs-list'>
              <TabsTrigger className='course__tab' value='Notes'>
                Notes
              </TabsTrigger>
              <TabsTrigger className='course__tab' value='Resources'>
                Resources
              </TabsTrigger>
              <TabsTrigger className='course__tab' value='Quiz'>
                Quiz
              </TabsTrigger>
              <TabsTrigger className='course__tab' value='Comments'>
                <MessageSquare className='mr-1 inline h-4 w-4' />
                Comments ({comments.length})
              </TabsTrigger>
              <TabsTrigger className='course__tab' value='Reviews'>
                <Star className='mr-1 inline h-4 w-4' />
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent className='course__tab-content' value='Notes'>
              <Card className='course__tab-card'>
                <CardHeader className='course__tab-header'>
                  <CardTitle>Notes Content</CardTitle>
                </CardHeader>
                <CardContent className='course__tab-body'>
                  {currentChapter?.content}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className='course__tab-content' value='Resources'>
              <Card className='course__tab-card'>
                <CardHeader className='course__tab-header'>
                  <CardTitle>Resources Content</CardTitle>
                </CardHeader>
                <CardContent className='course__tab-body'>
                  {/* Add resources content here */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className='course__tab-content' value='Quiz'>
              <Card className='course__tab-card'>
                <CardHeader className='course__tab-header'>
                  <CardTitle>Quiz</CardTitle>
                </CardHeader>
                <CardContent className='course__tab-body'>
                  {course?.courseId &&
                  currentSection?.sectionId &&
                  currentChapter?.chapterId ? (
                    <QuizPlayer
                      courseId={course.courseId}
                      sectionId={currentSection.sectionId}
                      chapterId={currentChapter.chapterId}
                    />
                  ) : (
                    <p className='text-customgreys-dirty-grey'>
                      No quiz available for this chapter.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className='course__tab-content' value='Comments'>
              <Card className='course__tab-card'>
                <CardHeader className='course__tab-header'>
                  <CardTitle>Discussion</CardTitle>
                </CardHeader>
                <CardContent className='course__tab-body'>
                  {/* Add comment form */}
                  <div className='mb-6 flex gap-2'>
                    <input
                      type='text'
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder='Add a comment...'
                      className='flex-1 rounded-md border border-gray-600 bg-customgreys-darkGrey px-3 py-2 text-sm text-white-100 placeholder:text-gray-500 focus:border-primary-700 focus:outline-none'
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || isAddingComment}
                      size='sm'
                      className='bg-primary-700 hover:bg-primary-600'
                    >
                      <Send className='h-4 w-4' />
                    </Button>
                  </div>

                  {/* Comment list */}
                  {comments.length === 0 ? (
                    <p className='text-center text-sm text-gray-500'>
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    <div className='space-y-4'>
                      {comments.map((comment: ChapterComment) => (
                        <div
                          key={comment.commentId}
                          className='flex gap-3 rounded-lg bg-customgreys-darkGrey p-3'
                        >
                          <Avatar className='h-8 w-8'>
                            <AvatarFallback className='bg-primary-700 text-xs text-white'>
                              {comment.userName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <span className='text-sm font-medium text-white-100'>
                                  {comment.userName}
                                </span>
                                <span className='text-xs text-gray-500'>
                                  {formatDistanceToNow(
                                    new Date(comment.timestamp),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                              {(comment.userId === user.id ||
                                course.teacherId === user.id) && (
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment.commentId)
                                  }
                                  className='text-gray-500 transition-colors hover:text-red-500'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </button>
                              )}
                            </div>
                            <p className='mt-1 text-sm text-gray-300'>
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className='course__tab-content' value='Reviews'>
              <Card className='course__tab-card'>
                <CardHeader className='course__tab-header'>
                  <CardTitle>Course Reviews</CardTitle>
                </CardHeader>
                <CardContent className='course__tab-body'>
                  {course?.courseId ? (
                    <CourseReviews courseId={course.courseId} />
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className='course__instructor-card'>
            <CardContent className='course__instructor-info'>
              <div className='course__instructor-header'>
                <Avatar className='course__instructor-avatar'>
                  <AvatarImage alt={course.teacherName} />
                  <AvatarFallback className='course__instructor-avatar-fallback'>
                    {course.teacherName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className='course__instructor-details'>
                  <h4 className='course__instructor-name'>
                    {course.teacherName}
                  </h4>
                  <p className='course__instructor-title'>Instructor</p>
                </div>
              </div>
              <div className='course__instructor-bio'>
                <p>
                  {course.teacherBio ||
                    `${course.teacherName} is the instructor for this course.`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Course;
