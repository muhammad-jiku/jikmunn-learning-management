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
  // Extract from URL parameters (these should always be present)
  const { courseId, sectionId, chapterId } = req.params;

  // ✅ FIX: Parse the body from Buffer to JSON if needed
  let body = req.body;

  // If body is a Buffer, parse it to JSON
  if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString());
      console.log('✅ Parsed body from Buffer to JSON:', body);
    } catch (parseError) {
      console.log('❌ Error parsing Buffer to JSON:', parseError);
      res.status(400).json({
        message: 'Invalid JSON body',
        error:
          parseError instanceof Error
            ? parseError.message
            : 'Unknown parse error',
      });
      return;
    }
  }

  // Extract from request body (now properly parsed)
  const { fileName, fileType, fileSize } = body;

  // ✅ FIX: Better logging with all data
  console.log('🔍 Upload URL Request:', {
    params: req.params,
    body: body,
    extracted: { courseId, sectionId, chapterId, fileName, fileType, fileSize },
  });

  // ✅ FIX: Improved validation with specific error messages
  const missingFields = [];
  if (!fileName) missingFields.push('fileName');
  if (!fileType) missingFields.push('fileType');
  if (!courseId) missingFields.push('courseId');
  if (!sectionId) missingFields.push('sectionId');
  if (!chapterId) missingFields.push('chapterId');

  if (missingFields.length > 0) {
    console.log('❌ Missing required fields:', missingFields);

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
      missing: missingFields,
    });
    return;
  }

  // ✅ FIX: Validate file type
  if (!fileType.startsWith('video/')) {
    res.status(400).json({
      message: 'Invalid file type. Only video files are allowed.',
      received: fileType,
    });
    return;
  }

  // ✅ FIX: Validate file size (optional - 500MB limit)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (fileSize && fileSize > maxSize) {
    res.status(400).json({
      message: 'File too large. Maximum size is 500MB.',
      received: fileSize,
      maxAllowed: maxSize,
    });
    return;
  }

  try {
    // ✅ FIX: Use environment variables safely with fallbacks
    const bucketName = process.env.S3_BUCKET_NAME;
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;

    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is not set');
    }

    if (!cloudfrontDomain) {
      throw new Error('CLOUDFRONT_DOMAIN environment variable is not set');
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      // lambda will use it from iam role
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
      Metadata: {
        'course-id': courseId,
        'section-id': sectionId,
        'chapter-id': chapterId,
        'original-filename': fileName,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // ✅ FIX: Ensure proper URL formatting
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
