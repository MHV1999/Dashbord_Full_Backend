import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { generateRandomToken, hashToken } from './jwt.utils';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
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

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async createAccessToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      jti: generateRandomToken(16),
      roles: user.roles.map((ur) => ur.role.name),
      scopes: user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name),
      ),
    };
    return this.jwtService.sign(payload);
  }

  async createRefreshToken(user: any, deviceInfo?: string): Promise<{ token: string; hashedToken: string }> {
    const token = generateRandomToken();
    const hashedToken = hashToken(token);
    const jti = generateRandomToken(16);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { token, hashedToken };
  }

  async rotateRefreshToken(oldJti: string, userId: string): Promise<{ token: string; hashedToken: string }> {
    // Revoke old token
    await this.prisma.refreshToken.deleteMany({
      where: { userId, token: hashToken(oldJti) }, // Assuming oldJti is the token
    });

    // Create new one
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    return this.createRefreshToken(user);
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: hashToken(jti) },
    });
  }
}