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

  if (!auth || auth.userId !== userId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const enrolledCourses = await UserCourseProgress.query('userId')
      .eq(userId)
      .exec();

    const courseIds = enrolledCourses.map((item: any) => item.courseId);

    // Fix: Check if courseIds array is empty
    if (courseIds.length === 0) {
      res.status(200).json({
        message: 'Enrolled courses retrieved successfully',
        data: [],
      });
      return;
    }

    const courses = await Course.batchGet(courseIds);

    res.status(200).json({
      message: 'Enrolled courses retrieved successfully',
      data: courses,
    });
  } catch (error) {
    console.log('Error fetching enrolled courses:', error);
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
    const progress = await UserCourseProgress.get({ userId, courseId });
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
    console.log('Error fetching course progress:', error);
    res.status(500).json({
      message: 'Error retrieving user course progress',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// export const updateUserCourseProgress = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const { userId, courseId } = req.params;
//   const progressData = req.body;

//   try {
//     let progress = await UserCourseProgress.get({ userId, courseId });

//     if (!progress) {
//       // If no progress exists, create initial progress
//       const course = await Course.get(courseId);
//       if (!course) {
//         res.status(404).json({ message: 'Course not found' });
//         return;
//       }

//       progress = new UserCourseProgress({
//         userId,
//         courseId,
//         enrollmentDate: new Date().toISOString(),
//         overallProgress: 0,
//         sections: course.sections.map((section: any) => ({
//           sectionId: section.sectionId,
//           chapters: section.chapters.map((chapter: any) => ({
//             chapterId: chapter.chapterId,
//             completed: false,
//           })),
//         })),
//         lastAccessedTimestamp: new Date().toISOString(),
//       });
//     } else {
//       // Merge existing progress with new progress data
//       progress.sections = mergeSections(
//         progress.sections,
//         progressData.sections || []
//       );
//       progress.lastAccessedTimestamp = new Date().toISOString();
//       progress.overallProgress = calculateOverallProgress(progress.sections);
//     }

//     await progress.save();

//     res.status(200).json({
//       message: 'User course progress updated successfully!',
//       data: progress,
//     });
//   } catch (error) {
//     console.log('Error updating progress:', error);
//     res.status(500).json({
//       message: 'Error updating user course progress',
//       error: error instanceof Error ? error.message : 'Unknown error occurred',
//     });
//   }
// };

export const updateUserCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, courseId } = req.params;

  // ✅ ADD: Lambda body parsing
  let requestBody = req.body;
  if (Buffer.isBuffer(req.body)) {
    try {
      requestBody = JSON.parse(req.body.toString());
    } catch (parseError) {
      console.log(
        '❌ Error parsing progress update Buffer to JSON:',
        parseError
      );
      res.status(400).json({
        message: 'Invalid JSON body',
      });
      return;
    }
  }

  const progressData = requestBody;

  try {
    let progress = await UserCourseProgress.get({ userId, courseId });

    if (!progress) {
      // If no progress exists, create initial progress
      const course = await Course.get(courseId);
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

    res.status(200).json({
      message: 'User course progress updated successfully!',
      data: progress,
    });
  } catch (error) {
    console.log('Error updating progress:', error);
    res.status(500).json({
      message: 'Error updating user course progress',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
