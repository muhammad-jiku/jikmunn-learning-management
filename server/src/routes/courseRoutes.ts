import { requireAuth } from '@clerk/express';
import express from 'express';
import {
  addComment,
  createCourse,
  deleteChapterQuiz,
  deleteComment,
  deleteCourse,
  getChapterComments,
  getChapterQuiz,
  getChapterQuizTeacher,
  getCourse,
  getUploadImageSignature,
  listCourses,
  submitQuizAnswers,
  updateCourse,
  upsertChapterQuiz,
} from '../controllers/courseControllers';
import {
  addCommentBody,
  chapterParams,
  commentParams,
  courseIdParam,
  listCoursesQuery,
  submitQuizBody,
  updateCourseBody,
  upsertQuizBody,
} from '../validators/schemas';
import { validateRequest } from '../validators/validateRequest';

const router = express.Router();

router
  .route('/')
  .get(validateRequest({ query: listCoursesQuery }), listCourses)
  .post(requireAuth(), createCourse);

router
  .route('/:courseId')
  .get(validateRequest({ params: courseIdParam }), getCourse)
  .put(
    requireAuth(),
    validateRequest({ params: courseIdParam, body: updateCourseBody }),
    updateCourse
  )
  .delete(
    requireAuth(),
    validateRequest({ params: courseIdParam }),
    deleteCourse
  );

// Cloudinary upload signature for course images
router
  .route('/:courseId/upload-signature')
  .post(
    requireAuth(),
    validateRequest({ params: courseIdParam }),
    getUploadImageSignature
  );

// Chapter comments
router
  .route('/:courseId/sections/:sectionId/chapters/:chapterId/comments')
  .get(validateRequest({ params: chapterParams }), getChapterComments)
  .post(
    requireAuth(),
    validateRequest({ params: chapterParams, body: addCommentBody }),
    addComment
  );

router
  .route(
    '/:courseId/sections/:sectionId/chapters/:chapterId/comments/:commentId'
  )
  .delete(
    requireAuth(),
    validateRequest({ params: commentParams }),
    deleteComment
  );

// Chapter quiz (student view - no correct answers)
router
  .route('/:courseId/sections/:sectionId/chapters/:chapterId/quiz')
  .get(validateRequest({ params: chapterParams }), getChapterQuiz)
  .post(
    requireAuth(),
    validateRequest({ params: chapterParams, body: upsertQuizBody }),
    upsertChapterQuiz
  )
  .delete(
    requireAuth(),
    validateRequest({ params: chapterParams }),
    deleteChapterQuiz
  );

// Chapter quiz (teacher view - includes correct answers)
router
  .route('/:courseId/sections/:sectionId/chapters/:chapterId/quiz/teacher')
  .get(
    requireAuth(),
    validateRequest({ params: chapterParams }),
    getChapterQuizTeacher
  );

// Submit quiz answers
router
  .route('/:courseId/sections/:sectionId/chapters/:chapterId/quiz/submit')
  .post(
    requireAuth(),
    validateRequest({ params: chapterParams, body: submitQuizBody }),
    submitQuizAnswers
  );

export default router;
