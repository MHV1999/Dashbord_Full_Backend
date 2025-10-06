import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async getUsers(filters: { email?: string; status?: string }) {
    const where: any = {};
    if (filters.email) {
      where.email = { contains: filters.email };
    }
    // Assuming status is not in schema, skip for now

    return this.prisma.user.findMany({
      where,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async impersonate(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create short-lived token (e.g., 1 hour)
    const accessToken = await this.authService.createAccessToken(user);

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        action: 'impersonate',
        userId: adminId,
        details: { impersonatedUserId: userId },
      },
    });

    return { accessToken, expiresIn: 3600 }; // 1 hour
  }

  async getAuditLogs(filters: { userId?: string; action?: string; startDate?: Date; endDate?: Date }) {
    const where: any = {};
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}