import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: string;
  channel: 'email' | 'in_app';
  recipient: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'logged' | 'read';
  error?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    channel: {
      type: String,
      enum: ['email', 'in_app'],
      required: true,
      default: 'email',
    },
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'logged', 'read'],
      default: 'pending',
    },
    error: { type: String },
    externalId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Index for fetching user notifications efficiently
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });

const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export default Notification;
