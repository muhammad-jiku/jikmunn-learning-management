/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clerkClient } from '..';
import { generateUploadSignature } from '../config/cloudinary';
import logger from '../config/logger';
import Course from '../models/courseModel';

export const listCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { category } = req.query;

  try {
    const query =
      category && category !== 'all' ? { category, status: 'Published' } : {};

    const courses = await Course.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Courses retrieved successfully',
      data: courses,
    });
  } catch (error) {
    logger.error('Error fetching courses', { error });
    res.status(500).json({
      message: 'Error retrieving courses',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const getCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;

  try {
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    res.status(200).json({
      message: 'Course retrieved successfully',
      data: course,
    });
  } catch (error) {
    logger.error('Error fetching course', { courseId, error });
    res.status(500).json({
      message: 'Error retrieving course',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const createCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Get teacher info from Clerk
    let teacherName = 'Unknown Teacher';
    let teacherBio = '';
    try {
      const user = await clerkClient.users.getUser(userId);
      teacherName =
        user.fullName ||
        `${user.firstName} ${user.lastName}`.trim() ||
        'Unknown Teacher';
      teacherBio = (user.publicMetadata as { bio?: string })?.bio || '';
    } catch (error) {
      logger.warn('Error fetching user from Clerk', { userId, error });
    }

    const newCourse = new Course({
      courseId: uuidv4(),
      teacherId: userId,
      teacherName,
      teacherBio,
      title: 'Untitled Course',
      description: '',
      category: 'Uncategorized',
      image: '',
      price: 0,
      level: 'Beginner',
      status: 'Draft',
      sections: [],
      enrollments: [],
    });
    await newCourse.save();

    logger.info('AUDIT: Course created', {
      courseId: newCourse.courseId,
      teacherId: userId,
    });

    res.status(201).json({
      message: 'Course created successfully',
      data: newCourse,
    });
  } catch (error) {
    logger.error('Error creating course', { error });
    res.status(500).json({
      message: 'Error creating course',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const updateCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const updateData = { ...req.body };
  const { userId } = getAuth(req);

  try {
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: 'Not authorized to update this course' });
      return;
    }

    if (updateData.price) {
      const price = parseInt(updateData.price);
      if (isNaN(price)) {
        res.status(400).json({
          message: 'Invalid price format',
          error: 'Price must be a valid number',
        });
        return;
      }
      updateData.price = price * 100;
    }

    if (updateData.sections) {
      const sectionsData =
        typeof updateData.sections === 'string'
          ? JSON.parse(updateData.sections)
          : updateData.sections;

      updateData.sections = sectionsData.map((section: any) => ({
        ...section,
        sectionId: section.sectionId || uuidv4(),
        chapters: section.chapters.map((chapter: any) => ({
          ...chapter,
          chapterId: chapter.chapterId || uuidv4(),
        })),
      }));
    }

    Object.assign(course, updateData);
    await course.save();

    res.status(200).json({
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    logger.error('Error updating course', { courseId, error });
    res.status(500).json({
      message: 'Error updating course',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this course' });
      return;
    }

    await Course.deleteOne({ courseId });

    logger.info('AUDIT: Course deleted', { courseId, teacherId: userId });

    res.status(200).json({
      message: 'Course deleted successfully',
      data: course,
    });
  } catch (error) {
    logger.error('Error deleting course', { courseId, error });
    res.status(500).json({
      message: 'Error deleting course',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Add a comment to a chapter
 */
export const addComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);
  const { text } = req.body;

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({ message: 'Comment text is required' });
      return;
    }

    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: 'Section not found' });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: 'Chapter not found' });
      return;
    }

    // Get commenter name from Clerk
    let userName = 'Anonymous';
    try {
      const user = await clerkClient.users.getUser(userId);
      userName =
        user.fullName ||
        `${user.firstName} ${user.lastName}`.trim() ||
        'Anonymous';
    } catch {
      // fallback to Anonymous
    }

    const newComment = {
      commentId: uuidv4(),
      userId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    chapter.comments.push(newComment);
    await course.save();

    res.status(201).json({
      message: 'Comment added successfully',
      data: { ...newComment, userName },
    });
  } catch (error) {
    logger.error('Error adding comment', { courseId, chapterId, error });
    res.status(500).json({
      message: 'Error adding comment',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Get comments for a chapter
 */
export const getChapterComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;

  try {
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: 'Section not found' });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: 'Chapter not found' });
      return;
    }

    // Enrich comments with user names from Clerk
    const enrichedComments = await Promise.all(
      (chapter.comments || []).map(async (comment: any) => {
        let userName = 'Anonymous';
        try {
          const user = await clerkClient.users.getUser(comment.userId);
          userName =
            user.fullName ||
            `${user.firstName} ${user.lastName}`.trim() ||
            'Anonymous';
        } catch {
          // fallback to Anonymous
        }
        return {
          commentId: comment.commentId,
          userId: comment.userId,
          text: comment.text,
          timestamp: comment.timestamp,
          userName,
        };
      })
    );

    res.status(200).json({
      message: 'Comments retrieved successfully',
      data: enrichedComments,
    });
  } catch (error) {
    logger.error('Error fetching comments', { courseId, chapterId, error });
    res.status(500).json({
      message: 'Error retrieving comments',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Delete a comment from a chapter
 */
export const deleteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId, commentId } = req.params;
  const { userId } = getAuth(req);

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: 'Section not found' });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: 'Chapter not found' });
      return;
    }

    const commentIndex = chapter.comments.findIndex(
      (c: any) => c.commentId === commentId
    );
    if (commentIndex === -1) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Only the comment author or course teacher can delete
    const comment = chapter.comments[commentIndex];
    if (comment.userId !== userId && course.teacherId !== userId) {
      res
        .status(403)
        .json({ message: 'Not authorized to delete this comment' });
      return;
    }

    chapter.comments.splice(commentIndex, 1);
    await course.save();

    logger.info('AUDIT: Comment deleted', {
      courseId,
      commentId,
      deletedBy: userId,
    });

    res.status(200).json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting comment', { courseId, commentId, error });
    res.status(500).json({
      message: 'Error deleting comment',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Generate a Cloudinary upload signature for course images
 */
export const getUploadImageSignature = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId } = req.params;
  const { userId } = getAuth(req);

  try {
    // Verify user owns the course
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const folder = `courses/${courseId}`;
    const signatureData = generateUploadSignature(folder, 'image');

    res.status(200).json({
      message: 'Upload signature generated successfully',
      data: signatureData,
    });
  } catch (error) {
    logger.error('Error generating upload signature', { courseId, error });
    res.status(500).json({
      message: 'Error generating upload signature',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

// =====================
// QUIZ ENDPOINTS
// =====================

/**
 * Get quiz for a chapter
 */
export const getChapterQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;

  try {
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: 'Section not found' });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: 'Chapter not found' });
      return;
    }

    if (!chapter.quiz) {
      res.status(404).json({ message: 'No quiz found for this chapter' });
      return;
    }

    // Return quiz WITHOUT correct answers for students
    const quizForStudent = {
      quizId: chapter.quiz.quizId,
      title: chapter.quiz.title,
      passingScore: chapter.quiz.passingScore,
      timeLimit: chapter.quiz.timeLimit,
      questions: chapter.quiz.questions.map((q: any) => ({
        questionId: q.questionId,
        text: q.text,
        type: q.type,
        options: q.options,
        points: q.points,
        // correctAnswer is intentionally omitted
      })),
    };

    res.status(200).json({
      message: 'Quiz retrieved successfully',
      data: quizForStudent,
    });
  } catch (error) {
    logger.error('Error fetching quiz', { courseId, chapterId, error });
    res.status(500).json({
      message: 'Error retrieving quiz',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Get quiz for a chapter (teacher view - includes correct answers)
 */
export const getChapterQuizTeacher = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);

  try {
    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: 'Section not found' });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: 'Chapter not found' });
      return;
    }

    res.status(200).json({
      message: 'Quiz retrieved successfully',
      data: chapter.quiz || null,
    });
  } catch (error) {
    logger.error('Error fetching quiz (teacher)', {
      courseId,
      chapterId,
      error,
    });
    res.status(500).json({
      message: 'Error retrieving quiz',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Create or update a quiz for a chapter
 */
export const upsertChapterQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);
  const quizData = req.body;

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: 'Section not found' });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: 'Chapter not found' });
      return;
    }

    // Validate quiz data
    if (
      !quizData.title ||
      !quizData.questions ||
      quizData.questions.length === 0
    ) {
      res.status(400).json({
        message: 'Quiz must have a title and at least one question',
      });
      return;
    }

    // Validate each question
    for (const q of quizData.questions) {
      if (!q.text || !q.correctAnswer) {
        res.status(400).json({
          message: 'Each question must have text and a correct answer',
        });
        return;
      }
      if (
        q.type === 'multiple-choice' &&
        (!q.options || q.options.length < 2)
      ) {
        res.status(400).json({
          message: 'Multiple-choice questions must have at least 2 options',
        });
        return;
      }
    }

    const quiz = {
      quizId: chapter.quiz?.quizId || uuidv4(),
      title: quizData.title,
      questions: quizData.questions.map((q: any) => ({
        questionId: q.questionId || uuidv4(),
        text: q.text,
        type: q.type || 'multiple-choice',
        options: q.type === 'true-false' ? ['True', 'False'] : q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
      })),
      passingScore: quizData.passingScore || 70,
      timeLimit: quizData.timeLimit || undefined,
    };

    chapter.quiz = quiz;
    await course.save();

    res.status(200).json({
      message: chapter.quiz
        ? 'Quiz updated successfully'
        : 'Quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    logger.error('Error saving quiz', { courseId, chapterId, error });
    res.status(500).json({
      message: 'Error saving quiz',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Delete a quiz from a chapter
 */
export const deleteChapterQuiz = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: 'Section not found' });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter) {
      res.status(404).json({ message: 'Chapter not found' });
      return;
    }

    chapter.quiz = undefined;
    await course.save();

    res.status(200).json({
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting quiz', { courseId, chapterId, error });
    res.status(500).json({
      message: 'Error deleting quiz',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Submit quiz answers and get graded result
 */
export const submitQuizAnswers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { courseId, sectionId, chapterId } = req.params;
  const { userId } = getAuth(req);
  const { answers } = req.body; // { questionId: selectedAnswer }

  try {
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ message: 'Answers object is required' });
      return;
    }

    const course = await Course.findOne({ courseId });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const section = course.sections.find((s: any) => s.sectionId === sectionId);
    if (!section) {
      res.status(404).json({ message: 'Section not found' });
      return;
    }

    const chapter = section.chapters.find(
      (c: any) => c.chapterId === chapterId
    );
    if (!chapter || !chapter.quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    const quiz = chapter.quiz;

    // Grade the quiz
    let earnedPoints = 0;
    let totalPoints = 0;
    const questionResults = quiz.questions.map((q: any) => {
      totalPoints += q.points;
      const userAnswer = answers[q.questionId];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) earnedPoints += q.points;

      return {
        questionId: q.questionId,
        userAnswer: userAnswer || null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        points: q.points,
        earnedPoints: isCorrect ? q.points : 0,
      };
    });

    const percentage =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const result = {
      quizId: quiz.quizId,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      passingScore: quiz.passingScore,
      questionResults,
      submittedAt: new Date().toISOString(),
    };

    res.status(200).json({
      message: passed
        ? 'Congratulations! You passed the quiz!'
        : 'Quiz submitted. Keep studying and try again!',
      data: result,
    });
  } catch (error) {
    logger.error('Error submitting quiz', { courseId, chapterId, error });
    res.status(500).json({
      message: 'Error submitting quiz',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
