import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  reviewId: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    reviewId: { type: String, required: true, unique: true },
    courseId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
reviewSchema.index({ courseId: 1, createdAt: -1 });
reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true }); // One review per user per course

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
