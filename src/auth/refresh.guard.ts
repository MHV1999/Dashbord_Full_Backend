import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

/**
 * Guard to protect /auth/refresh endpoint.
 * It reads the raw refresh token from cookie "refresh_token" (or header "x-refresh-token")
 * and validates it against hashed value in DB using AuthService.validateRefreshToken().
 *
 * On success it attaches the tokenRecord to request.refreshTokenRecord for controller use.
 */
@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    // Expect refresh token in HttpOnly cookie named "refresh_token"
    const cookieToken = (req.cookies && (req.cookies['refresh_token'] as string)) || null;
    // Optionally support header fallback (useful for testing)
    const headerToken = req.get('x-refresh-token') || null;
    const rawToken = cookieToken || headerToken;
    if (!rawToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokenRecord = await this.authService.validateRefreshToken(rawToken);
    if (!tokenRecord) {
        throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Attach token record to request for controller to rotate/revoke
    (req as any).refreshTokenRecord = tokenRecord;
    // Also attach the raw token so controller can rotate (if needed)
    (req as any).rawRefreshToken = rawToken;
    return true;
  }
}
