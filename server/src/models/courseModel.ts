import mongoose, { Document, Schema } from 'mongoose';

// Interfaces
export interface IComment {
  commentId: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface IQuizQuestion {
  questionId: string;
  text: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: string;
  points: number;
}

export interface IQuiz {
  quizId: string;
  title: string;
  questions: IQuizQuestion[];
  passingScore: number; // percentage 0-100
  timeLimit?: number; // minutes
}

export interface IChapter {
  chapterId: string;
  type: 'Video' | 'Quiz' | 'Text';
  title: string;
  content: string;
  video?: string; // Legacy field for backward compatibility
  youtubeVideoId?: string; // YouTube video ID (e.g., "dQw4w9WgXcQ")
  freePreview?: boolean;
  comments: IComment[];
  quiz?: IQuiz;
}

export interface ISection {
  sectionId: string;
  sectionTitle: string;
  sectionDescription?: string;
  chapters: IChapter[];
}

export interface IEnrollment {
  userId: string;
  enrolledAt: string;
}

export interface ICourse extends Document {
  courseId: string;
  teacherId: string;
  teacherName: string;
  teacherBio?: string;
  title: string;
  description?: string;
  category: string;
  image?: string; // Cloudinary URL
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Draft' | 'Published';
  sections: ISection[];
  enrollments: IEnrollment[];
  createdAt: Date;
  updatedAt: Date;
}

// Schemas
const commentSchema = new Schema<IComment>(
  {
    commentId: { type: String, required: true },
    userId: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { _id: false }
);

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionId: { type: String, required: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false'],
      required: true,
    },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: true },
    points: { type: Number, default: 1 },
  },
  { _id: false }
);

const quizSchema = new Schema<IQuiz>(
  {
    quizId: { type: String, required: true },
    title: { type: String, required: true },
    questions: { type: [quizQuestionSchema], default: [] },
    passingScore: { type: Number, default: 70 },
    timeLimit: { type: Number },
  },
  { _id: false }
);

const chapterSchema = new Schema<IChapter>(
  {
    chapterId: { type: String, required: true },
    type: {
      type: String,
      enum: ['Video', 'Quiz', 'Text'],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    video: { type: String }, // Legacy - kept for backward compatibility
    youtubeVideoId: { type: String }, // YouTube video ID
    freePreview: { type: Boolean, default: false },
    comments: { type: [commentSchema], default: [] },
    quiz: { type: quizSchema },
  },
  { _id: false }
);

const sectionSchema = new Schema<ISection>(
  {
    sectionId: { type: String, required: true },
    sectionTitle: { type: String, required: true },
    sectionDescription: { type: String },
    chapters: { type: [chapterSchema], default: [] },
  },
  { _id: false }
);

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: String, required: true },
    enrolledAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  { _id: false }
);

const courseSchema = new Schema<ICourse>(
  {
    courseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    teacherId: {
      type: String,
      required: true,
      index: true,
    },
    teacherName: { type: String, required: true },
    teacherBio: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      required: true,
      index: true,
    },
    image: { type: String },
    price: { type: Number, default: 0 },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
      default: 'Beginner',
    },
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      required: true,
      default: 'Draft',
    },
    sections: { type: [sectionSchema], default: [] },
    enrollments: { type: [enrollmentSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ title: 'text', description: 'text' });

const Course = mongoose.model<ICourse>('Course', courseSchema);

export default Course;
