import dotenv from 'dotenv';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import Course from '../models/courseModel';
import Transaction from '../models/transactionModel';
import UserCourseProgress from '../models/userCourseProgressModel';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY os required but was not found in env variables'
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const listTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;
  console.log('fetching transactions with userId:', userId);

  try {
    const transactions = userId
      ? await Transaction.query('userId').eq(userId).exec()
      : await Transaction.scan().exec();
    console.log('list of transactions:', transactions);

    res.status(200).json({
      message: 'Transactions retrieved successfully',
      data: transactions,
    });
  } catch (error) {
    console.log('Error fetching transactions:', error);
    res.status(500).json({
      message: 'Error retrieving transactions',
      error,
    });
  }
};

export const createStripePaymentIntent = async (
  req: Request,
  res: Response
): Promise<void> => {
  let { amount } = req.body;
  console.log('Creating stripe payment intent with amount:', req.body);

  if (!amount || amount <= 0) {
    amount = 50;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });
    console.log('Created payment intent:', paymentIntent);

    res.status(200).json({
      message: '',
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    console.log('Error creating stripe payment intent:', error);
    res.status(500).json({
      message: 'Error creating stripe payment intent',
      error,
    });
  }
};

export const createTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId, transactionId, amount, paymentProvider } = req.body;
  console.log('Creating transaction with data:', req.body);

  try {
    // 1. get course info
    const course = await Course.get(courseId);
    console.log('Course details:', course);

    // 2. create transaction record
    const newTransaction = new Transaction({
      dateTime: new Date().toISOString(),
      userId,
      courseId,
      transactionId,
      amount,
      paymentProvider,
    });
    await newTransaction.save();
    console.log('New transaction created:', newTransaction);

    // 3. create initial course progress
    const initialProgress = new UserCourseProgress({
      userId,
      courseId,
      enrollmentDate: new Date().toISOString(),
      overallProgress: 0,
      sections: course.sections.map((section: any) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter: any) => ({
          chapterId: chapter.chapterId,
          completed: false,
        })),
      })),
      lastAccessedTimestamp: new Date().toISOString(),
    });
    await initialProgress.save();
    console.log('Initial course progress created:', initialProgress);

    // 4. add enrollment to relevant course
    await Course.update(
      { courseId },
      {
        $ADD: {
          enrollments: [{ userId }],
        },
      }
    );

    res.status(201).json({
      message: 'Purchased Course successfully',
      data: {
        transaction: newTransaction,
        courseProgress: initialProgress,
      },
    });
  } catch (error) {
    console.log('Error creating transaction and enrollment:', error);
    res.status(500).json({
      message: 'Error creating transaction and enrollment',
      error,
    });
  }
};
