'use client';

import Header from '@/components/shared/Header';
import Loading from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import {
  useCreateReplyMutation,
  useDeleteDiscussionMutation,
  useDeleteReplyMutation,
  useGetDiscussionQuery,
  usePinDiscussionMutation,
  useUpvoteDiscussionMutation,
  useUpvoteReplyMutation,
} from '@/state/api';
import { useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  ArrowUp,
  MessageSquare,
  Pin,
  Shield,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const DiscussionThreadPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const discussionId = params.discussionId as string;
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const [replyContent, setReplyContent] = useState('');

  const {
    data: discussion,
    isLoading,
    isError,
  } = useGetDiscussionQuery(discussionId);

  const [createReply, { isLoading: isReplying }] = useCreateReplyMutation();
  const [upvoteDiscussion] = useUpvoteDiscussionMutation();
  const [upvoteReply] = useUpvoteReplyMutation();
  const [pinDiscussion] = usePinDiscussionMutation();
  const [deleteDiscussion] = useDeleteDiscussionMutation();
  const [deleteReply] = useDeleteReplyMutation();

  if (!isLoaded || isLoading) return <Loading />;
  if (isError || !discussion)
    return <div className='discussion-error'>Discussion not found</div>;

  const isTeacher = user?.publicMetadata?.userType === 'teacher';

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await createReply({
        discussionId,
        content: replyContent.trim(),
      }).unwrap();
      setReplyContent('');
    } catch {
      // handled
    }
  };

  const handleDeleteDiscussion = async () => {
    if (!confirm('Delete this discussion and all its replies?')) return;
    try {
      await deleteDiscussion(discussionId).unwrap();
      router.push(`/student/courses/${courseId}/discussions`);
    } catch {
      // handled
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Delete this reply?')) return;
    try {
      await deleteReply(replyId).unwrap();
    } catch {
      // handled
    }
  };

  return (
    <div className='discussion-thread'>
      <Header
        title='Discussion'
        subtitle={discussion.title}
        rightElement={
          <button
            onClick={() =>
              router.push(`/student/courses/${courseId}/discussions`)
            }
            className='discussion-back-btn'
          >
            <ArrowLeft className='w-4 h-4 mr-2' /> Back to Discussions
          </button>
        }
      />

      {/* Original Post */}
      <div className='discussion-thread__post'>
        <div className='discussion-thread__post-header'>
          <div className='discussion-thread__post-badges'>
            {discussion.isPinned && (
              <span className='discussion-card__badge discussion-card__badge--pinned'>
                <Pin className='w-3 h-3' /> Pinned
              </span>
            )}
            {discussion.isInstructorPost && (
              <span className='discussion-card__badge discussion-card__badge--instructor'>
                <Shield className='w-3 h-3' /> Instructor
              </span>
            )}
          </div>
          <div className='discussion-thread__post-actions'>
            {isTeacher && (
              <button
                onClick={() => pinDiscussion(discussionId)}
                className='discussion-card__action-btn'
                title={discussion.isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin
                  className={`w-4 h-4 ${discussion.isPinned ? 'text-primary-700' : ''}`}
                />
              </button>
            )}
            {(discussion.userId === userId || isTeacher) && (
              <button
                onClick={handleDeleteDiscussion}
                className='discussion-card__action-btn discussion-card__action-btn--danger'
                title='Delete discussion'
              >
                <Trash2 className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>

        <h2 className='discussion-thread__title'>{discussion.title}</h2>
        <div className='discussion-thread__meta'>
          <span className='font-medium'>{discussion.userName}</span>
          <span>·</span>
          <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
        </div>
        <div className='discussion-thread__content'>{discussion.content}</div>

        <div className='discussion-thread__post-footer'>
          <button
            onClick={() => upvoteDiscussion(discussionId)}
            className='discussion-thread__upvote-btn'
          >
            <ArrowUp className='w-4 h-4' />
            <span>{discussion.upvotes}</span>
          </button>
          <span className='discussion-thread__reply-count'>
            <MessageSquare className='w-4 h-4' />
            {discussion.replies?.length ?? 0} replies
          </span>
        </div>
      </div>

      {/* Reply Composer */}
      <div className='discussion-reply-composer'>
        <textarea
          placeholder='Write a reply...'
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          className='discussion-reply-composer__input'
          rows={3}
        />
        <Button
          onClick={handleReply}
          disabled={isReplying || !replyContent.trim()}
          className='discussion-reply-composer__submit'
        >
          {isReplying ? 'Posting...' : 'Post Reply'}
        </Button>
      </div>

      {/* Replies */}
      <div className='discussion-replies'>
        {discussion.replies && discussion.replies.length > 0 ? (
          discussion.replies.map((reply) => (
            <div key={reply.replyId} className='discussion-reply'>
              <div className='discussion-reply__header'>
                <div className='discussion-reply__author'>
                  <span className='font-medium'>{reply.userName}</span>
                  {reply.isInstructorReply && (
                    <span className='discussion-card__badge discussion-card__badge--instructor'>
                      <Shield className='w-3 h-3' /> Instructor
                    </span>
                  )}
                </div>
                <div className='discussion-reply__actions'>
                  <span className='text-sm text-gray-400'>
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </span>
                  {(reply.userId === userId || isTeacher) && (
                    <button
                      onClick={() => handleDeleteReply(reply.replyId)}
                      className='discussion-card__action-btn discussion-card__action-btn--danger'
                      title='Delete reply'
                    >
                      <Trash2 className='w-3 h-3' />
                    </button>
                  )}
                </div>
              </div>
              <p className='discussion-reply__content'>{reply.content}</p>
              <div className='discussion-reply__footer'>
                <button
                  onClick={() => upvoteReply(reply.replyId)}
                  className='discussion-thread__upvote-btn'
                >
                  <ArrowUp className='w-3 h-3' />
                  <span>{reply.upvotes}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className='discussion-empty'>
            <p>No replies yet. Be the first to respond!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionThreadPage;
