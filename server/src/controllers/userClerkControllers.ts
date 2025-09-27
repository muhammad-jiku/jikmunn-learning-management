import { Request, Response } from 'express';
import { clerkClient } from '../index';

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  const userData = req.body;
  console.log('Updating user with ID:', userId);
  console.log('User data to update:', userData);

  try {
    const user = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        userType: userData.publicMetadata.userType,
        settings: userData.publicMetadata.settings,
      },
    });
    console.log('Updated user data:', user);

    res.status(200).json({
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.log('Error updating user:', error);
    res.status(500).json({
      message: 'Error updating user',
      error,
    });
  }
};
