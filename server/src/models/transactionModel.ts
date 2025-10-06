import { Schema, model } from 'dynamoose';

const transactionSchema = new Schema(
  {
    userId: {
      type: String,
      hashKey: true,
      required: true,
    },
    transactionId: {
      type: String,
      rangeKey: true,
      required: true,
    },
    dateTime: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
      index: {
        name: 'CourseTransactionsIndex',
        type: 'global',
      },
    },
    paymentProvider: {
      type: String,
      enum: ['stripe'],
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  {
    saveUnknown: true,
    timestamps: true,
  }
);

const Transaction = model('Transaction', transactionSchema);

export default Transaction;
