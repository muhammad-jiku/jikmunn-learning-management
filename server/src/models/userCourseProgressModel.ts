import { Schema, model } from 'dynamoose';

const chapterProgressSchema = new Schema({
  chapterId: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const sectionProgressSchema = new Schema({
  sectionId: {
    type: String,
    required: true,
  },
  chapters: {
    type: Array,
    schema: [chapterProgressSchema],
    default: [],
  },
});

const userCourseProgressSchema = new Schema(
  {
    userId: {
      type: String,
      hashKey: true,
      required: true,
    },
    courseId: {
      type: String,
      rangeKey: true,
      required: true,
    },
    enrollmentDate: {
      type: String,
      required: true,
    },
    overallProgress: {
      type: Number,
      required: true,
      default: 0,
    },
    sections: {
      type: Array,
      schema: [sectionProgressSchema],
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

const UserCourseProgress = model(
  'UserCourseProgress',
  userCourseProgressSchema
);

export default UserCourseProgress;
