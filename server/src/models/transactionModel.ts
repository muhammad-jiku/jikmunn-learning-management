import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  userId: string;
  courseId: string;
  amount: number;
  paymentProvider: 'stripe';
  dateTime: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    amount: {
      type: Number,
      default: 0,
    },
    paymentProvider: {
      type: String,
      enum: ['stripe'],
      required: true,
      default: 'stripe',
    },
    dateTime: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index for user's transactions sorted by date
transactionSchema.index({ userId: 1, dateTime: -1 });

const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);

export default Transaction;
