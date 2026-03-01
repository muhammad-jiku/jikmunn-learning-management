import mongoose, { Document, Schema } from 'mongoose';

export interface IChapterProgress {
  chapterId: string;
  completed: boolean;
  quizScore?: number;
  quizPassed?: boolean;
}

export interface ISectionProgress {
  sectionId: string;
  chapters: IChapterProgress[];
}

export interface IUserCourseProgress extends Document {
  userId: string;
  courseId: string;
  enrollmentDate: string;
  overallProgress: number;
  sections: ISectionProgress[];
  lastAccessedTimestamp: string;
  createdAt: Date;
  updatedAt: Date;
}

const chapterProgressSchema = new Schema<IChapterProgress>(
  {
    chapterId: { type: String, required: true },
    completed: { type: Boolean, default: false },
    quizScore: { type: Number },
    quizPassed: { type: Boolean },
  },
  { _id: false }
);

const sectionProgressSchema = new Schema<ISectionProgress>(
  {
    sectionId: { type: String, required: true },
    chapters: { type: [chapterProgressSchema], default: [] },
  },
  { _id: false }
);

const userCourseProgressSchema = new Schema<IUserCourseProgress>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    courseId: {
      type: String,
      required: true,
      index: true,
    },
    enrollmentDate: {
      type: String,
      required: true,
    },
    overallProgress: {
      type: Number,
      default: 0,
    },
    sections: {
      type: [sectionProgressSchema],
      default: [],
    },
    lastAccessedTimestamp: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index for user progress queries
userCourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const UserCourseProgress = mongoose.model<IUserCourseProgress>(
  'UserCourseProgress',
  userCourseProgressSchema
);

export default UserCourseProgress;
