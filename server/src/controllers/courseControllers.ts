import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAuth } from '@clerk/express';
// import AWS from 'aws-sdk';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Course from '../models/courseModel';

// const s3 = new AWS.S3();

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
      error,
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
      error,
    });
  }
};

export const createCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { teacherId, teacherName } = req.body;

    if (!teacherId || !teacherName) {
      res.status(400).json({ message: 'Teacher Id and name are required' });
      return;
    }

    const newCourse = new Course({
      courseId: uuidv4(),
      teacherId,
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
      error,
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
      res
        .status(403)
        .json({ message: 'Not authorized to update this course ' });
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
    res.status(500).json({ message: 'Error updating course', error });
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
      res
        .status(403)
        .json({ message: 'Not authorized to delete this course ' });
      return;
    }

    await Course.delete(courseId);

    res.status(200).json({
      message: 'Course deleted successfully',
      data: course,
    });
  } catch (error) {
    console.log('Error deleting course:', error);
    res.status(500).json({ message: 'Error deleting course', error });
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

  // console.log('🔍 getUploadVideoUrl - Received request:', {
  //   params: req.params,
  //   body: req.body,
  //   resolvedIds: { courseId, sectionId, chapterId },
  // });

  // Validate all required fields
  if (!fileName || !fileType || !courseId || !sectionId || !chapterId) {
    // console.log('❌ Missing required fields:', {
    //   fileName,
    //   fileType,
    //   courseId,
    //   sectionId,
    //   chapterId,
    // });
    res.status(400).json({
      message: 'All fields are required',
      received: { fileName, fileType, courseId, sectionId, chapterId },
    });
    return;
  }

  try {
    // console.log('🔧 Creating S3 client...');
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const sanitizedFileName = sanitizeFilename(fileName);
    const uniqueId = uuidv4();
    const s3Key = `courses/${courseId}/sections/${sectionId}/chapters/${chapterId}/${uniqueId}-${sanitizedFileName}`;

    // console.log('🗂️  Generated S3 key:', s3Key);

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3Key,
      ContentType: fileType,
    });

    // console.log('🔗 Generating signed URL...');
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN!;
    const videoUrl = cloudfrontDomain.startsWith('https://')
      ? `${cloudfrontDomain}/${s3Key}`
      : `https://${cloudfrontDomain}/${s3Key}`;

    // console.log('✅ Generated URLs:', {
    //   uploadUrl: uploadUrl.substring(0, 100) + '...',
    //   videoUrl,
    // });

    res.status(200).json({
      message: 'Upload URL generated successfully',
      data: { uploadUrl, videoUrl },
    });
  } catch (error) {
    console.log('💥 Error generating upload URL:', error);
    res.status(500).json({
      message: 'Error generating upload URL',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
