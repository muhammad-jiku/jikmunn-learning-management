import { getAuth } from '@clerk/express';
import AWS from 'aws-sdk';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Course from '../models/courseModel';

const s3 = new AWS.S3();

const sanitizeFilename = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // keep ., -, _
    .replace(/_{2,}/g, '_');

export const listCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { category } = req.query;
  console.log('fetching courses with category:', category);

  try {
    const courses =
      category && category !== 'all'
        ? await Course.scan('category').eq(category).exec()
        : await Course.scan().exec();
    console.log('list of courses:', courses);

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
  console.log('Fetching course with ID:', courseId);

  try {
    const course = await Course.get(courseId);
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }
    console.log('Course details:', course);

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
    console.log('Creating course for teacher:', req.body);

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
    console.log('New course created:', newCourse);

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

  console.log('Updating course with ID:', courseId, 'with data:', updateData);
  console.log('Authenticated user ID:', userId);

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
    console.log('updated course data:', updateData);
    console.log('Course updated:', course);

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

  console.log('Deleting course with ID:', courseId);
  console.log('Authenticated user ID:', userId);

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
    console.log('Course to be deleted:', course);

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
  const { fileName, fileType } = req.body;
  console.log(
    'Generating upload URL for file:',
    fileName,
    'of type:',
    fileType
  );

  if (!fileName || !fileType) {
    res.status(400).json({ message: 'File name and type are required' });
    return;
  }

  try {
    const uniqueId = uuidv4();
    const s3Key = `videos/${uniqueId}/${fileName}`;

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME || '',
      Key: s3Key,
      Expires: 60,
      ContentType: fileType,
    };
    console.log('S3 upload parameters:', s3Params);

    const uploadUrl = s3.getSignedUrl('putObject', s3Params);
    const videoUrl = `${process.env.CLOUDFRONT_DOMAIN}/videos/${uniqueId}/${fileName}`;
    console.log('Generated upload URL:', uploadUrl);
    console.log('Video will be accessible at URL:', videoUrl);

    res.status(200).json({
      message: 'Upload URL generated successfully',
      data: { uploadUrl, videoUrl },
    });
  } catch (error) {
    console.log('Error generating upload URL:', error);
    res.status(500).json({ message: 'Error generating upload URL', error });
  }
};
