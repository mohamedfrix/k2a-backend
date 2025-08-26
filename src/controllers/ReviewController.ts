import { Request, Response } from 'express';
import { ReviewService } from '../services/ReviewService';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { createReviewSchema } from '../validators/reviewValidators';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService(prisma);
  }

  private sendError(res: Response, message: string, statusCode = 500, details?: any) {
    logger.error(`ReviewController Error: ${message}`, { statusCode, details });
    return res.status(statusCode).json({ success: false, message, ...(details && { details }) });
  }

  private sendSuccess(res: Response, data: any, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  }

  // Public: submit a review
  submitReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const validated = createReviewSchema.parse(req.body);

      const review = await this.reviewService.createReview({
        name: validated.name,
        email: validated.email,
        message: validated.message,
        source: 'footer'
      });

      logger.info('New review submitted', { reviewId: review.id, ip: req.ip });

      return this.sendSuccess(res, { id: review.id }, 'Review submitted successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return this.sendError(res, 'Validation failed', 400, error.errors);
      }

      logger.error('submitReview failed', { error });
      return this.sendError(res, 'Failed to submit review');
    }
  };

  // Admin: list reviews
  listReviews = async (req: Request, res: Response): Promise<Response> => {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');

      const result = await this.reviewService.getReviews(page, limit);
      return this.sendSuccess(res, result, 'Reviews retrieved successfully');
    } catch (error) {
      logger.error('listReviews failed', { error });
      return this.sendError(res, 'Failed to get reviews');
    }
  };

  // Public: get public reviews for landing page
  getPublicReviews = async (req: Request, res: Response): Promise<Response> => {
    try {
      const limit = parseInt((req.query.limit as string) || '6');
      const reviews = await this.reviewService.getPublicReviews(limit);
      return this.sendSuccess(res, reviews, 'Public reviews retrieved successfully');
    } catch (error) {
      logger.error('getPublicReviews failed', { error });
      return this.sendError(res, 'Failed to get public reviews');
    }
  };

  // Admin: get review by id
  getReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const review = await this.reviewService.getReviewById(id);
      if (!review) return this.sendError(res, 'Review not found', 404);
      return this.sendSuccess(res, review, 'Review retrieved successfully');
    } catch (error) {
      logger.error('getReview failed', { error });
      return this.sendError(res, 'Failed to get review');
    }
  };

  // Admin: update review (e.g., isPublic)
  updateReview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { isPublic, adminNote } = req.body;

      const payload: any = {};
      if (typeof isPublic === 'boolean') payload.isPublic = isPublic;
      if (typeof adminNote === 'string') payload.adminNote = adminNote;

      const updated = await this.reviewService.updateReview(id, payload);
      return this.sendSuccess(res, updated, 'Review updated successfully');
    } catch (error) {
      logger.error('updateReview failed', { error });
      return this.sendError(res, 'Failed to update review');
    }
  };
}

export default ReviewController;
