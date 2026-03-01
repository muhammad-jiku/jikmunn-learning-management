import { v2 as cloudinary } from 'cloudinary';
import logger from './logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Allowed file types per resource category
 */
export const ALLOWED_FILE_TYPES = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
  video: ['mp4', 'webm', 'mov'],
  raw: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'md'],
} as const;

export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  raw: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * Generate a signature for secure client-side uploads to Cloudinary
 * @param folder - The folder path in Cloudinary to upload to
 * @returns Object containing signature and upload parameters
 */
export const generateUploadSignature = (
  folder: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const allowedFormats = ALLOWED_FILE_TYPES[resourceType].join(',');

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
    allowed_formats: allowedFormats,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    resourceType,
    allowedFormats,
    maxFileSize: MAX_FILE_SIZES[resourceType],
  };
};

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The type of resource (image, video, raw)
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    logger.info(`Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error(`Error deleting from Cloudinary: ${publicId}`, { error });
    throw error;
  }
};

/**
 * Upload a file directly from the server (for server-side uploads)
 * @param filePath - Local file path or URL
 * @param folder - Cloudinary folder to upload to
 * @param options - Additional upload options
 */
export const uploadToCloudinary = async (
  filePath: string,
  folder: string,
  options: {
    resourceType?: 'image' | 'video' | 'raw';
    publicId?: string;
  } = {}
): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: options.resourceType || 'auto',
      public_id: options.publicId,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error('Error uploading to Cloudinary', { error });
    throw error;
  }
};

export default cloudinary;
