import { Request, Response } from 'express';
import logger from '../config/logger';
import { clerkClient } from '../index';
import Course from '../models/courseModel';

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.userId as string;
  const userData = req.body;

  try {
    if (!userData.publicMetadata) {
      logger.warn('publicMetadata is missing in request', { userId });
      res.status(400).json({
        message: 'publicMetadata is required in request body',
      });
      return;
    }

    const updateMetadata = {
      userType: userData.publicMetadata.userType || 'student',
      settings: userData.publicMetadata.settings || {},
      bio: userData.publicMetadata.bio || '',
    };

    const user = await clerkClient.users.updateUser(userId, {
      publicMetadata: updateMetadata,
    });

    logger.info('AUDIT: User metadata updated', {
      userId,
      userType: updateMetadata.userType,
    });

    // If bio was updated, also update it on all teacher's courses
    if (userData.publicMetadata.bio !== undefined) {
      await Course.updateMany(
        { teacherId: userId },
        { teacherBio: userData.publicMetadata.bio || '' }
      );
    }

    res.status(200).json({
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    logger.error('Error updating user', { userId, error });
    res.status(500).json({
      message: 'Error updating user',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
