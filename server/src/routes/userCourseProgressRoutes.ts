import express from 'express';
import {
  getUserCourseProgress,
  getUserEnrolledCourses,
  updateUserCourseProgress,
} from '../controllers/userCourseProgressControllers';
import {
  updateProgressBody,
  userCourseParams,
  userIdParam,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

router
  .route('/:userId/enrolled-courses')
  .get(validateRequest({ params: userIdParam }), getUserEnrolledCourses);

router
  .route('/:userId/courses/:courseId')
  .get(validateRequest({ params: userCourseParams }), getUserCourseProgress)
  .put(
    validateRequest({ params: userCourseParams, body: updateProgressBody }),
    updateUserCourseProgress
  );

export default router;
