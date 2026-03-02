'use client';

import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCreateDiscussionMutation,
  useDeleteDiscussionMutation,
  useGetDiscussionsQuery,
  usePinDiscussionMutation,
  useUpvoteDiscussionMutation,
} from '@/state/api';
import { useUser } from '@clerk/nextjs';
import {
  ArrowUp,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const CourseDiscussionsPage = () => {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const {
    data: discussions,
    isLoading,
    isError,
  } = useGetDiscussionsQuery({ courseId, search, sort });

  const [createDiscussion, { isLoading: isCreating }] =
    useCreateDiscussionMutation();
  const [upvoteDiscussion] = useUpvoteDiscussionMutation();
  const [pinDiscussion] = usePinDiscussionMutation();
  const [deleteDiscussion] = useDeleteDiscussionMutation();

  if (!isLoaded || isLoading) return <Loading />;
  if (isError)
    return <div className='discussion-error'>Failed to load discussions</div>;

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      await createDiscussion({
        courseId,
        title: title.trim(),
        content: content.trim(),
      }).unwrap();
      setTitle('');
      setContent('');
      setShowForm(false);
    } catch {
      // error already handled by RTK Query
    }
  };

  const handleUpvote = async (discussionId: string) => {
    try {
      await upvoteDiscussion(discussionId).unwrap();
    } catch {
      // handled
    }
  };

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

  const isTeacher = user?.publicMetadata?.userType === 'teacher';

  return (
    <div className='discussion-page'>
      <Header
        title='Discussions'
        subtitle='Course community forum'
        rightElement={
          <Button
            onClick={() => setShowForm(!showForm)}
            className='discussion-create-btn'
          >
            {showForm ? (
              <X className='w-4 h-4 mr-2' />
            ) : (
              <Plus className='w-4 h-4 mr-2' />
            )}
            {showForm ? 'Cancel' : 'New Discussion'}
          </Button>
        }
      />

      {/* Create Discussion Form */}
      {showForm && (
        <div className='discussion-form'>
          <Input
            placeholder='Discussion title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='discussion-form__title'
          />
          <textarea
            placeholder='Share your thoughts, ask a question...'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className='discussion-form__content'
            rows={4}
          />
          <Button
            onClick={handleCreate}
            disabled={isCreating || !title.trim() || !content.trim()}
            className='discussion-form__submit'
          >
            {isCreating ? 'Posting...' : 'Post Discussion'}
          </Button>
        </div>
      )}

      {/* Search & Filters */}
      <div className='discussion-filters'>
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

      {/* Discussion List */}
      <div className='discussion-list'>
        {!discussions || discussions.length === 0 ? (
          <div className='discussion-empty'>
            <MessageSquare className='w-12 h-12 text-gray-400 mx-auto mb-3' />
            <p>No discussions yet. Start the conversation!</p>
          </div>
        ) : (
          discussions.map((d) => (
            <Link
              key={d.discussionId}
              href={`/student/courses/${courseId}/discussions/${d.discussionId}`}
              className='discussion-card'
            >
              <div className='discussion-card__left'>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleUpvote(d.discussionId);
                  }}
                  className='discussion-card__upvote'
                >
                  <ArrowUp className='w-4 h-4' />
                  <span>{d.upvotes}</span>
                </button>
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
                {isTeacher && (
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
                )}
                {(d.userId === userId || isTeacher) && (
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
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseDiscussionsPage;
