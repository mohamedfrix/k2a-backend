
import { PrismaClient } from '@prisma/client';

export class ReviewService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createReview(data: { name: string; email?: string; message: string; rating?: number; source?: string; }): Promise<any> {
    const review = await (this.prisma as any).review.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        message: data.message,
        rating: data.rating ?? null,
        source: data.source ?? null,
      }
    });

    return review;
  }

  async getPublicReviews(limit: number = 6): Promise<any[]> {
    return (this.prisma as any).review.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Admin helpers
  async getReviews(page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      (this.prisma as any).review.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      (this.prisma as any).review.count()
    ]);

    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getReviewById(id: string): Promise<any> {
    return (this.prisma as any).review.findUnique({ where: { id } });
  }

  async updateReview(id: string, data: Partial<{ isPublic: boolean; adminNote?: string }>): Promise<any> {
    return (this.prisma as any).review.update({ where: { id }, data });
  }
}
