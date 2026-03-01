/**
 * Cloudinary client-side upload utilities
 */

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  resourceType?: 'image' | 'video' | 'raw';
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
}

/**
 * Upload a file to Cloudinary using a signed upload
 * @param file - The file to upload
 * @param signatureData - Signature data from the backend
 * @returns The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (
  file: File,
  signatureData: CloudinarySignature
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', signatureData.signature);
  formData.append('timestamp', signatureData.timestamp.toString());
  formData.append('api_key', signatureData.apiKey);
  formData.append('folder', signatureData.folder);

  const resourceType = signatureData.resourceType || 'image';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${resourceType}/upload`;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data: CloudinaryUploadResult = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload an image to Cloudinary with progress tracking
 * @param file - The image file to upload
 * @param signatureData - Signature data from the backend
 * @param onProgress - Progress callback (0-100)
 * @returns The secure URL of the uploaded image
 */
export const uploadImageWithProgress = async (
  file: File,
  signatureData: CloudinarySignature,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signatureData.signature);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('api_key', signatureData.apiKey);
    formData.append('folder', signatureData.folder);

    const xhr = new XMLHttpRequest();
    const resourceType = signatureData.resourceType || 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${resourceType}/upload`;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data: CloudinaryUploadResult = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        const errorData = JSON.parse(xhr.responseText);
        reject(new Error(errorData.error?.message || 'Upload failed'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
};

/**
 * Validate that a file is a valid image
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns True if valid, throws error if invalid
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 10
): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
  }

  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
  }

  return true;
};
