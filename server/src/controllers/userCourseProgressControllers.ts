/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { clerkClient } from '../index';
import Certificate from '../models/certificateModel';
import Course from '../models/courseModel';
import UserCourseProgress from '../models/userCourseProgressModel';
import { sendCourseCompletionEmail } from '../services/emailService';
import { calculateOverallProgress, mergeSections } from '../utils';

export const getUserEnrolledCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const enrolledCourses = await UserCourseProgress.find({ userId });

    const courseIds = enrolledCourses.map((item: any) => item.courseId);

    // Fix: Check if courseIds array is empty
    if (courseIds.length === 0) {
      res.status(200).json({
        message: 'Enrolled courses retrieved successfully',
        data: [],
      });
      return;
    }

    const courses = await Course.find({ courseId: { $in: courseIds } });

    res.status(200).json({
      message: 'Enrolled courses retrieved successfully',
      data: courses,
    });
  } catch (error) {
    logger.error('Error fetching enrolled courses', { userId, error });
    res.status(500).json({
      message: 'Error retrieving enrolled courses',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const getUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;

  try {
    const progress = await UserCourseProgress.findOne({ userId, courseId });
    if (!progress) {
      res
        .status(404)
        .json({ message: 'Course progress not found for this user' });
      return;
    }

    res.status(200).json({
      message: 'Course progress retrieved successfully',
      data: progress,
    });
  } catch (error) {
    logger.error('Error fetching course progress', { userId, courseId, error });
    res.status(500).json({
      message: 'Error retrieving user course progress',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const updateUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params as {
    userId: string;
    courseId: string;
  };

  const progressData = req.body;

  try {
    let progress = await UserCourseProgress.findOne({ userId, courseId });

    if (!progress) {
      // If no progress exists, create initial progress
      const course = await Course.findOne({ courseId });
      if (!course) {
        res.status(404).json({ message: 'Course not found' });
        return;
      }

      progress = new UserCourseProgress({
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
    } else {
      // Merge existing progress with new progress data
      progress.sections = mergeSections(
        progress.sections,
        progressData.sections || []
      );
      progress.lastAccessedTimestamp = new Date().toISOString();
      progress.overallProgress = calculateOverallProgress(progress.sections);
    }

    await progress.save();

    // Auto-generate certificate when course is 100% complete
    if (progress.overallProgress === 100) {
      try {
        const existingCert = await Certificate.findOne({ userId, courseId });
        if (!existingCert) {
          const course = await Course.findOne({ courseId });
          let userName = 'Student';
          try {
            const user = await clerkClient.users.getUser(userId);
            userName =
              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
              user.username ||
              'Student';
          } catch {
            logger.warn('Could not fetch user name for auto-certificate', {
              userId,
            });
          }

          const certificateId = uuidv4();
          const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
          const verificationUrl = `${clientUrl}/certificates/verify/${certificateId}`;

          await Certificate.create({
            certificateId,
            userId,
            courseId,
            courseName: course?.title || 'Unknown Course',
            userName,
            issuedAt: new Date(),
            verificationUrl,
          });

          logger.info('Certificate auto-generated on 100% completion', {
            certificateId,
            userId,
            courseId,
          });

          // Send course completion email (non-blocking)
          try {
            const userForEmail = await clerkClient.users.getUser(userId);
            const email = userForEmail.emailAddresses[0]?.emailAddress;
            const settings = (userForEmail.publicMetadata as any)?.settings;

            if (email && settings?.emailAlerts !== false) {
              const emailUserName =
                `${userForEmail.firstName || ''} ${userForEmail.lastName || ''}`.trim() ||
                userForEmail.username ||
                'Student';

              sendCourseCompletionEmail(
                email,
                emailUserName,
                course?.title || 'Unknown Course',
                verificationUrl,
                userId
              ).catch((err) =>
                logger.warn('Completion email failed (non-blocking)', { err })
              );
            }
          } catch (emailErr) {
            logger.warn('Could not send completion email', { emailErr });
          }
        }
      } catch (certError) {
        // Don't fail the progress update if certificate generation fails
        logger.error('Auto-certificate generation failed', {
          userId,
          courseId,
          error: certError,
        });
      }
    }

    res.status(200).json({
      message: 'User course progress updated successfully!',
      data: progress,
    });
  } catch (error) {
    logger.error('Error updating progress', { userId, courseId, error });
    res.status(500).json({
      message: 'Error updating user course progress',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
