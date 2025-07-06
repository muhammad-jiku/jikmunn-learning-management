import { requireAuth } from '@clerk/express';
import express from 'express';
import multer from 'multer';
import {
  createCourse,
  deleteCourse,
  getCourse,
  getUploadVideoUrl,
  listCourses,
  updateCourse,
} from '../controllers/courseControllers';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/').get(listCourses).post(requireAuth(), createCourse);

router
  .route('/:courseId')
  .get(getCourse)
  .put(requireAuth(), upload.single('image'), updateCourse)
  .delete(requireAuth(), deleteCourse);

router
  .route('/:courseId/sections/:sectionId/chapters/:chapterId/get-upload-url')
  .post(requireAuth(), getUploadVideoUrl);

export default router;
