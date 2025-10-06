import dotenv from 'dotenv';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import Course from '../models/courseModel';
import Transaction from '../models/transactionModel';
import UserCourseProgress from '../models/userCourseProgressModel';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is required but was not found in env variables'
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const listTransactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.query;

  try {
    const transactions = userId
      ? await Transaction.query('userId').eq(userId).exec()
      : await Transaction.scan().exec();

    res.status(200).json({
      message: 'Transactions retrieved successfully',
      data: transactions,
    });
  } catch (error) {
    console.log('Error fetching transactions:', error);
    res.status(500).json({
      message: 'Error retrieving transactions',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const createStripePaymentIntent = async (
  req: Request,
  res: Response
): Promise<void> => {
  let { amount } = req.body;

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

    res.status(200).json({
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    console.log('Error creating stripe payment intent:', error);
    res.status(500).json({
      message: 'Error creating stripe payment intent',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const createTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId, transactionId, amount, paymentProvider } = req.body;

  try {
    // Validate required fields
    if (!userId || !courseId || !transactionId || !paymentProvider) {
      res.status(400).json({
        message:
          'Missing required fields: userId, courseId, transactionId, paymentProvider',
      });
      return;
    }

    // 1. Get course info
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    // 2. Create transaction record
    const newTransaction = new Transaction({
      userId,
      transactionId,
      dateTime: new Date().toISOString(),
      courseId,
      amount: amount || 0,
      paymentProvider,
    });
    await newTransaction.save();

    // 3. Create initial course progress
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

    // 4. Add enrollment to course
    if (!course.enrollments) {
      course.enrollments = [];
    }

    // Check if user is already enrolled
    const isAlreadyEnrolled = course.enrollments.some(
      (enrollment: any) => enrollment.userId === userId
    );

    if (!isAlreadyEnrolled) {
      course.enrollments.push({
        userId,
        enrolledAt: new Date().toISOString(),
      });
      await course.save();
    }

    res.status(201).json({
      message: 'Course purchased successfully',
      data: {
        transaction: newTransaction,
        courseProgress: initialProgress,
      },
    });
  } catch (error) {
    console.log('Error creating transaction and enrollment:', error);
    res.status(500).json({
      message: 'Error creating transaction and enrollment',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
