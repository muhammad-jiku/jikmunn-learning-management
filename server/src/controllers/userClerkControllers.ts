import { Request, Response } from 'express';
import { clerkClient } from '../index';

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;

  // ✅ ADD: Lambda body parsing
  let requestBody = req.body;
  if (Buffer.isBuffer(req.body)) {
    try {
      requestBody = JSON.parse(req.body.toString());
      // console.log(
      //   '✅ Parsed user update body from Buffer to JSON:',
      //   requestBody
      // );
    } catch (parseError) {
      console.log('❌ Error parsing user update Buffer to JSON:', parseError);
      res.status(400).json({
        message: 'Invalid JSON body',
      });
      return;
    }
  }

  const userData = requestBody;
  // console.log('🔍 User update request:', { userId, userData });

  try {
    // ✅ ADD: Safe access to publicMetadata
    if (!userData.publicMetadata) {
      console.log('❌ publicMetadata is missing in request');
      res.status(400).json({
        message: 'publicMetadata is required in request body',
      });
      return;
    }

    // ✅ ADD: Safe defaults for userType
    const updateMetadata = {
      userType: userData.publicMetadata.userType || 'student', // Default to student
      settings: userData.publicMetadata.settings || {},
    };

    // console.log('📝 Updating Clerk user with:', updateMetadata);

    const user = await clerkClient.users.updateUser(userId, {
      publicMetadata: updateMetadata,
    });

    res.status(200).json({
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.log('Error updating user:', error);
    res.status(500).json({
      message: 'Error updating user',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
