import express from 'express';
import multer from 'multer';
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from '../controllers/courseControllers';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/').get(listCourses).post(createCourse);

router
  .route('/:courseId')
  .get(getCourse)
  .put(upload.single('image'), updateCourse)
  .delete(deleteCourse);

export default router;
