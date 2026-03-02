import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscussion extends Document {
  discussionId: string;
  courseId: string;
  chapterId?: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  upvotes: number;
  replyCount: number;
  isInstructorPost: boolean;
  isPinned: boolean;
  createdAt: Date;
}

const discussionSchema = new Schema(
  {
    discussionId: { type: String, required: true, unique: true },
    courseId: { type: String, required: true, index: true },
    chapterId: { type: String, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    isInstructorPost: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
discussionSchema.index({ courseId: 1, isPinned: -1, createdAt: -1 });
discussionSchema.index({ courseId: 1, chapterId: 1 });

export const Discussion = mongoose.model<IDiscussion>(
  'Discussion',
  discussionSchema
);

// ─── Reply Model ───────────────────────────────────────────────────────────────

export interface IReply extends Document {
  replyId: string;
  discussionId: string;
  userId: string;
  userName: string;
  content: string;
  isInstructorReply: boolean;
  upvotes: number;
  createdAt: Date;
}

const replySchema = new Schema(
  {
    replyId: { type: String, required: true, unique: true },
    discussionId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
    isInstructorReply: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

replySchema.index({ discussionId: 1, createdAt: 1 });

export const Reply = mongoose.model<IReply>('Reply', replySchema);
