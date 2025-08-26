import { Router } from 'express';
import ReviewController from '../controllers/ReviewController';
import { validateRequest } from '../middleware/validation';
import { createReviewSchema } from '../validators/reviewValidators';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();
const controller = new ReviewController();

// Public submit endpoint
router.post('/', validateRequest(createReviewSchema), controller.submitReview);

// Public: fetch public reviews for landing page
router.get('/public', controller.getPublicReviews);

// Admin routes
router.get('/', authenticateAdmin, controller.listReviews);
router.get('/:id', authenticateAdmin, controller.getReview);
router.patch('/:id', authenticateAdmin, controller.updateReview);

export default router;
