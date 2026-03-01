/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import logger from '../config/logger';
import Certificate from '../models/certificateModel';
import Course from '../models/courseModel';
import Review from '../models/reviewModel';
import Transaction from '../models/transactionModel';
import UserCourseProgress from '../models/userCourseProgressModel';

// ─── Teacher Overview Analytics ─────────────────────────────────────────────────

export const getTeacherOverview = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { teacherId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== teacherId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    // Get all courses by this teacher
    const courses = await Course.find({ teacherId });
    const courseIds = courses.map((c) => c.courseId);

    // Total students (unique enrollments across all courses)
    const totalStudents = courses.reduce(
      (sum, course) => sum + (course.enrollments?.length || 0),
      0
    );

    // Total revenue from transactions for teacher's courses
    const transactions = await Transaction.find({
      courseId: { $in: courseIds },
    });
    const totalRevenue = transactions.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0
    );

    // Average rating across all courses (from Review model)
    let averageRating = 0;
    let totalReviews = 0;
    if (courseIds.length > 0) {
      const reviews = await Review.find({ courseId: { $in: courseIds } });
      totalReviews = reviews.length;
      if (totalReviews > 0) {
        averageRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      }
    }

    // Enrollment trend (last 12 months)
    const enrollmentsTrend = getEnrollmentsTrend(courses);

    // Revenue trend (last 12 months)
    const revenueTrend = getRevenueTrend(transactions);

    // Course performance summary
    const coursePerformance = await Promise.all(
      courses.map(async (course) => {
        const progressRecords = await UserCourseProgress.find({
          courseId: course.courseId,
        });
        const completedCount = progressRecords.filter(
          (p) => p.overallProgress === 100
        ).length;
        const avgProgress =
          progressRecords.length > 0
            ? progressRecords.reduce((sum, p) => sum + p.overallProgress, 0) /
              progressRecords.length
            : 0;

        return {
          courseId: course.courseId,
          title: course.title,
          enrollments: course.enrollments?.length || 0,
          completionRate:
            progressRecords.length > 0
              ? Math.round((completedCount / progressRecords.length) * 100)
              : 0,
          averageProgress: Math.round(avgProgress),
          revenue: transactions
            .filter((tx) => tx.courseId === course.courseId)
            .reduce((sum, tx) => sum + (tx.amount || 0), 0),
          status: course.status,
        };
      })
    );

    res.status(200).json({
      message: 'Teacher analytics retrieved successfully',
      data: {
        totalStudents,
        totalRevenue,
        totalCourses: courses.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        enrollmentsTrend,
        revenueTrend,
        coursePerformance,
      },
    });
  } catch (error) {
    logger.error('Error fetching teacher analytics', { teacherId, error });
    res.status(500).json({
      message: 'Error retrieving teacher analytics',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// ─── Teacher Course Analytics ───────────────────────────────────────────────────

export const getTeacherCourseAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { teacherId, courseId } = req.params;
  const auth = getAuth(req);

  if (!auth || auth.userId !== teacherId) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  try {
    const course = await Course.findOne({ courseId, teacherId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    // Enrollment count
    const enrollments = course.enrollments?.length || 0;

    // Revenue for this course
    const transactions = await Transaction.find({ courseId });
    const revenue = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Progress data
    const progressRecords = await UserCourseProgress.find({ courseId });
    const completedCount = progressRecords.filter(
      (p) => p.overallProgress === 100
    ).length;
    const completionRate =
      progressRecords.length > 0
        ? Math.round((completedCount / progressRecords.length) * 100)
        : 0;
    const averageProgress =
      progressRecords.length > 0
        ? Math.round(
            progressRecords.reduce((sum, p) => sum + p.overallProgress, 0) /
              progressRecords.length
          )
        : 0;

    // Progress distribution (0-25%, 25-50%, 50-75%, 75-100%)
    const progressDistribution = [
      { range: '0-25%', count: 0 },
      { range: '25-50%', count: 0 },
      { range: '50-75%', count: 0 },
      { range: '75-100%', count: 0 },
    ];
    for (const record of progressRecords) {
      if (record.overallProgress <= 25) progressDistribution[0].count++;
      else if (record.overallProgress <= 50) progressDistribution[1].count++;
      else if (record.overallProgress <= 75) progressDistribution[2].count++;
      else progressDistribution[3].count++;
    }

    // Chapter stats - how many students completed each chapter
    const chapterStats: {
      chapterId: string;
      chapterTitle: string;
      sectionTitle: string;
      completions: number;
      totalStudents: number;
    }[] = [];

    for (const section of course.sections) {
      for (const chapter of section.chapters) {
        let completions = 0;
        for (const record of progressRecords) {
          const sectionProgress = record.sections.find(
            (s: any) => s.sectionId === section.sectionId
          );
          if (sectionProgress) {
            const chapterProgress = sectionProgress.chapters.find(
              (c: any) => c.chapterId === chapter.chapterId
            );
            if (chapterProgress?.completed) completions++;
          }
        }
        chapterStats.push({
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          sectionTitle: section.sectionTitle,
          completions,
          totalStudents: progressRecords.length,
        });
      }
    }

    // Certificates issued
    const certificatesIssued = await Certificate.countDocuments({ courseId });

    res.status(200).json({
      message: 'Course analytics retrieved successfully',
      data: {
        courseId,
        title: course.title,
        enrollments,
        revenue,
        completionRate,
        averageProgress,
        progressDistribution,
        chapterStats,
        certificatesIssued,
      },
    });
  } catch (error) {
    logger.error('Error fetching course analytics', {
      teacherId,
      courseId,
      error,
    });
    res.status(500).json({
      message: 'Error retrieving course analytics',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// ─── Student Analytics ──────────────────────────────────────────────────────────

export const getStudentAnalytics = async (
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
    // Get all progress records for this student
    const progressRecords = await UserCourseProgress.find({ userId });
    const courseIds = progressRecords.map((p) => p.courseId);

    // Get courses
    const courses =
      courseIds.length > 0
        ? await Course.find({ courseId: { $in: courseIds } })
        : [];

    // Total courses enrolled
    const totalCoursesEnrolled = progressRecords.length;

    // Completed courses
    const completedCourses = progressRecords.filter(
      (p) => p.overallProgress === 100
    ).length;

    // In-progress courses
    const inProgressCourses = progressRecords.filter(
      (p) => p.overallProgress > 0 && p.overallProgress < 100
    ).length;

    // Average progress
    const averageProgress =
      progressRecords.length > 0
        ? Math.round(
            progressRecords.reduce((sum, p) => sum + p.overallProgress, 0) /
              progressRecords.length
          )
        : 0;

    // Total chapters completed
    const totalChaptersCompleted = progressRecords.reduce((sum, p) => {
      return (
        sum +
        p.sections.reduce(
          (sSum: number, s: any) =>
            sSum + s.chapters.filter((c: any) => c.completed).length,
          0
        )
      );
    }, 0);

    // Total chapters across enrolled courses
    const totalChapters = courses.reduce(
      (sum, c) =>
        sum + c.sections.reduce((sSum, s) => sSum + s.chapters.length, 0),
      0
    );

    // Certificates earned
    const certificates = await Certificate.find({ userId });

    // Course progress details
    const courseProgress = progressRecords.map((record) => {
      const course = courses.find((c) => c.courseId === record.courseId);
      return {
        courseId: record.courseId,
        title: course?.title || 'Unknown Course',
        category: course?.category || 'Unknown',
        overallProgress: record.overallProgress,
        enrollmentDate: record.enrollmentDate,
        lastAccessedTimestamp: record.lastAccessedTimestamp,
        hasCertificate: certificates.some(
          (c) => c.courseId === record.courseId
        ),
      };
    });

    // Learning activity - last 30 days based on lastAccessedTimestamp
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = progressRecords
      .filter(
        (p) =>
          p.lastAccessedTimestamp &&
          new Date(p.lastAccessedTimestamp) >= thirtyDaysAgo
      )
      .sort(
        (a, b) =>
          new Date(b.lastAccessedTimestamp).getTime() -
          new Date(a.lastAccessedTimestamp).getTime()
      );

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    for (const course of courses) {
      categoryDistribution[course.category] =
        (categoryDistribution[course.category] || 0) + 1;
    }
    const categoryData = Object.entries(categoryDistribution).map(
      ([name, value]) => ({ name, value })
    );

    res.status(200).json({
      message: 'Student analytics retrieved successfully',
      data: {
        totalCoursesEnrolled,
        completedCourses,
        inProgressCourses,
        averageProgress,
        totalChaptersCompleted,
        totalChapters,
        certificatesEarned: certificates.length,
        courseProgress,
        recentActivityCount: recentActivity.length,
        categoryDistribution: categoryData,
      },
    });
  } catch (error) {
    logger.error('Error fetching student analytics', { userId, error });
    res.status(500).json({
      message: 'Error retrieving student analytics',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// ─── Helper Functions ───────────────────────────────────────────────────────────

function getEnrollmentsTrend(
  courses: any[]
): { date: string; count: number }[] {
  const monthMap = new Map<string, number>();
  const now = new Date();

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, 0);
  }

  // Count enrollments per month
  for (const course of courses) {
    for (const enrollment of course.enrollments || []) {
      if (enrollment.enrolledAt) {
        const date = new Date(enrollment.enrolledAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap.has(key)) {
          monthMap.set(key, (monthMap.get(key) || 0) + 1);
        }
      }
    }
  }

  return Array.from(monthMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

function getRevenueTrend(
  transactions: any[]
): { date: string; revenue: number }[] {
  const monthMap = new Map<string, number>();
  const now = new Date();

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, 0);
  }

  // Sum revenue per month
  for (const tx of transactions) {
    if (tx.dateTime) {
      const date = new Date(tx.dateTime);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + (tx.amount || 0));
      }
    }
  }

  return Array.from(monthMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));
}
