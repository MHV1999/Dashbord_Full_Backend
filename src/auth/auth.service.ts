import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { generateRandomToken, hashToken } from "./jwt.utils";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user's email/password.
   * Returns user object without password if valid, otherwise null.
   */
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

    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    const { password: _p, ...safe } = user;
    return safe;
  }

  /**
   * Create access token (JWT). Returns token, expiresIn (sec) and jti.
   */
  async createAccessToken(
    user: any,
  ): Promise<{ accessToken: string; expiresIn: number; jti: string }> {
    const jti = generateRandomToken(16);
    const payload = {
      sub: user.id,
      jti,
      roles: user.roles?.map((ur) => ur.role.name) ?? [],
      scopes: user.roles
        ? user.roles.flatMap((ur) =>
            ur.role.permissions.map((rp) => rp.permission.name),
          )
        : [],
    };

    const expiresIn = Number(process.env.ACCESS_TOKEN_TTL) || 900; // seconds fallback
    const accessToken = this.jwtService.sign(payload, { expiresIn });

    return { accessToken, expiresIn, jti };
  }

  /**
   * Create a refresh token: returns raw token (to send to client), jti and expiresAt.
   * Only the hash is stored in DB.
   */
  async createRefreshToken(
    user: any,
    deviceInfo?: string,
  ): Promise<{ token: string; jti: string; expiresAt: Date }> {
    const token = generateRandomToken(32); // raw token returned to client
    const tokenHash = hashToken(token);
    const jti = generateRandomToken(16);
    const ttlSeconds =
      Number(process.env.REFRESH_TOKEN_TTL) || 14 * 24 * 60 * 60; // default 14 days
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await this.prisma.refreshToken.create({
      data: {
        jti,
        tokenHash,
        userId: user.id,
        deviceInfo,
        expiresAt,
        revoked: false,
      },
    });

    return { token, jti, expiresAt };
  }

  /**
   * Mark the old refresh token as revoked (do not delete), then create a fresh one.
   * oldJti is the jti of the refresh token being rotated.
   */
  async rotateRefreshToken(
    oldJti: string,
    userId: string,
    deviceInfo?: string,
  ) {
    // Revoke previous token (if exists)
    await this.prisma.refreshToken.updateMany({
      where: { jti: oldJti, userId },
      data: { revoked: true },
    });

    // Create new token
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");

    return this.createRefreshToken(user, deviceInfo);
  }

  /**
   * Revoke refresh token by jti.
   */
  async revokeRefreshTokenByJti(jti: string) {
    await this.prisma.refreshToken.updateMany({
      where: { jti },
      data: { revoked: true },
    });
  }

  /**
   * Validate raw refresh token (provided by client).
   * Returns the token record (including user) if valid, otherwise null.
   */
  async validateRefreshToken(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) return null;
    if (record.revoked) return null;
    if (record.expiresAt < new Date()) return null;
    return record;
  }

  /**
   * Convenience: sign-in flow: validate credentials, return access and refresh tokens (raw refresh).
   */
  async signInByEmail(email: string, password: string, deviceInfo?: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const {
      accessToken,
      expiresIn,
      jti: accessJti,
    } = await this.createAccessToken(user);
    const {
      token: refreshToken,
      jti: refreshJti,
      expiresAt,
    } = await this.createRefreshToken(user, deviceInfo);

    return {
      accessToken,
      expiresIn,
      accessJti,
      refreshToken, // raw token -> should be sent as HttpOnly cookie
      refreshJti,
      refreshExpiresAt: expiresAt,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
