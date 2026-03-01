import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  certificateId: string;
  userId: string;
  courseId: string;
  courseName: string;
  userName: string;
  issuedAt: Date;
  verificationUrl: string;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true },
    courseName: { type: String, required: true },
    userName: { type: String, required: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    verificationUrl: { type: String, required: true },
  },
  { timestamps: true }
);

// One certificate per user per course
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Certificate = mongoose.model<ICertificate>(
  'Certificate',
  certificateSchema
);

export default Certificate;
