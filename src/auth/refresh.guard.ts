import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { hashToken } from './jwt.utils';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = request.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const hashedToken = hashToken(refreshToken);
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        token: hashedToken,
      },
      include: {
        user: true,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Attach user and token record to request
    request['user'] = tokenRecord.user;
    request['refreshToken'] = tokenRecord;

    return true;
  }
}
