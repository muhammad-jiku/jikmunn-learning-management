import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAuth } from '@clerk/express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clerkClient } from '..';
import Course from '../models/courseModel';

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.\-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

export const listCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { category } = req.query;

  try {
    const courses =
      category && category !== 'all'
        ? await Course.scan('category').eq(category).exec()
        : await Course.scan().exec();

    res.status(200).json({
      message: 'Courses retrieved successfully',
      data: courses,
    });
  } catch (error) {
    console.log('Error fetching courses:', error);
    res.status(500).json({
      message: 'Error retrieving courses',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const getCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    res.status(200).json({
      message: 'Course retrieved successfully',
      data: course,
    });
  } catch (error) {
    console.log('Error fetching course:', error);
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
    try {
      const user = await clerkClient.users.getUser(userId);
      teacherName =
        user.fullName ||
        `${user.firstName} ${user.lastName}`.trim() ||
        'Unknown Teacher';
    } catch (error) {
      console.log('Error fetching user from Clerk:', error);
      // Continue with default name if Clerk call fails
    }

    const newCourse = new Course({
      courseId: uuidv4(),
      teacherId: userId,
      teacherName,
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

    res.status(201).json({
      message: 'Course created successfully',
      data: newCourse,
    });
  } catch (error) {
    console.log('Error creating course:', error);
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
    const course = await Course.get(courseId);
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
    console.log('Error updating course:', error);
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
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (course.teacherId !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this course' });
      return;
    }

    await Course.delete(courseId);

    res.status(200).json({
      message: 'Course deleted successfully',
      data: course,
    });
  } catch (error) {
    console.log('Error deleting course:', error);
    res.status(500).json({
      message: 'Error deleting course',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

export const getUploadVideoUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    courseId: paramCourseId,
    sectionId: paramSectionId,
    chapterId: paramChapterId,
  } = req.params;
  const {
    fileName,
    fileType,
    courseId: bodyCourseId,
    sectionId: bodySectionId,
    chapterId: bodyChapterId,
  } = req.body;

  const courseId = paramCourseId || bodyCourseId;
  const sectionId = paramSectionId || bodySectionId;
  const chapterId = paramChapterId || bodyChapterId;

  // ✅ FIX: Better error logging
  console.log('🔍 Upload URL Request:', {
    params: req.params,
    body: req.body,
    resolved: { courseId, sectionId, chapterId, fileName, fileType },
  });

  if (!fileName || !fileType || !courseId || !sectionId || !chapterId) {
    console.log('❌ Missing required fields:', {
      fileName: !!fileName,
      fileType: !!fileType,
      courseId: !!courseId,
      sectionId: !!sectionId,
      chapterId: !!chapterId,
    });

    res.status(400).json({
      message: 'All fields are required',
      received: {
        fileName: fileName || 'undefined',
        fileType: fileType || 'undefined',
        courseId: courseId || 'undefined',
        sectionId: sectionId || 'undefined',
        chapterId: chapterId || 'undefined',
      },
      required: ['fileName', 'fileType', 'courseId', 'sectionId', 'chapterId'],
    });
    return;
  }

  try {
    // ✅ FIX: Use environment variables safely
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    const bucketName = process.env.S3_BUCKET_NAME;
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;

    if (!bucketName || !cloudfrontDomain) {
      throw new Error(
        'S3_BUCKET_NAME or CLOUDFRONT_DOMAIN environment variables are not set'
      );
    }

    const s3Client = new S3Client({
      region: region,
      // Remove explicit credentials - Lambda will use its execution role
      // for local development
      // credentials: {
      //   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      // },
    });

    const sanitizedFileName = sanitizeFilename(fileName);
    const uniqueId = uuidv4();
    const s3Key = `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/${uniqueId}-${sanitizedFileName}`;

    console.log('🗂️ Generated S3 key:', s3Key);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    const videoUrl = cloudfrontDomain.startsWith('https://')
      ? `${cloudfrontDomain}/${s3Key}`
      : `https://${cloudfrontDomain}/${s3Key}`;

    console.log('✅ Generated URLs:', {
      uploadUrl: uploadUrl.substring(0, 100) + '...',
      videoUrl,
    });

    res.status(200).json({
      message: 'Upload URL generated successfully',
      data: { uploadUrl, videoUrl },
    });
  } catch (error) {
    console.log('💥 Error generating upload URL:', error);
    res.status(500).json({
      message: 'Error generating upload URL',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
