import express from 'express';
import {
  getUserCourseProgress,
  getUserEnrolledCourses,
  updateUserCourseProgress,
} from '../controllers/userCourseProgressControllers';

const router = express.Router();

router.route('/:userId/enrolled-courses').get(getUserEnrolledCourses);

router
  .route('/:userId/courses/:courseId')
  .get(getUserCourseProgress)
  .put(updateUserCourseProgress);

export default router;
