import multer from 'multer';
import { Request } from 'express';
import { imageService } from '@/services/ImageService';

/**
 * Multer configuration for vehicle image uploads
 * Uses memory storage since we'll process and upload to MinIO
 */

// Custom file filter for images
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const validation = imageService.validateImageFile(file);
  
  if (validation.isValid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error || 'Invalid file'));
  }
};

// Memory storage configuration (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// Multer upload configuration
export const uploadVehicleImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files per upload
  },
});

// Middleware for single image upload
export const uploadSingleImage = uploadVehicleImages.single('image');

// Middleware for multiple image upload
export const uploadMultipleImages = uploadVehicleImages.array('images', 10);

// Error handling middleware for multer errors
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 5MB.',
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files per upload.',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field in file upload.',
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message,
        });
    }
  }
  
  // Handle custom validation errors
  if (error.message.includes('Invalid file')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};
