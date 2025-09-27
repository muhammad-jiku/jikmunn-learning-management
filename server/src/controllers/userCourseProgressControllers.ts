import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import Course from '../models/courseModel';
import UserCourseProgress from '../models/userCourseProgressModel';
import { calculateOverallProgress, mergeSections } from '../utils';

export const getUserEnrolledCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const auth = getAuth(req);
  console.log('Fetching enrolled courses for user ID:', userId);
  console.log('Auth user ID:', auth?.userId);
  console.log('Auth object:', auth);

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const enrolledCourses = await UserCourseProgress.query('userId')
      .eq(userId)
      .exec();
    console.log('Enrolled courses:', enrolledCourses);

    const courseIds = enrolledCourses.map((item: any) => item.courseId);
    console.log('Course IDs:', courseIds);

    const courses = await Course.batchGet(courseIds);
    console.log('Courses details:', courses);

    res.status(200).json({
      message: 'Enrolled courses retrieved successfully',
      data: courses,
    });
  } catch (error) {
    console.log('Error fetching enrolled courses:', error);
    res.status(500).json({
      message: 'Error retrieving enrolled courses',
      error,
    });
  }
};

export const getUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;
  console.log(
    'Fetching course progress for user ID:',
    userId,
    'and course ID:',
    courseId
  );

  try {
    const progress = await UserCourseProgress.get({ userId, courseId });
    if (!progress) {
      res
        .status(404)
        .json({ message: 'Course progress not found for this user' });
      return;
    }
    console.log('Course progress details:', progress);

    res.status(200).json({
      message: 'Course progress retrieved successfully',
      data: progress,
    });
  } catch (error) {
    console.log('Error fetching course progress:', error);
    res
      .status(500)
      .json({ message: 'Error retrieving user course progress', error });
  }
};

export const updateUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;
  const progressData = req.body;

  console.log(
    'Updating course progress for user ID:',
    userId,
    'and course ID:',
    courseId
  );
  console.log('Progress data received:', progressData);
  try {
    let progress = await UserCourseProgress.get({ userId, courseId });
    console.log('Existing progress:', progress);

    if (!progress) {
      // If no progress exists, create initial progress
      progress = new UserCourseProgress({
        userId,
        courseId,
        enrollmentDate: new Date().toISOString(),
        overallProgress: 0,
        sections: progressData.sections || [],
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
    console.log('Updated progress:', progress);

    res.status(200).json({
      message: 'User course progress updated successfully!',
      data: progress,
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      message: 'Error updating user course progress',
      error,
    });
  }
};
