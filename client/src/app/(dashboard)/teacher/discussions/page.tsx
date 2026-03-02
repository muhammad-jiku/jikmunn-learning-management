'use client';

import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useDeleteDiscussionMutation,
  useGetCoursesQuery,
  useGetDiscussionsQuery,
  usePinDiscussionMutation,
} from '@/state/api';
import { useUser } from '@clerk/nextjs';
import {
  ArrowUp,
  MessageSquare,
  Pin,
  Search,
  Shield,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const TeacherDiscussionsPage = () => {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const { data: courses, isLoading: coursesLoading } = useGetCoursesQuery({
    category: 'all',
  });

  const teacherCourses = useMemo(
    () => courses?.filter((c) => c.teacherId === userId) ?? [],
    [courses, userId]
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'popular'>('newest');

  // Use first teacher course as default when loaded
  const activeCourseId = selectedCourseId || teacherCourses[0]?.courseId || '';

  const {
    data: discussions,
    isLoading: discussionsLoading,
    isError,
  } = useGetDiscussionsQuery(
    { courseId: activeCourseId, search, sort },
    { skip: !activeCourseId }
  );

  const [pinDiscussion] = usePinDiscussionMutation();
  const [deleteDiscussion] = useDeleteDiscussionMutation();

  if (!isLoaded || coursesLoading) return <Loading />;

  if (teacherCourses.length === 0) {
    return (
      <div className='discussion-page'>
        <Header title='Discussions' subtitle='Manage course discussions' />
        <div className='discussion-empty'>
          <MessageSquare className='w-12 h-12 text-gray-400 mx-auto mb-3' />
          <p>No courses yet. Create a course to enable discussions.</p>
        </div>
      </div>
    );
  }

  const handlePin = async (discussionId: string) => {
    try {
      await pinDiscussion(discussionId).unwrap();
    } catch {
      // handled
    }
  };

  const handleDelete = async (discussionId: string) => {
    if (!confirm('Delete this discussion and all its replies?')) return;
    try {
      await deleteDiscussion(discussionId).unwrap();
    } catch {
      // handled
    }
  };

  const selectedCourse = teacherCourses.find(
    (c) => c.courseId === activeCourseId
  );

  return (
    <div className='discussion-page'>
      <Header
        title='Discussions'
        subtitle='Manage community discussions across your courses'
      />

      {/* Course Selector + Filters */}
      <div className='discussion-teacher-filters'>
        <Select
          value={activeCourseId}
          onValueChange={(v) => setSelectedCourseId(v)}
        >
          <SelectTrigger className='discussion-teacher-filters__course-select'>
            <SelectValue placeholder='Select a course' />
          </SelectTrigger>
          <SelectContent>
            {teacherCourses.map((c) => (
              <SelectItem key={c.courseId} value={c.courseId}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='discussion-filters__search'>
          <Search className='w-4 h-4' />
          <Input
            placeholder='Search discussions...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='discussion-filters__input'
          />
        </div>

        <div className='discussion-filters__sort'>
          <button
            onClick={() => setSort('newest')}
            className={`discussion-filters__sort-btn ${sort === 'newest' ? 'active' : ''}`}
          >
            Newest
          </button>
          <button
            onClick={() => setSort('oldest')}
            className={`discussion-filters__sort-btn ${sort === 'oldest' ? 'active' : ''}`}
          >
            Oldest
          </button>
          <button
            onClick={() => setSort('popular')}
            className={`discussion-filters__sort-btn ${sort === 'popular' ? 'active' : ''}`}
          >
            Popular
          </button>
        </div>
      </div>

      {/* Stats */}
      {selectedCourse && discussions && (
        <div className='discussion-teacher-stats'>
          <div className='discussion-teacher-stats__item'>
            <MessageSquare className='w-5 h-5' />
            <span>{discussions.length} discussions</span>
          </div>
          <div className='discussion-teacher-stats__item'>
            <Pin className='w-5 h-5' />
            <span>{discussions.filter((d) => d.isPinned).length} pinned</span>
          </div>
        </div>
      )}

      {/* Discussion List */}
      <div className='discussion-list'>
        {discussionsLoading ? (
          <Loading />
        ) : isError ? (
          <div className='discussion-error'>Failed to load discussions</div>
        ) : !discussions || discussions.length === 0 ? (
          <div className='discussion-empty'>
            <MessageSquare className='w-12 h-12 text-gray-400 mx-auto mb-3' />
            <p>No discussions for this course yet.</p>
          </div>
        ) : (
          discussions.map((d) => (
            <Link
              key={d.discussionId}
              href={`/teacher/courses/${activeCourseId}/discussions/${d.discussionId}`}
              className='discussion-card'
            >
              <div className='discussion-card__left'>
                <div className='discussion-card__upvote'>
                  <ArrowUp className='w-4 h-4' />
                  <span>{d.upvotes}</span>
                </div>
              </div>

              <div className='discussion-card__body'>
                <div className='discussion-card__header'>
                  {d.isPinned && (
                    <span className='discussion-card__badge discussion-card__badge--pinned'>
                      <Pin className='w-3 h-3' /> Pinned
                    </span>
                  )}
                  {d.isInstructorPost && (
                    <span className='discussion-card__badge discussion-card__badge--instructor'>
                      <Shield className='w-3 h-3' /> Instructor
                    </span>
                  )}
                </div>
                <h3 className='discussion-card__title'>{d.title}</h3>
                <p className='discussion-card__preview'>
                  {d.content.length > 150
                    ? d.content.substring(0, 150) + '...'
                    : d.content}
                </p>
                <div className='discussion-card__meta'>
                  <span>{d.userName}</span>
                  <span>·</span>
                  <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>
                    <MessageSquare className='w-3 h-3 inline mr-1' />
                    {d.replyCount} {d.replyCount === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>

              <div className='discussion-card__actions'>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handlePin(d.discussionId);
                  }}
                  className='discussion-card__action-btn'
                  title={d.isPinned ? 'Unpin' : 'Pin'}
                >
                  <Pin
                    className={`w-4 h-4 ${d.isPinned ? 'text-primary-700' : ''}`}
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(d.discussionId);
                  }}
                  className='discussion-card__action-btn discussion-card__action-btn--danger'
                  title='Delete'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherDiscussionsPage;
