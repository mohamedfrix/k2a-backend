import * as Minio from 'minio';
import sharp from 'sharp';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image Service for MinIO object storage operations
 * Handles image upload, processing, and URL generation
 */
export class ImageService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor() {
    this.bucketName = config.minio.bucketName;
    this.minioClient = new Minio.Client({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });

    this.initializeBucket();
  }

  /**
   * Initialize MinIO bucket if it doesn't exist
   */
  private async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        logger.info(`MinIO bucket '${this.bucketName}' created successfully`);
        
        // Set bucket policy to allow public read access for images
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        logger.info(`MinIO bucket policy set for public read access`);
      }
    } catch (error) {
      logger.error('Error initializing MinIO bucket:', error);
      throw new Error('Failed to initialize MinIO storage');
    }
  }

  /**
   * Upload image to MinIO with processing
   */
  async uploadVehicleImage(
    vehicleId: string,
    file: Express.Multer.File,
    isPrimary: boolean = false
  ): Promise<{ imagePath: string; imageUrl: string }> {
    try {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const imagePath = `vehicles/${vehicleId}/${filename}`;

      // Process image with Sharp (resize and optimize)
      const processedImageBuffer = await this.processImage(file.buffer);

      // Upload to MinIO
      await this.minioClient.putObject(
        this.bucketName,
        imagePath,
        processedImageBuffer,
        processedImageBuffer.length,
        {
          'Content-Type': file.mimetype,
          'x-amz-meta-vehicle-id': vehicleId,
          'x-amz-meta-is-primary': isPrimary.toString(),
          'x-amz-meta-original-name': file.originalname,
        }
      );

      const imageUrl = this.generateImageUrl(imagePath);

      logger.info(`Image uploaded successfully: ${imagePath}`, {
        vehicleId,
        filename,
        size: processedImageBuffer.length,
      });

      return { imagePath, imageUrl };
    } catch (error) {
      logger.error('Error uploading image to MinIO:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Process image with Sharp (resize, optimize, convert to WebP)
   */
  private async processImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(1200, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toBuffer();
    } catch (error) {
      logger.error('Error processing image with Sharp:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Generate thumbnail version of image
   */
  async generateThumbnail(imagePath: string): Promise<string> {
    try {
      const originalObject = await this.minioClient.getObject(this.bucketName, imagePath);
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of originalObject) {
        chunks.push(chunk);
      }
      const originalBuffer = Buffer.concat(chunks);

      // Generate thumbnail
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(300, 200, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload thumbnail with modified path
      const thumbnailPath = imagePath.replace(/(\.[^.]+)$/, '_thumb$1');
      await this.minioClient.putObject(
        this.bucketName,
        thumbnailPath,
        thumbnailBuffer,
        thumbnailBuffer.length,
        { 'Content-Type': 'image/jpeg' }
      );

      return thumbnailPath;
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Delete image from MinIO
   */
  async deleteImage(imagePath: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, imagePath);
      
      // Also try to delete thumbnail if it exists
      const thumbnailPath = imagePath.replace(/(\.[^.]+)$/, '_thumb$1');
      try {
        await this.minioClient.removeObject(this.bucketName, thumbnailPath);
      } catch (thumbnailError) {
        // Thumbnail might not exist, which is fine
        logger.debug(`Thumbnail not found for deletion: ${thumbnailPath}`);
      }

      logger.info(`Image deleted successfully: ${imagePath}`);
    } catch (error) {
      logger.error('Error deleting image from MinIO:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Delete all images for a vehicle
   */
  async deleteVehicleImages(vehicleId: string): Promise<void> {
    try {
      const objectsStream = this.minioClient.listObjects(
        this.bucketName,
        `vehicles/${vehicleId}/`,
        true
      );

      const objectsToDelete: string[] = [];
      for await (const obj of objectsStream) {
        if (obj.name) {
          objectsToDelete.push(obj.name);
        }
      }

      if (objectsToDelete.length > 0) {
        await this.minioClient.removeObjects(this.bucketName, objectsToDelete);
        logger.info(`Deleted ${objectsToDelete.length} images for vehicle: ${vehicleId}`);
      }
    } catch (error) {
      logger.error('Error deleting vehicle images:', error);
      throw new Error('Failed to delete vehicle images');
    }
  }

  /**
   * Generate public URL for image
   */
  generateImageUrl(imagePath: string): string {
    return `${config.minio.baseUrl}/${this.bucketName}/${imagePath}`;
  }

  /**
   * Generate presigned URL for temporary access (if needed for private images)
   */
  async generatePresignedUrl(imagePath: string, expiry: number = 24 * 60 * 60): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(this.bucketName, imagePath, expiry);
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Check if image exists in MinIO
   */
  async imageExists(imagePath: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, imagePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imagePath: string) {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, imagePath);
      return {
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        contentType: stat.metaData['content-type'],
        metadata: stat.metaData,
      };
    } catch (error) {
      logger.error('Error getting image metadata:', error);
      throw new Error('Failed to get image metadata');
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 5MB.',
      };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const imageService = new ImageService();
