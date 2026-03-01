import { requireAuth } from '@clerk/express';
import express from 'express';
import {
  getStudentAnalytics,
  getTeacherCourseAnalytics,
  getTeacherOverview,
} from '../controllers/analyticsControllers';
import {
  teacherCourseParams,
  teacherIdParam,
  userIdParam,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

// Teacher overview analytics
router
  .route('/teacher/:teacherId/overview')
  .get(
    requireAuth(),
    validateRequest({ params: teacherIdParam }),
    getTeacherOverview
  );

// Teacher course-specific analytics
router
  .route('/teacher/:teacherId/courses/:courseId')
  .get(
    requireAuth(),
    validateRequest({ params: teacherCourseParams }),
    getTeacherCourseAnalytics
  );

// Student analytics
router
  .route('/student/:userId')
  .get(
    requireAuth(),
    validateRequest({ params: userIdParam }),
    getStudentAnalytics
  );

export default router;
